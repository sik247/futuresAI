export function PageSkeleton({ sections = 3 }: { sections?: number }) {
  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-20 animate-pulse">
      <div className="max-w-6xl mx-auto px-6">
        {/* Hero skeleton */}
        <div className="pt-12 pb-14">
          <div className="h-3 w-32 rounded bg-white/[0.04] mb-5" />
          <div className="h-12 w-80 rounded bg-white/[0.06] mb-3" />
          <div className="h-12 w-64 rounded bg-white/[0.06] mb-6" />
          <div className="h-4 w-96 rounded bg-white/[0.04]" />
        </div>
        {/* Section skeletons */}
        {Array.from({ length: sections }).map((_, i) => (
          <div key={i} className="py-10">
            <div className="h-6 w-48 rounded bg-white/[0.06] mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-6">
                  <div className="h-4 w-full rounded bg-white/[0.06] mb-3" />
                  <div className="h-4 w-3/4 rounded bg-white/[0.04] mb-3" />
                  <div className="h-20 w-full rounded bg-white/[0.04]" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
