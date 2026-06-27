import PageHeader from '../components/PageHeader'
import GlassCard from '../components/GlassCard'
import Icon from '../components/Icon'
import Toggle from '../components/Toggle'
import { useSettings } from '../context/SettingsContext'
import { SENSORS } from '../lib/sensors'

// Sensores con tarjeta en el Dashboard que se pueden habilitar/deshabilitar.
const TOGGLEABLE = ['pm25', 'temperatura', 'humedad', 'luz', 'ruido']

const THEMES = [
  {
    id: 'dark',
    label: 'Oscuro',
    desc: 'Vidrio sobre fondo profundo',
    icon: 'moon',
    // gradiente del preview (coincide con AppBackground oscuro)
    bg: 'linear-gradient(160deg, #0a0e1a 0%, #141a30 100%)',
    tile: 'rgba(255,255,255,0.10)',
    tileBorder: 'rgba(255,255,255,0.18)',
  },
  {
    id: 'light',
    label: 'Claro',
    desc: 'Vidrio blanco sobre fondo claro',
    icon: 'sun',
    bg: 'linear-gradient(160deg, #eef2fa 0%, #dbe4ff 100%)',
    tile: 'rgba(255,255,255,0.7)',
    tileBorder: 'rgba(15,23,42,0.12)',
  },
]

function ThemePreview({ theme, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`group relative flex flex-col gap-3 rounded-2xl border p-3 text-left transition-all ${
        active
          ? 'border-accent/70 ring-2 ring-accent/40'
          : 'border-white/10 hover:border-white/20'
      }`}
    >
      {/* Mini maqueta del tema */}
      <div
        className="relative h-24 overflow-hidden rounded-xl"
        style={{ background: theme.bg }}
      >
        <div
          className="absolute left-3 top-3 h-[18px] w-16 rounded-md"
          style={{ background: theme.tile, border: `1px solid ${theme.tileBorder}` }}
        />
        <div
          className="absolute left-3 top-9 h-9 w-24 rounded-md"
          style={{ background: theme.tile, border: `1px solid ${theme.tileBorder}` }}
        />
        <div
          className="absolute right-3 top-3 bottom-3 w-10 rounded-md"
          style={{ background: theme.tile, border: `1px solid ${theme.tileBorder}` }}
        />
      </div>

      <div className="flex items-center justify-between gap-2 px-0.5">
        <div className="flex items-center gap-2">
          <Icon name={theme.icon} className="h-4 w-4 text-accent-soft" />
          <div>
            <p className="text-sm font-medium text-white/90">{theme.label}</p>
            <p className="text-[11px] text-white/45">{theme.desc}</p>
          </div>
        </div>
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all ${
            active ? 'bg-accent text-white' : 'bg-white/10 text-transparent'
          }`}
        >
          <Icon name="check-mark" className="h-3 w-3" />
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

          <p className="mt-4 text-[11px] leading-relaxed text-white/40">
            El cambio se aplica al instante y se conserva al reabrir la aplicación. El modo claro
            mantiene el mismo estilo de vidrio esmerilado sobre un fondo luminoso.
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
