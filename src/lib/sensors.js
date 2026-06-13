// Sensor metadata, thresholds and classification logic.
// Telemetry keys from ThingsBoard: distancia, luz, ruido, temperatura,
// humedad, pm1, pm25, pm4, pm10.

export const LEVELS = {
  good: { id: 'good', label: 'Bueno', color: '#5BD6A6', text: 'text-status-good' },
  moderate: { id: 'moderate', label: 'Moderado', color: '#E8C468', text: 'text-status-moderate' },
  bad: { id: 'bad', label: 'Malo', color: '#E88A8A', text: 'text-status-bad' },
  severe: { id: 'severe', label: 'Crítico', color: '#E06B9A', text: 'text-status-severe' },
  unknown: { id: 'unknown', label: 'Sin datos', color: '#8A93A6', text: 'text-white/40' },
}

// Distance (cm) below which we consider a person seated at the desk.
export const PRESENCE_DISTANCE_CM = 120

// ---- Per-variable classifiers ----

function band(value, stops) {
  // stops: ordered [{ max, level }] ; last entry is the fallback (max: Infinity)
  for (const s of stops) {
    if (value <= s.max) return LEVELS[s.level]
  }
  return LEVELS.unknown
}

export const SENSORS = {
  temperatura: {
    key: 'temperatura',
    label: 'Temperatura',
    short: 'Temp.',
    unit: '°C',
    icon: 'thermometer',
    decimals: 1,
    classify: (v) =>
      v < 16 || v >= 30
        ? LEVELS.bad
        : v < 18 || v >= 27
        ? LEVELS.moderate
        : LEVELS.good,
    hint: 'Confort térmico ideal: 20–25 °C',
  },
  humedad: {
    key: 'humedad',
    label: 'Humedad',
    short: 'Hum.',
    unit: '%',
    icon: 'droplets',
    decimals: 0,
    classify: (v) =>
      v < 25 || v >= 70
        ? LEVELS.bad
        : v < 40 || v >= 60
        ? LEVELS.moderate
        : LEVELS.good,
    hint: 'Humedad relativa saludable: 40–60 %',
  },
  luz: {
    key: 'luz',
    label: 'Luz ambiental',
    short: 'Luz',
    unit: 'lux',
    icon: 'sun',
    decimals: 0,
    classify: (v) =>
      v < 100
        ? LEVELS.bad
        : v < 300
        ? LEVELS.moderate
        : v > 1500
        ? LEVELS.moderate
        : LEVELS.good,
    hint: 'Trabajo de oficina recomendado: 300–500 lux',
  },
  ruido: {
    key: 'ruido',
    label: 'Nivel de ruido',
    short: 'Ruido',
    unit: '',
    icon: 'volume-2',
    decimals: 0,
    // KY-037 raw amplitude 0–4095
    classify: (v) =>
      band(v, [
        { max: 50, level: 'good' }, // silencio
        { max: 80, level: 'good' }, // bajo
        { max: 140, level: 'moderate' }, // moderado
        { max: Infinity, level: 'bad' }, // alto
      ]),
    descriptor: (v) =>
      v < 50 ? 'Silencio' : v < 80 ? 'Bajo' : v < 140 ? 'Moderado' : 'Alto',
    hint: 'Amplitud cruda KY-037 (0–4095)',
  },
  pm25: {
    key: 'pm25',
    label: 'PM2.5',
    short: 'PM2.5',
    unit: 'µg/m³',
    icon: 'wind',
    decimals: 1,
    // WHO / AQI thresholds
    classify: (v) =>
      band(v, [
        { max: 12, level: 'good' },
        { max: 35, level: 'moderate' },
        { max: 55, level: 'bad' },
        { max: Infinity, level: 'severe' },
      ]),
    hint: 'OMS — Bueno 0–12 · Moderado 12–35 · Malo 35–55 · Crítico 55+',
  },
  pm1: {
    key: 'pm1',
    label: 'PM1.0',
    short: 'PM1',
    unit: 'µg/m³',
    icon: 'wind',
    decimals: 1,
    classify: (v) =>
      band(v, [
        { max: 10, level: 'good' },
        { max: 25, level: 'moderate' },
        { max: 50, level: 'bad' },
        { max: Infinity, level: 'severe' },
      ]),
    hint: 'Partículas finas < 1 µm',
  },
  pm4: {
    key: 'pm4',
    label: 'PM4.0',
    short: 'PM4',
    unit: 'µg/m³',
    icon: 'wind',
    decimals: 1,
    classify: (v) =>
      band(v, [
        { max: 25, level: 'good' },
        { max: 50, level: 'moderate' },
        { max: 90, level: 'bad' },
        { max: Infinity, level: 'severe' },
      ]),
    hint: 'Partículas < 4 µm',
  },
  pm10: {
    key: 'pm10',
    label: 'PM10',
    short: 'PM10',
    unit: 'µg/m³',
    icon: 'wind',
    decimals: 1,
    classify: (v) =>
      band(v, [
        { max: 54, level: 'good' },
        { max: 154, level: 'moderate' },
        { max: 254, level: 'bad' },
        { max: Infinity, level: 'severe' },
      ]),
    hint: 'OMS — Bueno 0–54 · Moderado 54–154 · Malo 154+',
  },
  distancia: {
    key: 'distancia',
    label: 'Distancia',
    short: 'Dist.',
    unit: 'cm',
    icon: 'ruler',
    decimals: 0,
    classify: () => LEVELS.unknown,
    hint: 'HC-SR04 — usado para detección de presencia',
  },
}

export const TELEMETRY_KEYS = [
  'distancia',
  'luz',
  'ruido',
  'temperatura',
  'humedad',
  'pm1',
  'pm25',
  'pm4',
  'pm10',
]

export function classify(key, value) {
  if (value == null || Number.isNaN(value)) return LEVELS.unknown
  const sensor = SENSORS[key]
  if (!sensor) return LEVELS.unknown
  return sensor.classify(value)
}

export function formatValue(key, value) {
  if (value == null || Number.isNaN(value)) return '—'
  const sensor = SENSORS[key]
  const decimals = sensor?.decimals ?? 1
  return Number(value).toLocaleString('es-CL', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

// Presence is derived from the HC-SR04 distance reading.
export function derivePresence(distancia) {
  if (distancia == null || Number.isNaN(distancia)) return null
  return distancia > 0 && distancia <= PRESENCE_DISTANCE_CM
}

// Human readable air-quality summary for the AI context.
export function airQualitySummary(values) {
  const pm25 = values.pm25
  if (pm25 == null) return 'sin datos de calidad del aire'
  return `${classify('pm25', pm25).label} (PM2.5 ${pm25} µg/m³)`
}
