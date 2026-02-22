import { PlayerRating, TIER_CONFIG } from '../../hooks/usePlayerRating';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
  rating: PlayerRating;
}

export function ClbhouzRatingBadge({ rating }: Props) {
  const tier = TIER_CONFIG[rating.tier];
  const delta = rating.rating_delta;

  return (
    <div className="flex items-center gap-4" style={{ padding: '12px 0' }}>
      {/* Rating Square */}
      <div
        className="flex flex-col items-center justify-center shrink-0"
        style={{
          width: 60,
          height: 60,
          borderRadius: 16,
          background: tier.color,
          boxShadow: `0 4px 16px ${tier.color}30`,
        }}
      >
        <span
          style={{
            fontSize: 7,
            fontWeight: 800,
            letterSpacing: '0.8px',
            textTransform: 'uppercase' as const,
            color: 'rgba(255,255,255,0.8)',
            lineHeight: 1,
            marginTop: 2,
          }}
        >
          CLBHOUZ
        </span>
        <span
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: 'white',
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
