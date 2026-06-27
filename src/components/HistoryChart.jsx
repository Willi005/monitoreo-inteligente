import { memo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import GlassCard from './GlassCard'
import Icon from './Icon'
import ChartTooltip from './ChartTooltip'
import { SENSORS } from '../lib/sensors'
import { useSettings } from '../context/SettingsContext'

// Colores de ejes/rejilla por tema. Recharts los recibe como props inline, así
// que no los alcanza la inversión de utilidades; se eligen según el tema.
const CHART_COLORS = {
  dark: {
    axis: 'rgba(255,255,255,0.4)',
    grid: 'rgba(255,255,255,0.06)',
    axisLine: 'rgba(255,255,255,0.08)',
    cursor: 'rgba(255,255,255,0.15)',
  },
  light: {
    axis: 'rgba(15,23,42,0.55)',
    grid: 'rgba(15,23,42,0.08)',
    axisLine: 'rgba(15,23,42,0.14)',
    cursor: 'rgba(15,23,42,0.2)',
  },
}

function ChartSkeleton() {
  return (
    <div className="relative h-full overflow-hidden rounded-lg">
      {/* base skeleton bars */}
      <div className="flex h-full items-end gap-1.5 px-1 pb-1">
        {[40, 65, 50, 80, 60, 90, 55, 75, 45, 70, 85, 50].map((h, i) => (
          <div key={i} className="flex-1 rounded-sm bg-white/[0.05]" style={{ height: `${h}%` }} />
        ))}
      </div>
      {/* single light streak sweeping across, left → right, repeating */}
      <div
        className="pointer-events-none absolute inset-0 animate-shimmer"
        style={{
          background:
            'linear-gradient(100deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)',
        }}
      />
    </div>
  )
}

function HistoryChart({ sensorKey, data = [], color = '#409CFF', spanDays = 1, loading = false }) {
  const sensor = SENSORS[sensorKey]
  const { settings } = useSettings()
  const c = settings.theme === 'light' ? CHART_COLORS.light : CHART_COLORS.dark
  const axisTick = { fill: c.axis, fontSize: 11 }
  const fmtTime = (ts) =>
    spanDays > 2
      ? new Date(ts).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' })
      : new Date(ts).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })

  return (
    <GlassCard className="flex flex-col p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}1F` }}>
            <Icon name={sensor.icon} className="h-4 w-4" style={{ color }} />
          </span>
          <h3 className="text-sm font-medium text-white/80">{sensor.label}</h3>
        </div>
        {sensor.unit && <span className="text-xs text-white/40">{sensor.unit}</span>}
      </div>

      <div className="h-[200px]">
        {loading ? (
          <ChartSkeleton />
        ) : data.length < 2 ? (
          <div className="flex h-full items-center justify-center text-xs text-white/30">
            Sin datos en este rango
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: -12 }}>
              <CartesianGrid stroke={c.grid} vertical={false} />
              <XAxis
                dataKey="ts"
                tickFormatter={fmtTime}
                tick={axisTick}
                axisLine={{ stroke: c.axisLine }}
                tickLine={false}
                tickMargin={10}
                height={34}
                minTickGap={40}
                interval="preserveStartEnd"
                padding={{ left: 12, right: 10 }}
              />
              <YAxis tick={axisTick} axisLine={false} tickLine={false} width={44} />
              <Tooltip
                content={<ChartTooltip unit={sensor.unit} labelFormatter={(ts) => new Date(ts).toLocaleString('es-CL')} />}
                cursor={{ stroke: c.cursor }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </GlassCard>
  )
}

export default memo(HistoryChart)
