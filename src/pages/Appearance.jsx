import PageHeader from '../components/PageHeader'
import GlassCard from '../components/GlassCard'
import Icon from '../components/Icon'
import Toggle from '../components/Toggle'
import { useSettings } from '../context/SettingsContext'
import { SENSORS } from '../lib/sensors'

// Sensores con tarjeta en el Dashboard que se pueden habilitar/deshabilitar.
const TOGGLEABLE = ['pm25', 'temperatura', 'humedad', 'luz', 'ruido']

// Cada tema lleva los colores con los que se dibuja su mini-maqueta (fondo,
// superficie de vidrio, borde, acento y un tono apagado para los detalles).
const THEMES = [
  {
    id: 'dark',
    label: 'Oscuro',
    icon: 'moon',
    bg: 'linear-gradient(160deg, #0a0e1a 0%, #141a30 100%)',
    tile: 'rgba(255,255,255,0.10)',
    tileBorder: 'rgba(255,255,255,0.16)',
    accent: '#409CFF',
    muted: 'rgba(255,255,255,0.28)',
    footerBg: '#11151f',
    footerText: 'rgba(255,255,255,0.85)',
    chipBg: 'rgba(255,255,255,0.12)',
  },
  {
    id: 'light',
    label: 'Claro',
    icon: 'sun',
    bg: 'linear-gradient(160deg, #eef2fa 0%, #dbe4ff 100%)',
    tile: 'rgba(255,255,255,0.75)',
    tileBorder: 'rgba(15,23,42,0.12)',
    accent: '#0A84FF',
    muted: 'rgba(15,23,42,0.28)',
    footerBg: '#f4f6fb',
    footerText: 'rgba(15,23,42,0.85)',
    chipBg: 'rgba(15,23,42,0.1)',
  },
]

// Recuadro cuya misión es mostrar visualmente cómo se ve la app en ese tema:
// una mini-maqueta con sidebar, barra superior y un bento con acento.
function ThemePreview({ theme, active, onSelect }) {
  const tile = { background: theme.tile, border: `1px solid ${theme.tileBorder}` }
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`group relative overflow-hidden rounded-2xl border text-left transition-all ${
        active ? 'border-accent/70 ring-2 ring-accent/40' : 'border-white/10 hover:border-white/20'
      }`}
    >
      <div className="flex h-24 gap-1.5 p-2" style={{ background: theme.bg }}>
        {/* sidebar */}
        <div className="flex w-4 flex-col items-center gap-1 rounded-md py-1.5" style={tile}>
          <span className="h-1 w-1 rounded-full" style={{ background: theme.accent }} />
          <span className="h-1 w-1 rounded-full" style={{ background: theme.muted }} />
          <span className="h-1 w-1 rounded-full" style={{ background: theme.muted }} />
        </div>
        {/* contenido */}
        <div className="flex flex-1 flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="h-1.5 w-9 rounded-full" style={{ background: theme.muted }} />
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: theme.accent }} />
          </div>
          <div className="grid flex-1 grid-cols-3 grid-rows-2 gap-1">
            <div className="row-span-2 rounded-md" style={tile} />
            <div className="col-span-2 rounded-md" style={tile} />
            <div className="rounded-md" style={tile} />
            <div className="relative overflow-hidden rounded-md" style={tile}>
              <span className="absolute bottom-1 left-1 h-1 w-4 rounded-full" style={{ background: theme.accent }} />
            </div>
          </div>
        </div>
      </div>

      {/* etiqueta compacta — colores fijos del tema que representa, no del
          tema actual de la app */}
      <div
        className="flex items-center justify-between gap-2 px-2.5 py-2"
        style={{ background: theme.footerBg }}
      >
        <span
          className="flex items-center gap-1.5 text-xs font-medium"
          style={{ color: theme.footerText }}
        >
          <Icon name={theme.icon} className="h-3.5 w-3.5" style={{ color: theme.accent }} />
          {theme.label}
        </span>
        <span
          className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-all"
          style={{ background: active ? '#0A84FF' : theme.chipBg }}
        >
          <Icon
            name="check-mark"
            className="h-2.5 w-2.5"
            style={{ color: active ? '#fff' : 'transparent' }}
          />
        </span>
      </div>
    </button>
  )
}

export default function Appearance() {
  const { settings, update } = useSettings()
  const theme = settings.theme === 'light' ? 'light' : 'dark'
  const disabled = settings.disabledSensors || []

  const setTheme = (id) => update({ theme: id })

  const toggleSensor = (key) => {
    const next = disabled.includes(key)
      ? disabled.filter((k) => k !== key)
      : [...disabled, key]
    update({ disabledSensors: next })
  }

  return (
    <>
      <PageHeader title="Apariencia" subtitle="Tema visual y sensores del panel" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Tema — alto ajustado al contenido (bento), no estirado a la otra columna */}
        <GlassCard className="self-start p-6">
          <div className="mb-5 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/20">
              <Icon name="palette" className="h-[18px] w-[18px] text-accent-soft" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-white">Tema</h3>
              <p className="text-xs text-white/45">Modo claro u oscuro de la aplicación</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {THEMES.map((t) => (
              <ThemePreview
                key={t.id}
                theme={t}
                active={theme === t.id}
                onSelect={() => setTheme(t.id)}
              />
            ))}
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-white/40">
            Se aplica al instante y se conserva al reabrir la app.
          </p>
        </GlassCard>

        {/* Sensores del panel */}
        <GlassCard className="p-6">
          <div className="mb-5 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/20">
              <Icon name="eye" className="h-[18px] w-[18px] text-accent-soft" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-white">Sensores del panel</h3>
              <p className="text-xs text-white/45">Habilita o deshabilita tarjetas del Dashboard</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {TOGGLEABLE.map((key) => {
              const sensor = SENSORS[key]
              const enabled = !disabled.includes(key)
              return (
                <div
                  key={key}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06]">
                      <Icon
                        name={sensor.icon}
                        className={`h-[18px] w-[18px] ${enabled ? 'text-white/70' : 'text-white/35'}`}
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white/85">{sensor.label}</p>
                      <p className="truncate text-[11px] text-white/40">
                        {enabled ? 'Visible en el Dashboard' : 'Tarjeta en estado deshabilitado'}
                      </p>
                    </div>
                  </div>
                  <Toggle
                    checked={enabled}
                    onChange={() => toggleSensor(key)}
                    aria-label={`Habilitar ${sensor.label}`}
                  />
                </div>
              )
            })}
          </div>

          <p className="mt-4 text-[11px] leading-relaxed text-white/40">
            Al deshabilitar un sensor, su tarjeta se muestra en estado pausado en el Dashboard y deja
            de generar alertas automáticas. La presencia siempre permanece activa.
          </p>
        </GlassCard>
      </div>
    </>
  )
}
