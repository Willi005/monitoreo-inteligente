import Anthropic from '@anthropic-ai/sdk'
import { SENSORS, classify, derivePresence, formatValue } from './sensors'

// Build a compact, readable snapshot of the environment for the model.
export function buildContext(values) {
  const lines = []
  const order = ['temperatura', 'humedad', 'luz', 'ruido', 'pm25', 'pm1', 'pm4', 'pm10']
  for (const key of order) {
    const v = values[key]
    if (v == null) continue
    const s = SENSORS[key]
    const level = classify(key, v)
    const extra = s.descriptor ? ` (${s.descriptor(v)})` : ''
    lines.push(`- ${s.label}: ${formatValue(key, v)} ${s.unit}${extra} → ${level.label}`)
  }
  const presence = derivePresence(values.distancia)
  lines.push(
    `- Presencia en el escritorio: ${
      presence === null ? 'desconocida' : presence ? 'Sí, hay una persona' : 'No'
    }`
  )
  return lines.join('\n')
}

const SYSTEM_PROMPT = `Eres un asistente experto en ergonomía, calidad del aire y bienestar en espacios de trabajo, integrado en un dashboard de monitoreo ambiental de un escritorio.

Recibes en cada interacción una lectura en tiempo real de sensores ambientales. Úsala SIEMPRE para que tus respuestas sean específicas al estado real del entorno.

Referencias de calidad del aire (OMS, PM2.5 en µg/m³): Bueno 0–12, Moderado 12–35, Malo para grupos sensibles 35–55, Crítico 55+.
Confort: temperatura ideal 20–25 °C, humedad relativa 40–60 %, iluminación de oficina 300–500 lux.

Responde en español, de forma concreta y accionable. Sé breve y cálido. Cuando recomiendes algo, explica brevemente por qué según los datos. No inventes valores que no estén en el contexto.`

// ---- Provider clients ----

async function callAnthropic({ apiKey, model, system, messages, maxTokens }) {
  const anthropic = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
  const msg = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    system,
    messages,
  })
  return msg.content.map((b) => (b.type === 'text' ? b.text : '')).join('')
}

// OpenRouter is OpenAI-compatible (chat completions). CORS is bypassed in the
// Electron renderer (webSecurity:false), so we can call it directly.
async function callOpenRouter({ apiKey, model, system, messages, maxTokens }) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://monitoreo-escritorio.app',
      'X-Title': 'Monitoreo Escritorio',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'system', content: system }, ...messages],
    }),
  })
  if (!res.ok) {
    let detail = ''
    try {
      const j = await res.json()
      detail = j.error?.message || JSON.stringify(j)
    } catch {
      detail = res.statusText
    }
    throw new Error(`OpenRouter ${res.status}: ${detail}`)
  }
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

async function callModel({ provider, apiKey, model, system, messages, maxTokens }) {
  if (!apiKey) throw new Error('Falta la API key para el modelo seleccionado.')
  if (provider === 'anthropic') return callAnthropic({ apiKey, model, system, messages, maxTokens })
  return callOpenRouter({ apiKey, model, system, messages, maxTokens })
}

// Generate a short list of automatic recommendations based on current values.
export async function generateRecommendations({ provider, apiKey, model, values }) {
  const context = buildContext(values)
  return callModel({
    provider,
    apiKey,
    model,
    system: SYSTEM_PROMPT,
    maxTokens: 700,
    messages: [
      {
        role: 'user',
        content: `Estado actual del entorno:\n${context}\n\nGenera entre 2 y 4 recomendaciones automáticas y priorizadas para mejorar este espacio de trabajo ahora mismo. Usa viñetas cortas, cada una con un breve motivo basado en los datos. Si todo está en buen estado, dilo de forma positiva.`,
      },
    ],
  })
}

// Free-form chat. `messages` is an array of { role: 'user'|'assistant', content }.
export async function chat({ provider, apiKey, model, values, messages }) {
  const context = buildContext(values)
  const augmented = [
    {
      role: 'user',
      content: `[Lectura actual de sensores]\n${context}`,
    },
    {
      role: 'assistant',
      content: 'Entendido, tengo presente el estado actual del entorno. ¿En qué puedo ayudarte?',
    },
    ...messages,
  ]
  return callModel({
    provider,
    apiKey,
    model,
    system: SYSTEM_PROMPT,
    maxTokens: 1024,
    messages: augmented,
  })
}
