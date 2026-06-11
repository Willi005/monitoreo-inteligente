// Subtle, low-saturation status pill. Color is paired with a text label so
// meaning is never conveyed by color alone (a11y: color-not-only).
export default function StatusBadge({ level, label }) {
  const text = label ?? level?.label ?? ''
  const color = level?.color ?? '#8A93A6'
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{
        color,
        backgroundColor: `${color}1A`,
        border: `1px solid ${color}33`,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {text}
    </span>
  )
}
