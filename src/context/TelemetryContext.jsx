import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react'
import { useSettings } from './SettingsContext'
import { TbWebSocket } from '../lib/thingsboardWs'
import { getLatest } from '../lib/thingsboard'
import { TELEMETRY_KEYS, derivePresence } from '../lib/sensors'

const MAX_POINTS = 60 // rolling window for live mini-charts

const TelemetryContext = createContext(null)

export function TelemetryProvider({ children }) {
  const { settings, isConfigured } = useSettings()
  const [latest, setLatest] = useState({}) // { key: { ts, value } }
  const [history, setHistory] = useState(() =>
    Object.fromEntries(TELEMETRY_KEYS.map((k) => [k, []]))
  ) // { key: [{ ts, value }] }
  const [status, setStatus] = useState('idle')
  const wsRef = useRef(null)

  // Coalesce incoming WS frames into a single state update per animation frame
  // so bursts of telemetry don't trigger a render storm.
  const bufferRef = useRef({}) // { key: [{ ts, value }] }
  const rafRef = useRef(null)

  const flush = useCallback(() => {
    rafRef.current = null
    const buffer = bufferRef.current
    bufferRef.current = {}
    const keys = Object.keys(buffer)
    if (!keys.length) return

    setLatest((prev) => {
      const next = { ...prev }
      for (const key of keys) {
        const points = buffer[key]
        next[key] = points[points.length - 1]
      }
      return next
    })
    setHistory((prev) => {
      const next = { ...prev }
      for (const key of keys) {
        const points = buffer[key].filter((p) => typeof p.value === 'number')
        if (!points.length) continue
        next[key] = [...(next[key] || []), ...points].slice(-MAX_POINTS)
      }
      return next
    })
  }, [])

  const ingest = useCallback(
    (parsed) => {
      const buffer = bufferRef.current
      for (const [key, point] of Object.entries(parsed)) {
        ;(buffer[key] ||= []).push(point)
      }
      if (rafRef.current == null) {
        rafRef.current = requestAnimationFrame(flush)
      }
    },
    [flush]
  )

  useEffect(() => () => rafRef.current && cancelAnimationFrame(rafRef.current), [])

  const { tbHost, jwt, deviceId } = settings

  useEffect(() => {
    if (!isConfigured) {
      setStatus('idle')
      return
    }

    let cancelled = false

    // Seed current values from REST so the UI is populated immediately.
    getLatest(tbHost, jwt, deviceId, TELEMETRY_KEYS)
      .then((seed) => {
        if (!cancelled && seed && Object.keys(seed).length) ingest(seed)
      })
      .catch(() => {})

    const ws = new TbWebSocket({
      host: tbHost,
      jwt,
      deviceId,
      onData: (parsed) => !cancelled && ingest(parsed),
      onStatus: (s) => !cancelled && setStatus(s),
    })
    ws.connect()
    wsRef.current = ws

    return () => {
      cancelled = true
      ws.close()
      wsRef.current = null
    }
  }, [isConfigured, tbHost, jwt, deviceId, ingest])

  // Derived values recomputed only when `latest` changes (once per frame).
  const { values, presence, lastUpdate } = useMemo(() => {
    const vals = {}
    let last = 0
    for (const [k, v] of Object.entries(latest)) {
      vals[k] = v?.value
      if (v?.ts && v.ts > last) last = v.ts
    }
    return { values: vals, presence: derivePresence(latest.distancia?.value), lastUpdate: last }
  }, [latest])

  const ctxValue = useMemo(
    () => ({ latest, values, history, status, presence, lastUpdate, isConfigured }),
    [latest, values, history, status, presence, lastUpdate, isConfigured]
  )

  return <TelemetryContext.Provider value={ctxValue}>{children}</TelemetryContext.Provider>
}

export function useTelemetry() {
  const ctx = useContext(TelemetryContext)
  if (!ctx) throw new Error('useTelemetry must be used within TelemetryProvider')
  return ctx
}
