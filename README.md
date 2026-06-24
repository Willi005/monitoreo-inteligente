# Monitoreo Escritorio

Aplicación de escritorio (Electron + React + Vite + Tailwind) para monitorear las
condiciones ambientales de un escritorio a partir de un prototipo IoT basado en
**ESP32-WROOM-32X** que publica telemetría a **ThingsBoard** vía MQTT.

Sensores: HC-SR04 (presencia), DHT11 (temperatura/humedad), SPS30 (PM1.0/2.5/4.0/10),
KY-037 (ruido) y DFRobot DFR0026 (luz).

## Características

- **Dashboard en tiempo real** con layout *bento grid* y estética *glassmorphism*
  (visionOS / Apple). Tarjetas por sensor con valor actual, mini-gráfico de
  historial reciente (Recharts) e indicador de presencia destacado.
- **Historial** con selector de rango (presets + rango personalizado) que consume
  la REST API de ThingsBoard.
- **Asistente de IA** (API de Anthropic, modelo `claude-sonnet-4-6`) que genera
  recomendaciones automáticas según el estado del entorno y responde preguntas.
  Recibe en cada mensaje los valores actuales de todos los sensores como contexto.

## Tecnología

- Tiempo real: **WebSocket** de ThingsBoard (`/api/ws/plugins/telemetry`).
- Historial: **REST API** (`/api/plugins/telemetry/DEVICE/{deviceId}/values/timeseries`).
- Autenticación: login con usuario/contraseña → JWT (configurable en la app).

## Puesta en marcha

```bash
npm install

# (opcional) API key de Anthropic por variable de entorno
cp .env.example .env   # y edita VITE_ANTHROPIC_API_KEY

# Desarrollo (Vite + Electron con hot reload)
npm run dev

# Build de producción + ejecutar en Electron
npm start
```

## Configuración

Abre **Configuración** dentro de la app:

1. Servidor ThingsBoard (por defecto `http://200.13.5.20:8080`).
2. Usuario y **contraseña** → pulsa *Conectar y obtener token*. Se obtiene el JWT
   y se resuelve el *Device ID* a partir del nombre `monitoreo-escritorio`.
3. **API Key de Anthropic** (o variable `VITE_ANTHROPIC_API_KEY`).

Los datos se guardan en `localStorage`. La API key nunca se envía a ThingsBoard.

## Notas

- La ventana de Electron usa `webSecurity: false` para permitir las llamadas
  REST/WebSocket directas a ThingsBoard y a la API de Anthropic sin bloqueos CORS,
  apropiado para una app de escritorio local que apunta a un servidor fijo.
- Claves de telemetría esperadas: `distancia, luz, ruido, temperatura, humedad,
  pm1, pm25, pm4, pm10`.
- Umbrales PM2.5 (OMS): Bueno 0–12 · Moderado 12–35 · Malo 35–55 · Crítico 55+.
  Ruido (KY-037, amplitud 0–4095): Silencio <50 · Bajo <80 · Moderado <140 · Alto 140+.
