import type { PlayerRatingBreakdown } from '../../hooks/usePlayerRating';

interface Props {
  breakdown: PlayerRatingBreakdown;
}

export function RatingBreakdownBar({ breakdown }: Props) {
  const base = breakdown.base_rating || 0;
  const form = breakdown.form_modifier || 0;
  const worldRank = breakdown.world_ranking || 0;

  return (
    <div className="flex items-center justify-center gap-2" style={{ marginTop: 8, padding: '4px 0' }}>
      <span className="text-muted-foreground" style={{ fontSize: 11, fontWeight: 500 }}>
        Base from World #{worldRank}
      </span>
      <div className="flex items-center gap-2">
        <span style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }} className="text-foreground">
          {base}
        </span>
        {form !== 0 && (
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            color: form > 0 ? '#22C55E' : '#EF4444',
          }}>
            {form > 0 ? '+' : ''}{form} form
          </span>
        )}
      </div>
    </div>
  );
}
