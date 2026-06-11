// Dark gradient backdrop with softly floating, blurred color blobs.
// Glass cards float on top of this layer.
export default function AppBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(1200px 800px at 18% 12%, #16204a 0%, transparent 55%),' +
            'radial-gradient(1000px 700px at 85% 18%, #3a1d52 0%, transparent 50%),' +
            'radial-gradient(1100px 900px at 70% 95%, #0c2f44 0%, transparent 55%),' +
            'linear-gradient(160deg, #070a12 0%, #0a0e1a 55%, #070910 100%)',
        }}
      />
      {/* drifting blobs */}
      <div className="absolute -left-40 top-10 h-[36rem] w-[36rem] rounded-full bg-accent/20 blur-[140px] animate-float" />
      <div
        className="absolute right-[-12rem] top-1/3 h-[30rem] w-[30rem] rounded-full bg-fuchsia-500/15 blur-[150px] animate-float"
        style={{ animationDelay: '-5s' }}
      />
      <div
        className="absolute bottom-[-10rem] left-1/3 h-[32rem] w-[32rem] rounded-full bg-cyan-400/10 blur-[150px] animate-float"
        style={{ animationDelay: '-9s' }}
      />
      {/* fine noise/vignette to ground the glass */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.45)_100%)]" />
    </div>
  )
}
