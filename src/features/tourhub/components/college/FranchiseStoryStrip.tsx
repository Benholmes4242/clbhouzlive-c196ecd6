import { motion } from 'framer-motion';
import type { CollegeSeasonStats } from '../../hooks/useCollegeStats';

interface FranchiseStoryStripProps {
  stats: CollegeSeasonStats;
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
}

export function FranchiseStoryStrip({ stats }: FranchiseStoryStripProps) {
  const items = [
    { label: 'Earnings', value: formatCurrency(stats.earnings_total) },
    { label: 'Wins', value: String(stats.wins_total) },
    { label: 'Top 10s', value: String(stats.top10_total) },
    { label: 'Cuts', value: String(stats.cuts_total) },
    { label: 'Events', value: String(stats.events_total) },
  ];

  // Optional stat averages
  if (stats.avg_sg_total != null) {
    items.push({ label: 'Avg SG', value: stats.avg_sg_total.toFixed(2) });
  }
  if (stats.avg_scoring != null) {
    items.push({ label: 'Avg Score', value: stats.avg_scoring.toFixed(1) });
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45, duration: 0.3 }}
    >
      <h3 className="text-foreground" style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>
        Season Snapshot
      </h3>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
        {items.map(item => (
          <div
            key={item.label}
            className="flex-shrink-0 flex flex-col items-center justify-center rounded-xl border border-border/50 bg-card"
            style={{ minWidth: 90, padding: '14px 16px' }}
          >
            <span className="text-foreground" style={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {item.value}
            </span>
            <span className="text-muted-foreground" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginTop: 2 }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
