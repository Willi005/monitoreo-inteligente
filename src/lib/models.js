// Catálogo de modelos de IA disponibles para el asistente.
// Cada modelo declara su proveedor; la API key se resuelve según el proveedor.
export const AI_MODELS = [
  {
    id: 'gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    provider: 'openrouter',
    model: 'google/gemini-2.5-flash',
    hint: 'Google · vía OpenRouter',
  },
  {
    id: 'gpt-4o-mini',
    label: 'GPT-4o mini',
    provider: 'openrouter',
    model: 'openai/gpt-4o-mini',
    hint: 'OpenAI · vía OpenRouter',
  },
  {
    id: 'llama-3.3-70b',
    label: 'Llama 3.3 70B',
    provider: 'openrouter',
    model: 'meta-llama/llama-3.3-70b-instruct',
    hint: 'Meta · vía OpenRouter',
  },
  {
    id: 'claude-sonnet-4-6',
    label: 'Claude Sonnet 4.6',
    provider: 'anthropic',
    model: 'claude-sonnet-4-6',
    hint: 'Anthropic',
  },
]

export const DEFAULT_MODEL_ID = 'gemini-2.5-flash'

// Resolve the active model + its API key from the stored settings.
export function resolveModel(settings) {
  const m = AI_MODELS.find((x) => x.id === settings.aiModelId) || AI_MODELS[0]
  const apiKey = m.provider === 'anthropic' ? settings.anthropicApiKey : settings.openrouterApiKey
  return { ...m, apiKey }
}
