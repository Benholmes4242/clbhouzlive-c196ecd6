/**
 * AchievementsPanel - the ONE achievements entry point on Today.
 *
 * Replaces the pair of panels that used to sit here (a trophy shelf row and a
 * paged unlocks carousel doing adjacent jobs). It answers both questions:
 *   "what do I have"     -> the figures row (TROPHIES, STREAK)
 *   "what did I just get" -> up to THREE recent unlock rows, dated
 *
 * Rules that are deliberate, do not soften them:
 * - Rows are ROWS. No rarity-tinted tiles, no Trophy glyph tiles, no halos.
 * - Rarity is a LABEL, the date is a right-aligned LABEL aside.
 * - JUST UNLOCKED marks the MOST RECENT ROW ONLY.
 * - Cap at three rows. No paging.
 * - With no recent unlocks the rows section renders NOTHING - the Panel is the
 *   figures row plus the Action. There is no empty state.
 */
import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useUserAchievements } from '@/hooks/gam/useUserAchievements';
import { useRecentUnlocks } from '@/hooks/gam/useRecentUnlocks';
import { useUserStreaks } from '@/hooks/gam/useUserStreaks';
import { openGamAchievements, openAllStreaks } from '../gam/events';
import { CHART, CHART_FONT, LABEL_STYLE } from '../charts';
import { formatRelativeAgo } from '@/i18n/format';

const MAX_ROWS = 3;

interface Props {
  userId: string;
  viewMode?: 'owner' | 'friend';
  ownerFirstName?: string | null;
}

const figureStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 800,
  lineHeight: 1,
  letterSpacing: '-0.02em',
  color: CHART.INK,
  fontVariantNumeric: 'tabular-nums',
};

export const AchievementsPanel: React.FC<Props> = ({
  userId,
  viewMode = 'owner',
  ownerFirstName = null,
}) => {
  const { data: achievements } = useUserAchievements(userId);
  const { data: unlocks } = useRecentUnlocks(userId);
  const { data: streaks } = useUserStreaks(userId);

  const trophies = React.useMemo(
    () => (achievements ?? []).filter((b) => b.is_earned).length,
    [achievements],
  );

  const bestStreak = React.useMemo(() => {
    if (!streaks || streaks.length === 0) return null;
    const active = streaks
      .filter((s) => s.is_active && (s.current_count ?? 0) > 0)
      .sort((a, b) => (b.current_count ?? 0) - (a.current_count ?? 0))[0];
    return active ? (active.current_count ?? 0) : 0;
  }, [streaks]);

  const rows = (unlocks ?? []).slice(0, MAX_ROWS);

  const isFriend = viewMode === 'friend';
  const kicker = isFriend
    ? ownerFirstName
      ? `${ownerFirstName}'s trophies`
      : 'Their trophies'
    : 'Trophies';

  return (
    <section style={{ marginTop: 32, fontFamily: CHART_FONT }}>
      <div
        style={{
          margin: '0 16px',
          background: CHART.PANEL,
          border: `1px solid ${CHART.BORDER}`,
          borderRadius: 16,
          padding: 16,
        }}
      >
        {/* Kicker + quiet Action */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <span style={{ ...LABEL_STYLE, color: CHART.MUTE }}>{kicker}</span>
          <button
            type="button"
            onClick={() => openGamAchievements()}
            aria-label="Open the trophy room"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              ...LABEL_STYLE,
              color: CHART.AMBER,
            }}
          >
            Trophy room
            <ChevronRight size={13} strokeWidth={2.6} />
          </button>
        </div>

        {/* Figures */}
        <div style={{ display: 'flex', gap: 32, marginTop: 14 }}>
          <div>
            <div style={figureStyle}>{trophies}</div>
            <div style={{ ...LABEL_STYLE, marginTop: 6 }}>Trophies</div>
          </div>
          {bestStreak != null && (
            <button
              type="button"
              onClick={() => !isFriend && openAllStreaks()}
              aria-label={isFriend ? undefined : 'Open all streaks'}
              disabled={isFriend}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                textAlign: 'left',
                cursor: isFriend ? 'default' : 'pointer',
              }}
            >
              <div style={figureStyle}>{bestStreak}</div>
              <div style={{ ...LABEL_STYLE, marginTop: 6 }}>Streak</div>
            </button>
          )}
        </div>

        {/* Recent unlocks as ROWS. Nothing at all when empty. */}
        {rows.length > 0 && (
          <div style={{ marginTop: 16 }}>
            {rows.map((u, i) => (
              <div
                key={`${u.title}-${u.occurred_at}`}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '12px 0 0',
                  marginTop: i === 0 ? 4 : 0,
                  borderTop: `1px solid ${CHART.BORDER}`,
                  paddingBottom: i === rows.length - 1 ? 0 : 12,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  {i === 0 && (
                    <div style={{ ...LABEL_STYLE, color: CHART.AMBER, marginBottom: 4 }}>
                      Just unlocked
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: CHART.INK,
                      letterSpacing: '-0.01em',
                      lineHeight: 1.25,
                    }}
                  >
                    {u.title}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: CHART.MUTE,
                      marginTop: 2,
                      lineHeight: 1.35,
                    }}
                  >
                    {u.description}
                  </div>
                  <div style={{ ...LABEL_STYLE, marginTop: 6 }}>{u.rarity}</div>
                </div>
                <span style={{ ...LABEL_STYLE, flexShrink: 0, whiteSpace: 'nowrap' }}>
                  {formatRelativeAgo(u.occurred_at, { yesterday: true })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default AchievementsPanel;
