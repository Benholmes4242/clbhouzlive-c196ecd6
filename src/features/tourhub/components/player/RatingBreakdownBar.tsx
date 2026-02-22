import type { PlayerRatingBreakdown } from '../../hooks/usePlayerRating';

interface Props {
  breakdown: PlayerRatingBreakdown;
}

const SEGMENTS = [
  { key: 'scoring', label: 'Scoring', max: 22, color: '#f59e0b' },
  { key: 'sg_total', label: 'SG Total', max: 18, color: '#22C55E' },
  { key: 'world_ranking', label: 'World Rank', max: 20, color: '#3B82F6' },
  { key: 'results', label: 'Results', max: 12, color: '#A855F7' },
  { key: 'ball_striking', label: 'Ball Striking', max: 10, color: '#EC4899' },
  { key: 'short_game', label: 'Short Game', max: 10, color: '#14B8A6' },
  { key: 'power', label: 'Power', max: 8, color: '#F97316' },
] as const;

export function RatingBreakdownBar({ breakdown }: Props) {
  const total = SEGMENTS.reduce((sum, seg) => {
    const val = breakdown[seg.key as keyof PlayerRatingBreakdown] as number;
    return sum + (val || 0);
  }, 0);

  return (
    <div>
      {/* Stacked bar */}
      <div className="flex rounded-full overflow-hidden" style={{ height: 8 }}>
        {SEGMENTS.map(seg => {
          const val = breakdown[seg.key as keyof PlayerRatingBreakdown] as number;
          const pct = total > 0 ? (val / 100) * 100 : 0;
          return (
            <div
              key={seg.key}
              style={{
                width: `${pct}%`,
                backgroundColor: seg.color,
                minWidth: val > 0 ? 2 : 0,
              }}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5" style={{ marginTop: 10 }}>
        {SEGMENTS.map(seg => {
          const val = breakdown[seg.key as keyof PlayerRatingBreakdown] as number;
          return (
            <div key={seg.key} className="flex items-center gap-1.5">
              <div
                className="rounded-full"
                style={{ width: 6, height: 6, backgroundColor: seg.color }}
              />
              <span className="text-muted-foreground" style={{ fontSize: 11, fontWeight: 500 }}>
                {seg.label}
              </span>
              <span className="text-foreground" style={{ fontSize: 11, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {(val || 0).toFixed(1)}
              </span>
              <span className="text-muted-foreground/50" style={{ fontSize: 10 }}>
                /{seg.max}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
