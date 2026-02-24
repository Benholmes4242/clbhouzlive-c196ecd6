/**
 * StatRibbon - Full-width stats strip directly below hero.
 * No card container — sits on page background with bottom border.
 */

import { motion } from 'framer-motion';
import type { TourPlayerStatistics } from '../../hooks/useTourHubData';

interface StatRibbonProps {
  playerStats: TourPlayerStatistics | null;
}

function formatEarnings(earnings: number | null | undefined): string | null {
  if (earnings == null) return null;
  if (earnings >= 1_000_000) return `$${(earnings / 1_000_000).toFixed(1)}M`;
  if (earnings >= 1_000) return `$${Math.round(earnings / 1_000)}K`;
  return `$${earnings.toLocaleString()}`;
}

export function StatRibbon({ playerStats }: StatRibbonProps) {
  const stats = [
    { label: 'WORLD', value: playerStats?.world_rank && playerStats.world_rank > 0 ? `#${playerStats.world_rank}` : null },
    { label: 'FEDEX', value: playerStats?.fedex_rank && playerStats.fedex_rank > 0 ? `#${playerStats.fedex_rank}` : null },
    { label: 'WINS', value: playerStats?.wins != null ? String(playerStats.wins) : null, highlightColor: playerStats?.wins && playerStats.wins > 0 ? '#f59e0b' : undefined },
    { label: 'EARNINGS', value: formatEarnings(playerStats?.earnings) },
  ];

  return (
    <div className="bg-card" style={{ padding: '14px 4px', borderBottom: '1px solid hsl(var(--border) / 0.1)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            className="text-center"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.04, duration: 0.3 }}
          >
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.5px',
              textTransform: 'uppercase' as const,
            }} className="text-muted-foreground/50 block" >
              {stat.label}
            </span>
            <span
              style={{
                fontSize: '17px',
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
                marginTop: '2px',
                display: 'block',
                color: stat.value && stat.highlightColor ? stat.highlightColor : undefined,
              }}
              className={stat.value ? (stat.highlightColor ? '' : 'text-foreground') : 'text-muted-foreground'}
            >
              {stat.value || '—'}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
