import { memo } from 'react'
import GlassCard from './GlassCard'
import Icon from './Icon'
import StatusBadge from './StatusBadge'
import MiniChart from './MiniChart'
import { SENSORS, classify, formatValue } from '../lib/sensors'

function SensorCard({ sensorKey, value, history = [], className = '', large = false, paused = false }) {
  const sensor = SENSORS[sensorKey]
  const level = classify(sensorKey, value)
  const descriptor = sensor.descriptor && value != null ? sensor.descriptor(value) : null

  return (
    <GlassCard
      hover
      className={`flex min-h-0 flex-col overflow-hidden p-5 transition-opacity duration-500 ${
        paused ? 'opacity-50' : ''
      } ${className}`}
    >
      <div className="flex shrink-0 items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${level.color}1F` }}
          >
            <Icon name={sensor.icon} className="h-[18px] w-[18px]" style={{ color: level.color }} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white/70">{sensor.label}</p>
            {descriptor && <p className="truncate text-[11px] text-white/40">{descriptor}</p>}
          </div>
        </div>
        {value != null && <StatusBadge level={level} />}
      </div>

      <div className="mt-4 flex shrink-0 items-end gap-1.5" data-selectable>
        <span className={`tnum font-semibold tracking-tight ${large ? 'text-4xl lg:text-5xl' : 'text-2xl sm:text-3xl'} text-white`}>
          {formatValue(sensorKey, value)}
        </span>
        {sensor.unit && <span className="mb-1 text-sm text-white/45">{sensor.unit}</span>}
      </div>

      {/* base: fixed chart height (card grows to content); sm+: fill the
          remaining space and shrink if tight so it never spills out. */}
      <div className="mt-3 h-12 sm:h-auto sm:min-h-0 sm:flex-1">
        <MiniChart data={history} color={level.color} unit={sensor.unit} />
      </div>

      {large && <p className="mt-2 hidden shrink-0 text-[11px] leading-relaxed text-white/35 lg:block">{sensor.hint}</p>}
    </GlassCard>
  )
}

export default memo(SensorCard)
