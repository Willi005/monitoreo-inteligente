import Icon from './Icon'
import { useTelemetry } from '../context/TelemetryContext'
import { useSettings } from '../context/SettingsContext'
import logoLight from '../assets/logo-light.svg'
import logoDark from '../assets/logo-dark.svg'

// Cada estado lleva color para tema oscuro (menta/ámbar de baja saturación) y
// una variante para tema claro: más oscura y saturada para alcanzar el
// contraste mínimo (≥4.5:1) sobre el fondo claro del chip.
const STATUS_META = {
  open: { label: 'En vivo', icon: 'wifi', color: '#5BD6A6', light: '#0066CC' },
  connecting: { label: 'Conectando…', icon: 'wifi', color: '#E8C468', light: '#B45309' },
  closed: { label: 'Desconectado', icon: 'wifi-off', color: '#E88A8A', light: '#DC2626' },
  error: { label: 'Error de conexión', icon: 'wifi-off', color: '#E88A8A', light: '#DC2626' },
  idle: { label: 'Sin configurar', icon: 'wifi-off', color: '#8A93A6', light: '#475569' },
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
  const { settings } = useSettings()
  const meta = STATUS_META[status] || STATUS_META.idle
  const light = settings.theme === 'light'
  const color = light ? meta.light : meta.color
  // Chip un poco más presente en claro (fondo y borde con más cuerpo).
  const bgAlpha = light ? '1F' : '14'
  const borderAlpha = light ? '4D' : '33'
  const api = typeof window !== 'undefined' ? window.electronAPI : null

  return (
    <header className="drag-region flex h-11 shrink-0 items-center justify-between border-b border-white/5 px-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <img
          src={light ? logoLight : logoDark}
          alt="DeskSense"
          draggable={false}
          className="h-6 w-6 shrink-0 rounded-[7px]"
        />
        <span className="truncate text-[13px] font-semibold tracking-tight text-white/85">
          DeskSense
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div
          className="no-drag flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium"
          style={{
            color,
            borderColor: `${color}${borderAlpha}`,
            backgroundColor: `${color}${bgAlpha}`,
          }}
          title={lastUpdate ? `Última lectura: ${new Date(lastUpdate).toLocaleString('es-CL')}` : ''}
        >
          <Icon name={meta.icon} className="h-3 w-3 shrink-0" />
          <span className="hidden sm:inline">{meta.label}</span>
          {status === 'open' && (
            <span
              className="ml-0.5 h-1.5 w-1.5 animate-pulse-soft rounded-full"
              style={{ backgroundColor: color }}
            />
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
