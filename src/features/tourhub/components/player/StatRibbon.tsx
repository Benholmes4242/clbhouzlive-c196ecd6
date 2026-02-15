/**
 * StatRibbon - Glassmorphic horizontal pill strip
 * Sits below hero with -mt-5 overlap for visual continuity.
 */

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { TourPlayerStatistics } from '../../hooks/useTourHubData';

interface StatPillProps {
  label: string;
  value: string | null;
  highlight?: boolean;
  delay?: number;
}

function StatPill({ label, value, highlight = false, delay = 0 }: StatPillProps) {
  return (
    <motion.div
      className={cn(
        "flex-1 text-center px-1.5 py-2 rounded-lg",
        highlight
          ? "bg-amber-500/8 border border-amber-500/15"
          : "bg-card/60 border border-border/30"
      )}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 + delay, duration: 0.3 }}
    >
      <span className="text-[8px] font-semibold tracking-wider uppercase text-muted-foreground/60 block mb-0.5">
        {label}
      </span>
      <span className={cn(
        "text-[13px] font-bold font-mono tabular-nums block",
        value ? (highlight ? "text-amber-500" : "text-foreground") : "text-muted-foreground"
      )}>
        {value || '—'}
      </span>
    </motion.div>
  );
}

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
  const worldRank = playerStats?.world_rank && playerStats.world_rank > 0
    ? `#${playerStats.world_rank}` : null;
  const fedexRank = playerStats?.fedex_rank && playerStats.fedex_rank > 0
    ? `#${playerStats.fedex_rank}` : null;
  const wins = playerStats?.wins != null ? String(playerStats.wins) : null;
  const events = playerStats?.events_played != null ? String(playerStats.events_played) : null;
  const earnings = formatEarnings(playerStats?.earnings);

  const isWorldNo1 = playerStats?.world_rank === 1;

  return (
    <div className="relative z-10 -mt-5 mx-4">
      <div
        className="flex gap-1.5 px-3 py-2.5 rounded-2xl border border-border/40 bg-card shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
      >
        <StatPill label="WORLD" value={worldRank} highlight={isWorldNo1} delay={0} />
        <StatPill label="FEDEX" value={fedexRank} delay={0.03} />
        <StatPill label="WINS" value={wins} highlight={!!(playerStats?.wins && playerStats.wins > 0)} delay={0.06} />
        <StatPill label="EVENTS" value={events} delay={0.09} />
        <StatPill label="EARNINGS" value={earnings} delay={0.12} />
      </div>
    </div>
  );
}