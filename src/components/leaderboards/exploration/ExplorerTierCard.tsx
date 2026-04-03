import { EXPLORER_TIERS, type ExplorerTier } from '@/config/explorerTiers';

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

  const currentIndex = EXPLORER_TIERS.findIndex(t => t.id === tier.id);

  // Derived progress values
  const ctrProgress = nextTier
    ? Math.min((countriesCount / nextTier.minCountries) * 100, 100)
    : 100;
  const contProgress = nextTier
    ? Math.min((continentsCount / nextTier.minContinents) * 100, 100)
    : 100;
  const ctrGap = nextTier ? Math.max(0, nextTier.minCountries - countriesCount) : 0;
  const contGap = nextTier ? Math.max(0, nextTier.minContinents - continentsCount) : 0;

  return (
    <div>
      {/* ── PART 1: Compact position ladder ── */}
      <div style={{
        background: '#FFFFFF', borderRadius: 14, padding: '12px 14px', marginBottom: 10,
        border: '1px solid rgba(0,0,0,0.07)',
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
          Explorer Journey
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {EXPLORER_TIERS.map((t, i) => {
            const unlocked = i <= currentIndex;
            const isCurrent = i === currentIndex;
            const isNext = i === currentIndex + 1;
            const isLocked = i > currentIndex + 1;

            return (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', flex: i < EXPLORER_TIERS.length - 1 ? 1 : undefined }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  {/* Node */}
                  <div style={{
                    width: isCurrent ? 'clamp(34px,9vw,40px)' : 'clamp(26px,7vw,30px)',
                    height: isCurrent ? 'clamp(34px,9vw,40px)' : 'clamp(26px,7vw,30px)',
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: isCurrent ? 'clamp(15px,4vw,18px)' : 'clamp(11px,3vw,13px)',
                    background: unlocked ? `${t.color}22` : 'rgba(0,0,0,0.05)',
                    border: isCurrent
                      ? `3px solid ${t.color}`
                      : `1.5px solid ${unlocked ? t.color + '44' : 'rgba(0,0,0,0.08)'}`,
                    boxShadow: isCurrent ? `0 3px 12px ${t.color}44` : 'none',
                    opacity: isLocked ? 0.45 : 1,
                    transition: 'all 0.3s',
                  }}>
                    {unlocked && !isCurrent
                      ? <span style={{ fontSize: 'clamp(10px,2.8vw,12px)', color: t.color, fontWeight: 700 }}>✓</span>
                      : <span>{t.icon}</span>
                    }
                  </div>
                  {/* Label — first word only */}
                  <div style={{
                    fontSize: 'clamp(7px,2vw,9px)',
                    fontWeight: isCurrent ? 800 : 500,
                    color: isCurrent ? t.color : '#94A3B8',
                    textAlign: 'center',
                    maxWidth: 52,
                    lineHeight: 1.1,
                    opacity: isLocked ? 0.45 : 1,
                  }}>
                    {t.name.split(' ')[0]}
                  </div>
                </div>

                {/* Connecting bar */}
                {i < EXPLORER_TIERS.length - 1 && (
                  <div style={{
                    flex: 1,
                    height: 3,
                    background: unlocked && i < currentIndex ? t.color : 'rgba(0,0,0,0.08)',
                    minWidth: 8,
                    margin: '0 2px',
                    borderRadius: 2,
                    marginBottom: 16,
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── PART 2: Milestone card ── */}
      {nextTier ? (
        <div style={{
          borderRadius: 14, overflow: 'hidden',
          border: '1px solid rgba(0,0,0,0.07)',
          background: '#FFFFFF',
        }}>
          {/* Colour top bar */}
          <div style={{ height: 4, background: `linear-gradient(90deg, ${tier.color}, ${tier.color}40)` }} />

          <div style={{ padding: '14px 16px' }}>
            {/* Current → Next tier row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              {/* Current tier */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: `${tier.color}12`, border: `1.5px solid ${tier.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 20 }}>{tier.icon}</span>
                </div>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Your tier
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: tier.color }}>
                    {tier.name}
                  </div>
                </div>
              </div>

              {/* Next tier */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 9, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Next up
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: nextTier.color }}>
                  {nextTier.icon} {nextTier.name}
                </div>
              </div>
            </div>

            {/* Requirements section */}
            <div style={{
              background: 'rgba(0,0,0,0.02)', borderRadius: 10, padding: '10px 12px',
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 10 }}>
                To reach {nextTier.name} you need
              </div>

              {/* Countries progress */}
              <div style={{ marginBottom: nextTier.minContinents > 1 ? 10 : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>
                    🌍 {nextTier.minCountries} countries
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    color: ctrGap > 0 ? '#F7931E' : '#059669',
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                  }}>
                    {ctrGap > 0 ? `${ctrGap} more to go` : '✓ Done'}
                  </span>
                </div>
                <div style={{ height: 6, background: 'rgba(0,0,0,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    width: `${ctrProgress}%`, height: '100%',
                    background: ctrGap > 0 ? tier.color : '#059669',
                    borderRadius: 99, transition: 'width 0.6s ease',
                  }} />
                </div>
                <div style={{ fontSize: 9, color: '#94A3B8', marginTop: 3 }}>
                  {countriesCount} of {nextTier.minCountries} countries played
                </div>
              </div>

              {/* Continents progress — only if requirement > 1 */}
              {nextTier.minContinents > 1 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>
                      🗺️ {nextTier.minContinents} continents
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      color: contGap > 0 ? '#F7931E' : '#059669',
                      fontFamily: "'DM Sans', system-ui, sans-serif",
                    }}>
                      {contGap > 0 ? `${contGap} more to go` : '✓ Done'}
                    </span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(0,0,0,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      width: `${contProgress}%`, height: '100%',
                      background: contGap > 0 ? tier.color : '#059669',
                      borderRadius: 99, transition: 'width 0.6s ease',
                    }} />
                  </div>
                  <div style={{ fontSize: 9, color: '#94A3B8', marginTop: 3 }}>
                    {continentsCount} of {nextTier.minContinents} continents explored
                  </div>
                </div>
              )}
            </div>

            {/* Plain English summary */}
            <p style={{ fontSize: 11, color: '#6B7280', marginTop: 10, lineHeight: 1.5 }}>
              Play golf in{' '}
              <span style={{ fontWeight: 700, color: '#374151' }}>
                {ctrGap} more {ctrGap === 1 ? 'country' : 'countries'}
              </span>
              {contGap > 0 && (
                <>
                  {' '}across{' '}
                  <span style={{ fontWeight: 700, color: '#374151' }}>
                    {contGap} more {contGap === 1 ? 'continent' : 'continents'}
                  </span>
                </>
              )}
              {' '}to unlock{' '}
              <span style={{ fontWeight: 700, color: nextTier.color }}>
                {nextTier.icon} {nextTier.name}
              </span>.
            </p>
          </div>
        </div>
      ) : (
        /* Max tier reached */
        <div style={{
          borderRadius: 14, overflow: 'hidden',
          border: '1px solid rgba(0,0,0,0.07)',
          background: '#FFFFFF',
        }}>
          <div style={{ height: 4, background: `linear-gradient(90deg, ${tier.color}, ${tier.color}40)` }} />
          <div style={{ padding: '16px', textAlign: 'center' }}>
            <span style={{ fontSize: 28 }}>{tier.icon}</span>
            <p style={{ fontSize: 15, fontWeight: 900, color: tier.color, marginTop: 4 }}>
              {tier.name}
            </p>
            <p style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
              ✨ Maximum tier reached — the ultimate golf explorer
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
