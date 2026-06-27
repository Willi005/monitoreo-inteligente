import { useState, useRef, useEffect, useCallback } from 'react'
import PageHeader from '../components/PageHeader'
import GlassCard from '../components/GlassCard'
import Icon from '../components/Icon'
import Markdown from '../components/Markdown'
import ModelSelector from '../components/ModelSelector'
import { useSettings } from '../context/SettingsContext'
import { useTelemetry } from '../context/TelemetryContext'
import { chat } from '../lib/ai'
import { resolveModel } from '../lib/models'

const SUGGESTIONS = [
  '¿Cómo puedo mejorar la calidad del aire ahora mismo?',
  '¿La iluminación de mi escritorio es adecuada?',
  '¿Qué ajustes me recomiendas para concentrarme mejor?',
  'Resume el estado actual de mi entorno de trabajo.',
]

export default function Assistant() {
  const { settings } = useSettings()
  const { values, lastUpdate } = useTelemetry()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const scrollRef = useRef(null)

  const active = resolveModel(settings)
  const hasKey = Boolean(active.apiKey)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  const send = useCallback(
    async (textArg) => {
      const content = (textArg ?? input).trim()
      if (!content || loading) return
      setError('')
      setInput('')
      const next = [...messages, { role: 'user', content }]
      setMessages(next)
      setLoading(true)
      try {
        const reply = await chat({
          provider: active.provider,
          apiKey: active.apiKey,
          model: active.model,
          values,
          messages: next,
          disabled: settings.disabledSensors || [],
        })
        setMessages((m) => [...m, { role: 'assistant', content: reply }])
      } catch (e) {
        setError(e.message || 'Error al contactar al asistente')
      } finally {
        setLoading(false)
      }
    },
    [input, loading, messages, active.provider, active.apiKey, active.model, values, settings.disabledSensors]
  )

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <>
      <PageHeader title="Asistente IA" subtitle={`${active.hint} · contexto ambiental en vivo`}>
        <ModelSelector />
      </PageHeader>

      <GlassCard className="flex h-[calc(100vh-188px)] flex-col overflow-hidden">
        {/* live context strip */}
        <div className="flex shrink-0 items-center gap-2 border-b border-white/5 px-5 py-2.5 text-[11px] text-white/45">
          <span className="h-1.5 w-1.5 rounded-full bg-status-good" />
          {lastUpdate ? 'El asistente conoce las lecturas actuales de tus sensores' : 'Sin lecturas en vivo todavía'}
        </div>

        {/* messages */}
        <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5" data-selectable>
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15">
                <Icon name="sparkles" className="h-6 w-6 text-accent-soft" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-white">¿En qué puedo ayudarte?</h3>
              <p className="mt-1 max-w-sm text-sm text-white/45">
                Pregúntame cómo mejorar tu entorno de trabajo. Tengo presentes los valores actuales de todos tus sensores.
              </p>
              <div className="mt-6 grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    disabled={!hasKey}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-left text-xs text-white/70 transition-colors hover:bg-white/10 disabled:opacity-40"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent/20">
                  <Icon name="bot" className="h-4 w-4 text-accent-soft" />
                </span>
              )}
              <div
                className={`max-w-[78%] rounded-2xl px-4 py-2.5 ${
                  m.role === 'user'
                    ? 'bg-accent text-white'
                    : 'glass-inset text-white/85'
                }`}
              >
                {m.role === 'user' ? (
                  <p className="whitespace-pre-wrap text-sm">{m.content}</p>
                ) : (
                  <Markdown text={m.content} />
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent/20">
                <Icon name="bot" className="h-4 w-4 text-accent-soft" />
              </span>
              <div className="glass-inset flex items-center gap-1.5 rounded-2xl px-4 py-3">
                <span className="h-2 w-2 animate-pulse-soft rounded-full bg-white/50" />
                <span className="h-2 w-2 animate-pulse-soft rounded-full bg-white/50" style={{ animationDelay: '0.2s' }} />
                <span className="h-2 w-2 animate-pulse-soft rounded-full bg-white/50" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          )}
        </div>

        {/* input */}
        <div className="shrink-0 border-t border-white/5 p-4">
          {error && (
            <p className="mb-2 flex items-center gap-1.5 text-xs text-status-bad">
              <Icon name="alert" className="h-3.5 w-3.5" /> {error}
            </p>
          )}
          {!hasKey && (
            <p className="mb-2 text-xs text-status-moderate">
              Configura tu API key de Anthropic en Configuración para chatear.
            </p>
          )}
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              disabled={!hasKey || loading}
              placeholder="Escribe tu pregunta…"
              className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90 placeholder-white/30 outline-none transition-colors focus:border-accent/60 disabled:opacity-50"
            />
            <button
              onClick={() => send()}
              disabled={!hasKey || loading || !input.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-white transition-all hover:bg-accent-deep active:scale-95 disabled:opacity-40"
            >
              <Icon name={loading ? 'loader' : 'send'} className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </GlassCard>
    </>
  )
}
