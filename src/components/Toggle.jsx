// Interruptor de estilo iOS, reutilizable. El knob usa un blanco fijo
// (bg-[#fff], no el token `white`) para mantenerse blanco en tema claro y oscuro.
export default function Toggle({ checked, onChange, 'aria-label': ariaLabel }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={onChange}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? 'bg-accent' : 'bg-white/15'
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-[#fff] shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}
