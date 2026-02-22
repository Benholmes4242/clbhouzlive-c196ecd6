import { PlayerRating, TIER_CONFIG } from '../../hooks/usePlayerRating';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
  rating: PlayerRating;
}

export function ClbhouzRatingBadge({ rating }: Props) {
  const tier = TIER_CONFIG[rating.tier];
  const delta = rating.rating_delta;

  return (
    <div className="flex flex-col items-center gap-1.5" style={{ padding: '8px 0' }}>
      {/* Rating Square */}
      <div
        className="flex flex-col items-center justify-center"
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

      <span style={{ fontSize: 16, fontWeight: 700, color: tier.color }}>
        {tier.label}
      </span>
      <span style={{ fontSize: 11, fontWeight: 500 }} className="text-muted-foreground">
        Clbhouz Rating
      </span>
      {delta !== 0 && (
        <div className="flex items-center gap-1">
          {delta > 0 ? (
            <TrendingUp className="w-3 h-3" style={{ color: '#22C55E' }} />
          ) : (
            <TrendingDown className="w-3 h-3" style={{ color: '#EF4444' }} />
          )}
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            color: delta > 0 ? '#22C55E' : '#EF4444',
          }}>
            {delta > 0 ? '+' : ''}{delta} this week
          </span>
        </div>
      )}
    </div>
  );
}
