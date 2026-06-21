import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useUserAchievements } from '@/hooks/gam/useUserAchievements';
import { openGamAchievements } from '../../gam/events';
import { renderBadgeIcon } from '../../gam/badgeIcons';
import { SectionHeader } from '../_shared/atoms';

interface Props {
  userId: string;
  viewMode?: 'owner' | 'friend';
  ownerFirstName?: string | null;
}

const FONT = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
const D_BG = 'var(--hcp-bg-1)';
const D_BG2 = 'var(--hcp-bg-2)';
const D_LINE = 'var(--hcp-line)';
const D_T100 = 'var(--hcp-t-100)';
const D_T60 = 'var(--hcp-t-60)';


export const AchievementsCard: React.FC<Props> = ({ userId, viewMode = 'owner', ownerFirstName = null }) => {
  const { data: achievements, isLoading } = useUserAchievements(userId);

  const list = achievements ?? [];
  const unlocked = list.filter((b) => b.is_earned);
  const unlockedCount = unlocked.length;
  const totalCount = list.length;

  // Most recent 4 unlocked badges by earned_at desc
  const recent = [...unlocked]
    .sort((a, b) => {
      const ta = a.earned_at ? new Date(a.earned_at).getTime() : 0;
      const tb = b.earned_at ? new Date(b.earned_at).getTime() : 0;
      return tb - ta;
    })
    .slice(0, 4);
  const overflow = Math.max(0, unlockedCount - recent.length);
  const pct = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  const handleOpen = () => openGamAchievements();
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleOpen();
    }
  };

  const isFriend = viewMode === 'friend';
  const possessive = ownerFirstName ? `${ownerFirstName}'s` : 'Their';
  const hasContraction = ownerFirstName ? `${ownerFirstName} has` : 'they have';

  return (
    <section style={{ marginTop: 32 }}>
      <SectionHeader
        eyebrow="ACHIEVEMENTS"
        title={isFriend ? `${possessive} trophy cabinet` : 'Your trophy cabinet'}
        sub={
          isFriend
            ? `Tap to see everything ${hasContraction} unlocked`
            : "Tap to see everything you've unlocked"
        }
      />
      <div style={{ padding: '0 16px' }}>
        <div
          role="button"
          tabIndex={0}
          onClick={handleOpen}
          onKeyDown={handleKeyDown}
          aria-label="Open achievements"
          style={{
            background: D_BG,
            border: `1px solid ${D_LINE}`,
            borderRadius: 18,
            padding: 18,
            cursor: 'pointer',
            fontFamily: FONT,
          }}
        >
          {unlockedCount === 0 && !isLoading ? (
            <div style={{ fontSize: 13, color: D_T60, fontWeight: 600 }}>
              {isFriend
                ? `${ownerFirstName ?? 'They'} ${ownerFirstName ? 'hasn\'t' : "haven't"} unlocked any achievements yet`
                : 'No achievements unlocked yet'}
            </div>
          ) : (
            <>
              {/* Count + percent */}
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span
                    style={{
                      fontSize: 40, fontWeight: 800, color: D_T100,
                      letterSpacing: '-0.03em', lineHeight: 0.9,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {isLoading ? '—' : unlockedCount}
                  </span>
                  <span
                    style={{
                      fontSize: 20, fontWeight: 600, color: 'var(--hcp-t-40)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    / {isLoading ? '—' : totalCount}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: D_T60, marginLeft: 6 }}>
                    unlocked
                  </span>
                </div>
                {!isLoading && (
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#F7931E' }}>
                    {pct}%
                  </span>
                )}
              </div>

              {/* Completion bar */}
              <div
                style={{
                  height: 8,
                  background: 'var(--hcp-bg-2)',
                  borderRadius: 5,
                  overflow: 'hidden',
                  marginTop: 12,
                }}
                aria-hidden
              >
                <div
                  style={{
                    width: `${isLoading ? 0 : pct}%`,
                    height: '100%',
                    borderRadius: 5,
                    background: 'linear-gradient(90deg, #F7931E, #FBBC2E)',
                    transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
              </div>

              {/* Recent badge previews + overflow + chevron */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 16,
                }}
              >
                <div style={{ display: 'flex', gap: 8 }}>
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        style={{ width: 34, height: 34, borderRadius: 10, background: D_BG2, border: `1px solid ${D_LINE}` }}
                      />
                    ))
                  ) : (
                    recent.map((b) => (
                      <div
                        key={b.badge_id}
                        style={{
                          width: 34, height: 34, borderRadius: 10,
                          background: D_BG2, border: `1px solid ${D_LINE}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        {renderBadgeIcon(b.icon_name, 18, D_T100)}
                      </div>
                    ))
                  )}
                </div>

                <span
                  style={{
                    fontSize: 12, fontWeight: 700, color: D_T60,
                    display: 'inline-flex', alignItems: 'center', gap: 2,
                  }}
                >
                  {overflow > 0 ? `+${overflow} more` : 'See all'}
                  <ChevronRight size={14} color={D_T60} strokeWidth={2.2} />
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default AchievementsCard;
