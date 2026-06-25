import { useState, useCallback } from 'react'
import GlassCard from './GlassCard'
import Icon from './Icon'
import Markdown from './Markdown'
import { useSettings } from '../context/SettingsContext'
import { useTelemetry } from '../context/TelemetryContext'
import { generateRecommendations } from '../lib/ai'
import { resolveModel } from '../lib/models'

export default function RecommendationsCard({ className = '', onOpenAssistant }) {
  const { settings } = useSettings()
  const { values, lastUpdate } = useTelemetry()
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const active = resolveModel(settings)
  const hasKey = Boolean(active.apiKey)
  const hasData = lastUpdate > 0

  const run = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const out = await generateRecommendations({
        provider: active.provider,
        apiKey: active.apiKey,
        model: active.model,
        values,
      })
      setText(out)
    } catch (e) {
      setError(e.message || 'No se pudo generar la recomendación')
    } finally {
      setLoading(false)
    }
  }, [active.provider, active.apiKey, active.model, values])

  return (
    <GlassCard className={`flex flex-col p-6 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/20">
            <Icon name="sparkles" className="h-5 w-5 text-accent-soft" />
          </span>
          <div>
            <h3 className="text-base font-semibold text-white">Asistente ambiental</h3>
            <p className="text-xs text-white/45">Recomendaciones según tu entorno</p>
          </div>
        </div>
        <button
          onClick={run}
          disabled={loading || !hasKey || !hasData}
          className="no-drag flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 transition-colors hover:bg-white/10 disabled:opacity-40"
        >
          <Icon name={loading ? 'loader' : 'refresh'} className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Analizando…' : 'Generar'}
        </button>
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto" data-selectable>
        {!hasKey ? (
          <p className="text-sm text-white/45">
            Agrega la API key del modelo seleccionado en Configuración para recibir recomendaciones inteligentes.
          </p>
        ) : !hasData ? (
          <p className="text-sm text-white/45">Esperando lecturas de sensores para analizar el entorno…</p>
        ) : error ? (
          <p className="flex items-start gap-2 text-sm text-status-bad">
            <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </p>
        ) : text ? (
          <Markdown text={text} />
        ) : (
          <p className="text-sm text-white/45">
            Pulsa <span className="text-white/70">Generar</span> para que el asistente analice las condiciones actuales y sugiera mejoras.
          </p>
        )}
      </div>

      <button
        onClick={onOpenAssistant}
        className="no-drag mt-4 flex items-center justify-center gap-2 rounded-xl bg-accent/90 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent active:scale-[0.98]"
      >
        <Icon name="bot" className="h-4 w-4" />
        Abrir chat con el asistente
      </button>
    </GlassCard>
  )
}
