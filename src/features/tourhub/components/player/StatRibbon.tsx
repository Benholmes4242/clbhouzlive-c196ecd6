/**
 * StatRibbon - Full-width stats strip directly below hero.
 * No card container — sits on page background with top/bottom borders.
 */

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { TourPlayerStatistics } from '../../hooks/useTourHubData';

interface StatRibbonProps {
  playerStats: TourPlayerStatistics | null;
}

function formatEarnings(earnings: number | null | undefined): string | null {
  if (!earnings) return null;
  if (earnings >= 1_000_000) {
    return `$${(earnings / 1_000_000).toFixed(1)}M`;
  }
  return `$${earnings.toLocaleString()}`;
}

export function StatRibbon({ playerStats }: StatRibbonProps) {
  const stats = [
    { label: 'WORLD', value: playerStats?.world_rank && playerStats.world_rank > 0 ? `#${playerStats.world_rank}` : null },
    { label: 'FEDEX', value: playerStats?.fedex_rank && playerStats.fedex_rank > 0 ? `#${playerStats.fedex_rank}` : null },
    { label: 'WINS', value: playerStats?.wins != null ? String(playerStats.wins) : null, highlight: !!(playerStats?.wins && playerStats.wins > 0) },
    { label: 'EVENTS', value: playerStats?.events_played != null ? String(playerStats.events_played) : null },
    { label: 'EARNINGS', value: formatEarnings(playerStats?.earnings) },
  ];

  return (
    <div className="border-t border-b border-border px-4 py-4">
      <div className="flex justify-between items-center">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            className="text-center"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.04, duration: 0.3 }}
          >
            <span className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground block mb-1">
              {stat.label}
            </span>
            <span className={cn(
              "text-lg font-bold font-mono tabular-nums block",
              stat.value
                ? stat.highlight ? "text-amber-500" : "text-foreground"
                : "text-muted-foreground"
            )}>
              {stat.value || '—'}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
