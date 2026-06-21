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
            borderRadius: 14,
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            cursor: 'pointer',
            fontFamily: FONT,
          }}
        >
          {/* Avatar stack */}
          <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            {isLoading || unlockedCount === 0 ? (
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: D_BG2,
                  border: `1px solid ${D_LINE}`,
                }}
              />
            ) : (
              <>
                {recent.map((b, i) => (
                  <div
                    key={b.badge_id}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 11,
                      background: D_BG2,
                      border: `1.5px solid ${D_BG}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: i === 0 ? 0 : -10,
                      zIndex: recent.length - i,
                    }}
                  >
                    {renderBadgeIcon(b.icon_name, 22, D_T100)}
                  </div>
                ))}
                {overflow > 0 && (
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 11,
                      background: D_BG2,
                      border: `1.5px solid ${D_BG}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: -10,
                      fontSize: 11,
                      fontWeight: 800,
                      color: D_T60,
                      letterSpacing: '0.04em',
                    }}
                  >
                    +{overflow}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Text block */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {unlockedCount === 0 && !isLoading ? (
              <div style={{ fontSize: 13, color: D_T60, fontWeight: 600 }}>
                {isFriend
                  ? `${ownerFirstName ?? 'They'} ${ownerFirstName ? 'hasn\'t' : "haven't"} unlocked any achievements yet`
                  : 'No achievements unlocked yet'}
              </div>
            ) : (
              <>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: D_T100,
                    lineHeight: 1.2,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {isLoading ? '— of —' : `${unlockedCount} of ${totalCount}`} unlocked
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: D_T60,
                    fontWeight: 500,
                    marginTop: 3,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {points.toLocaleString()} points earned
                </div>
              </>
            )}
          </div>

          {unlockedCount > 0 && (
            <ChevronRight size={16} color={D_T60} strokeWidth={2.2} style={{ flexShrink: 0 }} />
          )}
        </div>
      </div>
    </section>
  );
};

export default AchievementsCard;
