import GlassCard from './GlassCard'
import Icon from './Icon'

// Large, unmistakable presence indicator (the most important card).
export default function PresenceCard({ present, distance, className = '' }) {
  const unknown = present === null || present === undefined
  const color = unknown ? '#8A93A6' : present ? '#5BD6A6' : '#8A93A6'
  const title = unknown ? 'Sin datos' : present ? 'Presencia detectada' : 'Escritorio libre'
  const subtitle = unknown
    ? 'Esperando lectura del sensor'
    : present
    ? 'Hay una persona en el escritorio'
    : 'No se detecta a nadie ahora'

  return (
    <GlassCard className={`relative flex flex-col justify-between overflow-hidden p-6 ${className}`}>
      {/* ambient glow keyed to state */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full blur-[90px] transition-colors duration-700"
        style={{ backgroundColor: `${color}40` }}
      />
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white/55">Presencia</span>
        <span
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
          style={{ color, backgroundColor: `${color}1A`, border: `1px solid ${color}33` }}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${present ? 'animate-pulse-soft' : ''}`}
            style={{ backgroundColor: color }}
          />
          {present ? 'Activo' : unknown ? '—' : 'Inactivo'}
        </span>
      </div>

      <div className="relative flex flex-col items-center justify-center py-6">
        <span
          className="flex h-24 w-24 items-center justify-center rounded-full ring-1 transition-all duration-500"
          style={{
            backgroundColor: `${color}1A`,
            boxShadow: `0 0 60px ${color}33`,
            borderColor: `${color}55`,
          }}
        >
          <Icon
            name={present ? 'user-check' : 'user-x'}
            className="h-11 w-11"
            style={{ color }}
          />
        </span>
        <h3 className="mt-5 text-2xl font-semibold tracking-tight text-white">{title}</h3>
        <p className="mt-1 text-sm text-white/45">{subtitle}</p>
      </div>

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-white/35">
        <Icon name="ruler" className="h-3.5 w-3.5" />
        Distancia: <span className="tnum text-white/60">{distance != null ? `${Math.round(distance)} cm` : '—'}</span>
      </div>
    </GlassCard>
  )
}
