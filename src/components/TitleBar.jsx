import Icon from './Icon'
import { useTelemetry } from '../context/TelemetryContext'

const STATUS_META = {
  open: { label: 'En vivo', color: '#5BD6A6', icon: 'wifi' },
  connecting: { label: 'Conectando…', color: '#E8C468', icon: 'wifi' },
  closed: { label: 'Desconectado', color: '#E88A8A', icon: 'wifi-off' },
  error: { label: 'Error de conexión', color: '#E88A8A', icon: 'wifi-off' },
  idle: { label: 'Sin configurar', color: '#8A93A6', icon: 'wifi-off' },
}

function WinButton({ name, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={`no-drag flex h-8 w-11 items-center justify-center text-white/60 transition-colors hover:text-white ${
        danger ? 'hover:bg-red-500/80' : 'hover:bg-white/10'
      }`}
    >
      <Icon name={name} className="h-3.5 w-3.5" />
    </button>
  )
}

export default function TitleBar() {
  const { status, lastUpdate } = useTelemetry()
  const meta = STATUS_META[status] || STATUS_META.idle
  const api = typeof window !== 'undefined' ? window.electronAPI : null

  return (
    <header className="drag-region flex h-11 shrink-0 items-center justify-between border-b border-white/5 px-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-accent/20">
          <Icon name="activity" className="h-3.5 w-3.5 text-accent-soft" />
        </div>
        <span className="truncate text-[13px] font-semibold tracking-tight text-white/85">
          Monitoreo Escritorio
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div
          className="no-drag flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium"
          style={{
            color: meta.color,
            borderColor: `${meta.color}33`,
            backgroundColor: `${meta.color}14`,
          }}
          title={lastUpdate ? `Última lectura: ${new Date(lastUpdate).toLocaleString('es-CL')}` : ''}
        >
          <Icon name={meta.icon} className="h-3 w-3 shrink-0" />
          <span className="hidden sm:inline">{meta.label}</span>
          {status === 'open' && (
            <span className="ml-0.5 h-1.5 w-1.5 animate-pulse-soft rounded-full bg-status-good" />
          )}
        </div>

        {api && api.platform !== 'darwin' && (
          <div className="flex items-center">
            <WinButton name="minus" onClick={() => api.minimize()} />
            <WinButton name="square" onClick={() => api.maximize()} />
            <WinButton name="x" onClick={() => api.close()} danger />
          </div>
        )}
      </div>
    </header>
  )
}
