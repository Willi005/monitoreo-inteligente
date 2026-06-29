import { useEffect } from 'react'
import GlassCard from './GlassCard'
import Icon from './Icon'
import Markdown from './Markdown'
import { SENSORS } from '../lib/sensors'
import { useAlerts } from '../context/AlertsContext'

const AUTO_DISMISS_MS = 45000

function Toast({ alert, onDismiss, onOpenAssistant }) {
  const sensor = SENSORS[alert.sensorKey]
  const color = alert.level.color

  // Auto-cierre una vez que el consejo está listo (el usuario igual puede cerrarlo).
  useEffect(() => {
    if (alert.loading) return
    const t = setTimeout(onDismiss, AUTO_DISMISS_MS)
    return () => clearTimeout(t)
  }, [alert.loading, onDismiss])

  return (
    <GlassCard className="pointer-events-auto relative w-80 overflow-hidden p-4 shadow-glass-lg animate-fade-in">
      <div className="flex items-start gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${color}1F` }}
        >
          <Icon name={sensor.icon} className="h-[18px] w-[18px]" style={{ color }} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide" style={{ color }}>
                <Icon name="alert" className="h-3 w-3" /> Alerta
              </p>
              <p className="truncate text-sm font-semibold text-white">{alert.title}</p>
            </div>
            <button
              onClick={onDismiss}
              aria-label="Cerrar"
              className="shrink-0 text-white/40 transition-colors hover:text-white"
            >
              <Icon name="x" className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-2" data-selectable>
            {alert.loading ? (
              <p className="flex items-center gap-1.5 text-xs text-white/45">
                <Icon name="loader" className="h-3.5 w-3.5 animate-spin" /> Generando recomendación…
              </p>
            ) : (
              <Markdown text={alert.advice} />
            )}
          </div>

          {onOpenAssistant && !alert.loading && (
            <button
              onClick={() => {
                onOpenAssistant()
                onDismiss()
              }}
              className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-accent-soft transition-colors hover:text-accent"
            >
              <Icon name="bot" className="h-3.5 w-3.5" /> Hablar con el asistente
            </button>
          )}
        </div>
      </div>
      <span className="absolute inset-x-0 bottom-0 h-0.5" style={{ backgroundColor: `${color}66` }} />
    </GlassCard>
  )
}

export default function AlertToasts({ onOpenAssistant }) {
  const { alerts, dismiss } = useAlerts()
  if (!alerts.length) return null
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex w-80 flex-col gap-3">
      {alerts.map((a) => (
        <Toast key={a.id} alert={a} onDismiss={() => dismiss(a.id)} onOpenAssistant={onOpenAssistant} />
      ))}
    </div>
  )
}
