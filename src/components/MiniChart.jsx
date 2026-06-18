import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip } from 'recharts'
import ChartTooltip from './ChartTooltip'

// Compact sparkline-style area chart for dashboard cards.
// Transparent background to blend with the glass surface.
export default function MiniChart({ data, color = '#409CFF', unit = '', height = '100%' }) {
  const id = `grad-${color.replace('#', '')}`
  if (!data || data.length < 2) {
    return (
      <div
        className="flex h-full items-center justify-center text-[11px] text-white/30"
        style={typeof height === 'number' ? { height } : undefined}
      >
        Esperando datos…
      </div>
    )
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <YAxis hide domain={['dataMin', 'dataMax']} />
        <Tooltip
          content={<ChartTooltip unit={unit} labelFormatter={(ts) => new Date(ts).toLocaleTimeString('es-CL')} />}
          cursor={{ stroke: 'rgba(255,255,255,0.15)' }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${id})`}
          isAnimationActive={false}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
