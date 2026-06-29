import Anthropic from '@anthropic-ai/sdk'
import { SENSORS, classify, derivePresence, formatValue } from './sensors'

// Build a compact, readable snapshot of the environment for the model.
export function buildContext(values) {
  const lines = []
  const order = ['temperatura', 'humedad', 'luz', 'ruido', 'pm25', 'pm1', 'pm10']
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

const SYSTEM_PROMPT = `Eres un asistente experto en ergonomía, confort ambiental y productividad en espacios de trabajo, integrado en un dashboard que monitorea un escritorio con sensores en tiempo real.

En cada interacción recibes las lecturas actuales de los sensores ya clasificadas por nivel. Úsalas SIEMPRE para que tus respuestas sean específicas al estado real del entorno. No inventes valores que no estén en el contexto.

RANGOS DE REFERENCIA (entorno de trabajo):

Temperatura (°C) — DHT11 · ASHRAE 55 / ISO 7730
· Óptimo 20–24 (máxima concentración) · Aceptable 18–26 · Malo <18 o >26 (fatiga) · Crítico <15 o >30.

Humedad relativa (%) — DHT11 · ASHRAE 55 / OMS
· Óptimo 40–60 · Aceptable 30–70 · Malo <30 o >70 (irritación, somnolencia) · Crítico <20 o >80.

PM2.5 (µg/m³) — SPS30 · OMS 2021 / EPA AQI
· Bueno 0–12 · Moderado 12–35 · Malo para sensibles 35–55 · Malo 55–150 · Muy malo >150 (se recomienda abandonar el espacio).

PM1.0 (µg/m³) — SPS30 (derivado de PM2.5)
· Bueno 0–10 · Moderado 10–25 · Malo >25 (penetra profundo en los pulmones).

PM10 (µg/m³) — SPS30 · OMS 2021
· Bueno 0–20 · Moderado 20–45 · Malo 45–100 · Crítico >100.

Luz ambiental (%) — DFR0026 · ISO 8995-1 / EN 12464-1
El sensor entrega un porcentaje del ADC (0–100 %), proporcional a la intensidad luminosa, NO lux directos.
· Insuficiente 0–20 % (≈<200 lux, fatiga visual) · Aceptable 20–50 % (≈200–500 lux) · Óptimo 50–80 % (≈500–800 lux, recomendado para oficina) · Excesivo >80 % (≈>800 lux, deslumbramiento).

Ruido ambiental (dB aprox.) — KY-037 · WHO 2018
Nivel estimado en decibelios a partir de la amplitud del sensor (calibrado en este entorno; es una aproximación, no un sonómetro).
· Silencio <50 dB (ideal para trabajo cognitivo profundo) · Bajo 50–60 dB (oficina tranquila) · Moderado 60–68 dB (distrae) · Alto >68 dB (impacto severo en la concentración).

Presencia — HC-SR04: binaria (hay persona / no hay). Umbral 80 cm. Solo se mide y envía el resto de sensores cuando hay alguien en el escritorio; si no hay presencia, esos valores quedan pausados (son los últimos registrados).

Responde en español, de forma concreta y accionable. Sé breve y cálido. Cuando recomiendes algo, explica el porqué según los datos y el rango afectado. Recuerda: la luz se expresa en % (no lux) y el ruido en dB aproximados (estimados, no de sonómetro calibrado).`

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
