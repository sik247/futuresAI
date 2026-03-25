export default function Loading() {
  return (
    <div className="bg-zinc-950 min-h-screen">
      <div className="max-w-7xl mx-auto px-6 pt-28 pb-16">
        <div className="animate-pulse space-y-8">
          <div className="h-10 w-64 bg-zinc-800/50 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-2xl bg-zinc-800/30 border border-white/[0.04]"
              />
            ))}
          </div>
          <div className="h-96 rounded-2xl bg-zinc-800/20 border border-white/[0.04]" />
        </div>
      </div>
    </div>
  );
}
