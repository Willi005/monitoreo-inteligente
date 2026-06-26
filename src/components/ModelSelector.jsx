import { useState, useRef, useEffect } from 'react'
import Icon from './Icon'
import { AI_MODELS } from '../lib/models'
import { useSettings } from '../context/SettingsContext'

// Dropdown to switch the active AI model/provider, agent-style.
// `block` renders a full-width field variant for forms.
export default function ModelSelector({ className = '', block = false }) {
  const { settings, update } = useSettings()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const active = AI_MODELS.find((m) => m.id === settings.aiModelId) || AI_MODELS[0]

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const hasKey = (m) =>
    Boolean(m.provider === 'anthropic' ? settings.anthropicApiKey : settings.openrouterApiKey)

  return (
    <div ref={ref} className={`relative ${block ? 'w-full' : ''} ${className}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`no-drag flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 font-medium text-white/85 transition-colors hover:bg-white/10 ${
          block ? 'w-full justify-between px-3.5 py-2.5 text-sm' : 'px-3 py-1.5 text-xs'
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <Icon name="cpu" className="h-4 w-4 shrink-0 text-accent-soft" />
          <span className={`truncate ${block ? '' : 'max-w-[140px]'}`}>{active.label}</span>
        </span>
        <Icon
          name="chevron-down"
          className={`h-3.5 w-3.5 shrink-0 text-white/40 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          className={`absolute z-50 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#0d111c]/95 p-1.5 shadow-glass-lg backdrop-blur-2xl animate-fade-in ${
            block ? 'left-0 right-0' : 'right-0 w-64'
          }`}
        >
          {AI_MODELS.map((m) => {
            const selected = m.id === active.id
            const keyed = hasKey(m)
            return (
              <button
                key={m.id}
                onClick={() => {
                  update({ aiModelId: m.id })
                  setOpen(false)
                }}
                className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors ${
                  selected ? 'bg-white/10' : 'hover:bg-white/[0.06]'
                }`}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/15">
                  <Icon name="bot" className="h-3.5 w-3.5 text-accent-soft" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-white/90">{m.label}</span>
                  <span className="block truncate text-[11px] text-white/40">{m.hint}</span>
                </span>
                {!keyed && (
                  <span className="shrink-0 rounded-md bg-status-moderate/15 px-1.5 py-0.5 text-[10px] font-medium text-status-moderate">
                    sin key
                  </span>
                )}
                {selected && <Icon name="check" className="h-4 w-4 shrink-0 text-accent-soft" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
