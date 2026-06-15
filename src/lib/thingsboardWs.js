import { wsUrl } from './thingsboard'

// Minimal ThingsBoard telemetry WebSocket client with auto-reconnect.
// Subscribes to LATEST_TELEMETRY for a device and emits parsed updates:
//   onData({ temperatura: { ts, value }, ... })
//   onStatus('connecting' | 'open' | 'closed' | 'error')
export class TbWebSocket {
  constructor({ host, jwt, deviceId, onData, onStatus }) {
    this.host = host
    this.jwt = jwt
    this.deviceId = deviceId
    this.onData = onData || (() => {})
    this.onStatus = onStatus || (() => {})
    this.ws = null
    this.cmdId = 1
    this.closedByUser = false
    this.reconnectTimer = null
    this.reconnectDelay = 2000
  }

  connect() {
    this.closedByUser = false
    this.onStatus('connecting')
    const url = `${wsUrl(this.host)}?token=${encodeURIComponent(this.jwt)}`
    try {
      this.ws = new WebSocket(url)
    } catch (e) {
      this.onStatus('error')
      this._scheduleReconnect()
      return
    }

    this.ws.onopen = () => {
      this.onStatus('open')
      this.reconnectDelay = 2000
      this._subscribe()
    }

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        this._handleMessage(msg)
      } catch {
        /* ignore non-JSON frames */
      }
    }

    this.ws.onerror = () => {
      this.onStatus('error')
    }

    this.ws.onclose = () => {
      this.onStatus('closed')
      if (!this.closedByUser) this._scheduleReconnect()
    }
  }

  _subscribe() {
    const cmd = {
      tsSubCmds: [
        {
          entityType: 'DEVICE',
          entityId: this.deviceId,
          scope: 'LATEST_TELEMETRY',
          cmdId: this.cmdId++,
        },
      ],
      historyCmds: [],
      attrSubCmds: [],
    }
    this.ws.send(JSON.stringify(cmd))
  }

  _handleMessage(msg) {
    const data = msg?.data || msg?.latestValues
    if (!data || typeof data !== 'object') return
    const parsed = {}
    for (const [key, arr] of Object.entries(data)) {
      if (Array.isArray(arr) && arr.length) {
        const [ts, raw] = arr[0]
        const num = Number(raw)
        parsed[key] = { ts, value: Number.isNaN(num) ? raw : num }
      }
    }
    if (Object.keys(parsed).length) this.onData(parsed)
  }

  _scheduleReconnect() {
    clearTimeout(this.reconnectTimer)
    this.reconnectTimer = setTimeout(() => this.connect(), this.reconnectDelay)
    this.reconnectDelay = Math.min(this.reconnectDelay * 1.6, 15000)
  }

  close() {
    this.closedByUser = true
    clearTimeout(this.reconnectTimer)
    if (this.ws) {
      try {
        this.ws.close()
      } catch {
        /* noop */
      }
      this.ws = null
    }
  }
}
