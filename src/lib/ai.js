import Anthropic from '@anthropic-ai/sdk'
import { SENSORS, classify, derivePresence, formatValue } from './sensors'

function client(apiKey) {
  return new Anthropic({
    apiKey,
    // Running inside an Electron renderer; allow browser-style usage.
    dangerouslyAllowBrowser: true,
  })
}

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

// Generate a short list of automatic recommendations based on current values.
export async function generateRecommendations({ apiKey, model, values }) {
  const anthropic = client(apiKey)
  const context = buildContext(values)
  const msg = await anthropic.messages.create({
    model,
    max_tokens: 700,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Estado actual del entorno:\n${context}\n\nGenera entre 2 y 4 recomendaciones automáticas y priorizadas para mejorar este espacio de trabajo ahora mismo. Usa viñetas cortas, cada una con un breve motivo basado en los datos. Si todo está en buen estado, dilo de forma positiva.`,
      },
    ],
  })
  return msg.content.map((b) => (b.type === 'text' ? b.text : '')).join('')
}

// Free-form chat. `messages` is an array of { role: 'user'|'assistant', content }.
export async function chat({ apiKey, model, values, messages }) {
  const anthropic = client(apiKey)
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
  const msg = await anthropic.messages.create({
    model,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: augmented,
  })
  return msg.content.map((b) => (b.type === 'text' ? b.text : '')).join('')
}
