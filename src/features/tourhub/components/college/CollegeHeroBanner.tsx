import { motion, AnimatePresence } from 'framer-motion';
import type { CollegeSeasonStats } from '../../hooks/useCollegeStats';
import type { CollegeMedia } from '../../hooks/useCollegeMedia';

interface CollegeHeroBannerProps {
  stats: CollegeSeasonStats;
  college: CollegeMedia | null;
  activeMetric: 'earnings' | 'wins' | 'cuts' | 'top10s';
}

const METRIC_LABELS: Record<string, string> = {
  earnings: '#1 by Earnings',
  wins: '#1 by Wins',
  cuts: '#1 by Cuts Made',
  top10s: '#1 by Top 10s',
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export function CollegeHeroBanner({ stats, college, activeMetric }: CollegeHeroBannerProps) {
  const displayName = college?.short_name || college?.college_name || stats.normalized_name;
  const logoUrl = college?.logo_url;

  const cells: { label: string; value: string; key: string }[] = [
    { label: 'EARNINGS', value: fmt(stats.earnings_total), key: 'earnings' },
    { label: 'WINS', value: String(stats.wins_total), key: 'wins' },
    { label: 'CUTS', value: String(stats.cuts_total), key: 'cuts' },
    { label: 'TOP 10s', value: String(stats.top10_total), key: 'top10s' },
  ];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${stats.normalized_name}-${activeMetric}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="rounded-xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--muted) / 0.4))',
          border: '1px solid hsl(var(--border) / 0.3)',
        }}
      >
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          {logoUrl && (
            <img
              src={logoUrl}
              alt={displayName}
              className="w-10 h-10 rounded-lg object-contain"
              style={{ background: 'hsl(var(--background) / 0.6)' }}
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-foreground truncate">{displayName}</p>
            <span
              className="inline-block mt-0.5 text-[11px] font-medium px-2 py-0.5 rounded-full"
              style={{
                background: 'hsl(var(--accent-amber) / 0.2)',
                color: 'hsl(var(--accent-amber))',
              }}
            >
              {METRIC_LABELS[activeMetric] || '#1 This Season'}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">{stats.player_count} pros</span>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-px px-4 pb-4 pt-2">
          {cells.map((cell) => {
            const isActive = cell.key === activeMetric;
            return (
              <div key={cell.key} className="text-center">
                <p
                  className="text-[11px] font-medium"
                  style={{ color: isActive ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground) / 0.6)' }}
                >
                  {cell.label}
                </p>
                <p
                  className="text-sm font-bold mt-0.5"
                  style={{ color: isActive ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground) / 0.5)' }}
                >
                  {cell.value}
                </p>
              </div>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
