import { PlayerRating, TIER_CONFIG } from '../../hooks/usePlayerRating';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
  rating: PlayerRating;
}

export function ClbhouzRatingBadge({ rating }: Props) {
  const tier = TIER_CONFIG[rating.tier];
  const delta = rating.rating_delta;

  return (
    <div className="flex items-center gap-4" style={{ padding: '16px 0' }}>
      {/* Rating Circle */}
      <div
        className="flex flex-col items-center justify-center shrink-0"
        style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          border: `3px solid ${tier.color}`,
          backgroundColor: tier.bgColor,
        }}
      >
        <span
          style={{
            fontSize: 8,
            fontWeight: 800,
            letterSpacing: '1px',
            color: tier.color,
            lineHeight: 1,
            marginTop: 2,
          }}
        >
          CLBHOUZ
        </span>
        <span
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: tier.color,
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {rating.rating}
        </span>
      </div>

      {/* Tier + Delta */}
      <div className="flex flex-col gap-0.5">
        <span
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: tier.color,
          }}
        >
          {tier.label}
        </span>
        <span className="text-muted-foreground" style={{ fontSize: 12, fontWeight: 500 }}>
          Clbhouz Rating
        </span>
        {delta !== 0 && (
          <div className="flex items-center gap-1" style={{ marginTop: 2 }}>
            {delta > 0 ? (
              <TrendingUp style={{ width: 14, height: 14, color: '#22C55E' }} />
            ) : (
              <TrendingDown style={{ width: 14, height: 14, color: '#EF4444' }} />
            )}
            <span style={{
              fontSize: 12,
              fontWeight: 600,
              color: delta > 0 ? '#22C55E' : '#EF4444',
            }}>
              {delta > 0 ? '+' : ''}{delta} this week
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
