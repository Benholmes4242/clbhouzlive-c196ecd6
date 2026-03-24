import type { ExplorerTier } from '@/config/explorerTiers';

interface ExplorerTierCardProps {
  tier: ExplorerTier;
  nextTier: ExplorerTier | null;
  countriesCount: number;
  continentsCount: number;
}

export function ExplorerTierCard({
  tier,
  nextTier,
  countriesCount,
  continentsCount,
}: ExplorerTierCardProps) {
  // Progress to next tier
  const progress = nextTier
    ? Math.min(
        (countriesCount / nextTier.minCountries) * 100,
        100
      )
    : 100;

  return (
    <div
      style={{
        borderRadius: 18,
        overflow: 'hidden',
        border: `1.5px solid ${tier.color}40`,
        background: `linear-gradient(135deg, ${tier.color}08, ${tier.color}03)`,
      }}
    >
      {/* Top bar */}
      <div
        style={{
          height: 3,
          background: `linear-gradient(90deg, ${tier.color}, ${tier.color}20)`,
        }}
      />

      <div style={{ padding: '14px 16px' }}>
        <div className="flex items-start gap-3">
          {/* Icon tile */}
          <div
            className="flex items-center justify-center flex-shrink-0 overflow-visible"
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: `${tier.color}12`,
              border: `1.5px solid ${tier.color}30`,
            }}
          >
            <span style={{ fontSize: 26, lineHeight: 1 }}>{tier.icon}</span>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-muted-foreground uppercase tracking-wider" style={{ fontSize: 10, opacity: 0.6 }}>
              Your Explorer Tier
            </p>
            <p className="text-foreground" style={{ fontSize: 20, fontWeight: 900 }}>
              {tier.name}
            </p>
            <p style={{ fontSize: 12, fontWeight: 600, color: tier.color }}>
              {countriesCount} countries · {continentsCount} continents
            </p>
          </div>
        </div>

        {/* Progress to next */}
        {nextTier ? (
          <div className="mt-3">
            <div className="flex justify-between items-center mb-1">
              <p className="text-muted-foreground" style={{ fontSize: 10 }}>
                Next: {nextTier.name}
              </p>
              <p className="text-muted-foreground" style={{ fontSize: 10 }}>
                {countriesCount}/{nextTier.minCountries} countries
              </p>
            </div>
            <div
              style={{
                height: 4,
                background: 'hsl(var(--muted))',
                borderRadius: 999,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  backgroundColor: tier.color,
                  borderRadius: 999,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground mt-2" style={{ fontSize: 11 }}>
            ✨ Maximum tier reached
          </p>
        )}
      </div>
    </div>
  );
}
