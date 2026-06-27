// Dark gradient backdrop with softly blurred color blobs.
// Kept fully static: animating a large blurred layer underneath glass cards
// forces the browser to recompute every card's backdrop-filter each frame,
// which is the main source of jank. Glass cards floating over a static rich
// background keep the Apple/visionOS look at a fraction of the cost.
export default function AppBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(900px 650px at 18% 12%, #16204a 0%, transparent 55%),' +
            'radial-gradient(820px 600px at 85% 18%, #3a1d52 0%, transparent 50%),' +
            'radial-gradient(900px 700px at 70% 95%, #0c2f44 0%, transparent 55%),' +
            'linear-gradient(160deg, #070a12 0%, #0a0e1a 55%, #070910 100%)',
        }}
      />
      {/* static blobs (no animation) */}
      <div className="absolute -left-40 top-10 h-[34rem] w-[34rem] rounded-full bg-accent/20 blur-[90px]" />
      <div className="absolute right-[-12rem] top-1/3 h-[28rem] w-[28rem] rounded-full bg-fuchsia-500/15 blur-[90px]" />
      <div className="absolute bottom-[-10rem] left-1/3 h-[30rem] w-[30rem] rounded-full bg-cyan-400/10 blur-[90px]" />
      {/* vignette to ground the glass */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.45)_100%)]" />
    </div>
  )
}
