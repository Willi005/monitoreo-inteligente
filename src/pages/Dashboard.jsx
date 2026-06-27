import PageHeader from '../components/PageHeader'
import SensorCard from '../components/SensorCard'
import PresenceCard from '../components/PresenceCard'
import RecommendationsCard from '../components/RecommendationsCard'
import NotConfigured from '../components/NotConfigured'
import { useTelemetry } from '../context/TelemetryContext'

export default function Dashboard({ onOpenAssistant, onNavigate }) {
  const { values, history, presence, isConfigured, lastUpdate } = useTelemetry()

  const updated = lastUpdate
    ? new Date(lastUpdate).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null

  if (!isConfigured) {
    return (
      <>
        <PageHeader title="Dashboard" subtitle="Estado ambiental en tiempo real" />
        <NotConfigured onConfigure={() => onNavigate('settings')} message="Conecta con ThingsBoard desde Configuración para ver la telemetría en vivo del escritorio." />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={updated ? `Última lectura · ${updated}` : 'Esperando primera lectura…'}
      />

      {/* Responsive bento:
          · base (<640px): single column, cards size to content.
          · sm–lg (640–1023px): balanced 2-column flow (no stretched cards).
          · lg+ (≥1024px): exact 4×4 bento pinned with col-start/row-start.
          DOM order is tuned for the 2-col flow; lg positions are explicit so
          order doesn't affect the bento arrangement. */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:auto-rows-[190px] sm:gap-4 lg:grid-cols-4 lg:auto-rows-[168px] xl:auto-rows-[190px]">
        {/* Presence — lg: tall & narrow, top-left */}
        <PresenceCard
          present={presence}
          distance={values.distancia}
          className="lg:col-span-1 lg:row-span-2 lg:col-start-1 lg:row-start-1"
        />

        {/* PM2.5 — lg: big square, bottom-left */}
        <SensorCard
          sensorKey="pm25"
          value={values.pm25}
          history={history.pm25}
          large
          className="lg:col-span-2 lg:row-span-2 lg:col-start-1 lg:row-start-3"
        />

        {/* Secondary sensors — small blocks */}
        <SensorCard sensorKey="temperatura" value={values.temperatura} history={history.temperatura} className="lg:col-start-2 lg:row-start-1" />
        <SensorCard sensorKey="humedad" value={values.humedad} history={history.humedad} className="lg:col-start-2 lg:row-start-2" />
        <SensorCard sensorKey="luz" value={values.luz} history={history.luz} className="lg:col-start-3 lg:row-start-4" />
        <SensorCard sensorKey="ruido" value={values.ruido} history={history.ruido} className="lg:col-start-4 lg:row-start-4" />

        {/* AI assistant — lg: tallest dominant block (right); sm: full-width */}
        <RecommendationsCard
          onOpenAssistant={onOpenAssistant}
          className="sm:col-span-2 sm:row-span-2 lg:col-span-2 lg:row-span-3 lg:col-start-3 lg:row-start-1"
        />
      </div>
    </>
  )
}
