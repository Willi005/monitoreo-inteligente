import { useSettings } from '../context/SettingsContext'

// Gradient backdrop with softly blurred color blobs, themed light/dark.
// Kept fully static: animating a large blurred layer underneath glass cards
// forces the browser to recompute every card's backdrop-filter each frame,
// which is the main source of jank. Glass cards floating over a static rich
// background keep the Apple/visionOS look at a fraction of the cost.
export default function AppBackground() {
  const { settings } = useSettings()
  const light = settings.theme === 'light'

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: light
            ? 'radial-gradient(900px 650px at 18% 12%, #dbe4ff 0%, transparent 55%),' +
              'radial-gradient(820px 600px at 85% 18%, #ecdcff 0%, transparent 50%),' +
              'radial-gradient(900px 700px at 70% 95%, #d4eeff 0%, transparent 55%),' +
              'linear-gradient(160deg, #eef2fa 0%, #f5f7fc 55%, #e9edf6 100%)'
            : 'radial-gradient(900px 650px at 18% 12%, #16204a 0%, transparent 55%),' +
              'radial-gradient(820px 600px at 85% 18%, #3a1d52 0%, transparent 50%),' +
              'radial-gradient(900px 700px at 70% 95%, #0c2f44 0%, transparent 55%),' +
              'linear-gradient(160deg, #070a12 0%, #0a0e1a 55%, #070910 100%)',
        }}
      />
      {/* static blobs (no animation) — softer in light mode */}
      <div className={`absolute -left-40 top-10 h-[34rem] w-[34rem] rounded-full blur-[90px] ${light ? 'bg-accent/15' : 'bg-accent/20'}`} />
      <div className={`absolute right-[-12rem] top-1/3 h-[28rem] w-[28rem] rounded-full blur-[90px] ${light ? 'bg-fuchsia-400/10' : 'bg-fuchsia-500/15'}`} />
      <div className={`absolute bottom-[-10rem] left-1/3 h-[30rem] w-[30rem] rounded-full blur-[90px] ${light ? 'bg-cyan-300/10' : 'bg-cyan-400/10'}`} />
      {/* vignette to ground the glass (subtle in light, deeper in dark) */}
      <div
        className="absolute inset-0"
        style={{
          background: light
            ? 'radial-gradient(ellipse at center, transparent 60%, rgba(15,23,42,0.07) 100%)'
            : 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.45) 100%)',
        }}
      />
    </div>
  )
}
