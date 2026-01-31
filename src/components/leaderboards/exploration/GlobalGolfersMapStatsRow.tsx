/**
 * GlobalGolfersMapStatsRow - Two-card progress UI for Global Golfers page
 * 
 * Left card: Continents progress with visual bar
 * Right card: Countries explored count
 */

interface GlobalGolfersMapStatsRowProps {
  continentsPlayed: number;
  continentsTotal?: number;
  countriesPlayed: number;
}

export function GlobalGolfersMapStatsRow({
  continentsPlayed,
  continentsTotal = 6,
  countriesPlayed,
}: GlobalGolfersMapStatsRowProps) {
  const progress = continentsTotal > 0 ? continentsPlayed / continentsTotal : 0;
  const progressPct = Math.max(0, Math.min(100, progress * 100));

  return (
    <div className="mt-3 px-4 grid grid-cols-2 gap-3">
      {/* Continents Card */}
      <div className="rounded-2xl bg-white/80 border border-zinc-200/50 px-4 py-3 shadow-sm">
        <div className="text-sm font-semibold text-zinc-800">Continents</div>
        <div className="mt-1 text-xs text-zinc-500">
          {continentsPlayed} of {continentsTotal} completed
        </div>
        
        {/* Progress Bar */}
        <div className="mt-2 h-2 w-full rounded-full bg-zinc-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#8B9D77] transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Countries Card */}
      <div className="rounded-2xl bg-white/80 border border-zinc-200/50 px-4 py-3 shadow-sm">
        <div className="text-sm font-semibold text-zinc-800">Countries</div>
        <div className="mt-1 text-xs text-zinc-500">
          {countriesPlayed} explored
        </div>
      </div>
    </div>
  );
}
