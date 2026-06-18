// Glassy custom tooltip for Recharts so it integrates with the surface style.
export default function ChartTooltip({ active, payload, label, unit = '', labelFormatter }) {
  if (!active || !payload || !payload.length) return null
  const ts = payload[0]?.payload?.ts ?? label
  return (
    <div className="rounded-xl border border-white/15 bg-[#0d111c]/85 px-3 py-2 text-xs shadow-glass backdrop-blur-xl">
      <div className="mb-1 text-white/45">
        {labelFormatter ? labelFormatter(ts) : new Date(ts).toLocaleString('es-CL')}
      </div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 tnum">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-white/85">
            {Number(p.value).toLocaleString('es-CL', { maximumFractionDigits: 2 })}
            {unit ? ` ${unit}` : ''}
          </span>
        </div>
      ))}
    </div>
  )
}
