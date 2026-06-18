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

      {/* Bento grid: varied footprints tiling a 4×4 layout. xl positions are
          pinned with col-start/row-start so the asymmetric arrangement is exact:
          Presencia (1×2, top-left), Asistente (2×3, dominant right),
          PM2.5 (2×2, big square, bottom-left) + 4 small sensor blocks. */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:auto-rows-[200px] xl:grid-cols-4 xl:auto-rows-[180px]">
        {/* Presence — tall & narrow, top-left (back to its compact size) */}
        <PresenceCard
          present={presence}
          distance={values.distancia}
          className="md:col-span-2 xl:col-span-1 xl:row-span-2 xl:col-start-1 xl:row-start-1"
        />

        {/* AI assistant — tallest, dominant block */}
        <RecommendationsCard
          onOpenAssistant={onOpenAssistant}
          className="md:col-span-2 md:row-span-2 xl:col-span-2 xl:row-span-3 xl:col-start-3 xl:row-start-1"
        />

        {/* PM2.5 — featured air-quality card (OMS), enlarged to a big square */}
        <SensorCard
          sensorKey="pm25"
          value={values.pm25}
          history={history.pm25}
          large
          className="md:col-span-2 md:row-span-2 xl:col-span-2 xl:row-span-2 xl:col-start-1 xl:row-start-3"
        />

        {/* Secondary sensors — small blocks */}
        <SensorCard sensorKey="temperatura" value={values.temperatura} history={history.temperatura} className="xl:col-start-2 xl:row-start-1" />
        <SensorCard sensorKey="humedad" value={values.humedad} history={history.humedad} className="xl:col-start-2 xl:row-start-2" />
        <SensorCard sensorKey="luz" value={values.luz} history={history.luz} className="xl:col-start-3 xl:row-start-4" />
        <SensorCard sensorKey="ruido" value={values.ruido} history={history.ruido} className="xl:col-start-4 xl:row-start-4" />
      </div>
    </>
  )
}
