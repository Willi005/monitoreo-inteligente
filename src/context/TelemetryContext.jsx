import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
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

  const ingest = useCallback((parsed) => {
    setLatest((prev) => ({ ...prev, ...parsed }))
    setHistory((prev) => {
      const next = { ...prev }
      for (const [key, { ts, value }] of Object.entries(parsed)) {
        if (typeof value !== 'number') continue
        const arr = next[key] ? [...next[key], { ts, value }] : [{ ts, value }]
        next[key] = arr.slice(-MAX_POINTS)
      }
      return next
    })
  }, [])

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

  const presence = derivePresence(latest.distancia?.value)
  // ts of the most recent reading across all keys
  const lastUpdate = Object.values(latest).reduce(
    (max, v) => (v?.ts && v.ts > max ? v.ts : max),
    0
  )

  const values = Object.fromEntries(
    Object.entries(latest).map(([k, v]) => [k, v?.value])
  )

  return (
    <TelemetryContext.Provider
      value={{ latest, values, history, status, presence, lastUpdate, isConfigured }}
    >
      {children}
    </TelemetryContext.Provider>
  )
}

export function useTelemetry() {
  const ctx = useContext(TelemetryContext)
  if (!ctx) throw new Error('useTelemetry must be used within TelemetryProvider')
  return ctx
}
