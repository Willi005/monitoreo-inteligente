import { useSettings } from '../context/SettingsContext'

// Subtle, low-saturation status pill. Color is paired with a text label so
// meaning is never conveyed by color alone (a11y: color-not-only).
export default function StatusBadge({ level, label }) {
  const { settings } = useSettings()
  const light = settings.theme === 'light'
  const text = label ?? level?.label ?? ''
  // En claro usa la variante oscura del nivel para legibilidad, con un fondo y
  // borde algo más presentes sobre el vidrio blanco.
  const color = (light && level?.light) || level?.color || '#8A93A6'
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium"
      style={{
        color,
        backgroundColor: `${color}${light ? '24' : '1A'}`,
        border: `1px solid ${color}${light ? '55' : '33'}`,
      }}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      {text}
    </span>
  )
}
