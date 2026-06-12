import GlassCard from './GlassCard'
import Icon from './Icon'

export default function NotConfigured({ onConfigure, message }) {
  return (
    <GlassCard className="mx-auto mt-10 flex max-w-md flex-col items-center p-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15">
        <Icon name="key" className="h-6 w-6 text-accent-soft" />
      </span>
      <h2 className="mt-5 text-lg font-semibold text-white">Conecta con ThingsBoard</h2>
      <p className="mt-2 text-sm leading-relaxed text-white/50">
        {message || 'Ingresa tu contraseña en Configuración para autenticarte y comenzar a recibir telemetría en tiempo real.'}
      </p>
      <button
        onClick={onConfigure}
        className="mt-6 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-glass transition-transform hover:bg-accent-deep active:scale-[0.98]"
      >
        Ir a Configuración
      </button>
    </GlassCard>
  )
}
