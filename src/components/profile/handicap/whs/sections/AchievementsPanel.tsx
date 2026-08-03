/**
 * AchievementsPanel - the ONE achievements entry point on Today.
 *
 * Replaces the pair of panels that used to sit here (a trophy shelf row and a
 * paged unlocks carousel doing adjacent jobs). It answers both questions:
 *   "what do I have"     -> the figures row (TROPHIES, STREAK, TITLES)
 *   "what did I just get" -> up to THREE recent unlock rows, dated
 *
 * It also carries the two survivors of the deleted course-legends section:
 *   TITLES         - all-time count of #1 positions held (B1)
 *   the nearest chase - ONE line, tapping through to that course, where
 *                       CourseRecordBook still shows the full board (B2)
 * Everything else the course-legends section aggregated is already visible
 * per-course on the course detail page, which is why the aggregate view was
 * dispensable.
 *
 * Rules that are deliberate, do not soften them:
 * - Rows are ROWS. No rarity-tinted tiles, no Trophy glyph tiles, no halos.
 * - Rarity is a LABEL, the date is a right-aligned LABEL aside.
 * - JUST UNLOCKED marks the MOST RECENT ROW ONLY.
 * - Cap at three rows. No paging.
 * - With no recent unlocks the rows section renders NOTHING - the Panel is the
 *   figures row plus the Action. There is no empty state.
 * - TITLES self-hides at zero and the figures row rebalances.
 * - The chase line renders NOTHING when there is no live chase.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useUserAchievements } from '@/hooks/gam/useUserAchievements';
import { useRecentUnlocks } from '@/hooks/gam/useRecentUnlocks';
import { useUserStreaks } from '@/hooks/gam/useUserStreaks';
import { useUserLegendTitleCount } from '@/hooks/gam/useUserLegendTitleCount';
import { useLegendPulse, type LegendPulseRow } from '@/hooks/gam/useLegendPulse';
import { formatLegendGap } from '@/lib/gam/visuals';
import { analyticsEvents } from '@/utils/analyticsEvents';
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

/**
 * MOVED from the deleted LegendPulseTicker. `formatLegendGap` returns a
 * single string ("3 birdies", "2 strokes", "1.4 vs HCP"); the copy key wants
 * the figure and the unit separately, so split on the first space.
 */
function buildChaseHeadline(row: LegendPulseRow): { n: string; unit: string } {
  const gapStr = formatLegendGap(row.category, row.gap_to_first ?? 0);
  const space = gapStr.indexOf(' ');
  if (space === -1) return { n: gapStr, unit: '' };
  return { n: gapStr.slice(0, space), unit: gapStr.slice(space + 1) };
}


export const AchievementsPanel: React.FC<Props> = ({
  userId,
  viewMode = 'owner',
  ownerFirstName = null,
}) => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { data: achievements } = useUserAchievements(userId);
  const { data: unlocks } = useRecentUnlocks(userId);
  const { data: streaks } = useUserStreaks(userId);

  const isFriend = viewMode === 'friend';

  // B1 - TITLES. All-time window: the section that used to own this had an
  // ALL TIME / 90D switch, the panel has no room for one, and the lifetime
  // figure is the meaningful one beside TROPHIES.
  const { data: titlesHeld } = useUserLegendTitleCount(userId, 'all_time');

  // B2 - the nearest chase. Owner only; a friend's live chases are not
  // the viewer's business and the RPC is viewer-scoped.
  const { data: pulse } = useLegendPulse(isFriend ? undefined : userId);

  const nearestChase = React.useMemo(() => {
    const chases = (pulse ?? []).filter(
      (p) => p.kind === 'chase' && p.gap_to_first != null,
    );
    if (chases.length === 0) return null;
    return [...chases].sort(
      (a, b) => Math.abs(a.gap_to_first ?? 0) - Math.abs(b.gap_to_first ?? 0),
    )[0];
  }, [pulse]);

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

  const kicker = isFriend
    ? ownerFirstName
      ? t('handicap.trophies.labelOwned', { name: ownerFirstName })
      : t('handicap.trophies.labelOwnedUnknown')
    : t('handicap.trophies.label');


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
            aria-label={t('handicap.trophies.open')}
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
            {t('handicap.achievements.trophyRoom')}
            <ChevronRight size={13} strokeWidth={2.6} />
          </button>
        </div>

        {/* Figures */}
        <div style={{ display: 'flex', gap: 32, marginTop: 14 }}>
          <div>
            <div style={figureStyle}>{trophies}</div>
            <div style={{ ...LABEL_STYLE, marginTop: 6 }}>{t('handicap.trophies.label')}</div>
          </div>
          {bestStreak != null && (
            <button
              type="button"
              onClick={() => !isFriend && openAllStreaks()}
              aria-label={isFriend ? undefined : t('handicap.achievements.openAllStreaks')}
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
              <div style={{ ...LABEL_STYLE, marginTop: 6 }}>{t('handicap.achievements.streak')}</div>
            </button>
          )}
          {/* B1 - TITLES. Self-hides at zero; the row rebalances to two. */}
          {(titlesHeld ?? 0) > 0 && (
            <div>
              <div style={figureStyle}>{titlesHeld}</div>
              <div style={{ ...LABEL_STYLE, marginTop: 6 }}>
                {t('handicap.achievements.titles')}
              </div>
            </div>
          )}
        </div>

        {/* B2 - the nearest chase. ONE line, or nothing at all. */}
        {nearestChase && (
          <button
            type="button"
            onClick={() => {
              analyticsEvents.track('handicap_chase_tapped', {
                course_id: nearestChase.course_id,
                category: nearestChase.category,
              });
              navigate(`/courses/${nearestChase.course_id}`);
            }}
            style={{
              marginTop: 14,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              background: 'none',
              border: 'none',
              borderTop: `1px solid ${CHART.BORDER}`,
              padding: '12px 0 0',
              textAlign: 'left',
              cursor: 'pointer',
              fontFamily: CHART_FONT,
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: CHART.INK,
                letterSpacing: '-0.005em',
                lineHeight: 1.3,
                minWidth: 0,
              }}
            >
              {t('handicap.achievements.chase', {
                n: buildChaseHeadline(nearestChase).n,
                unit: buildChaseHeadline(nearestChase).unit,
                course: nearestChase.course_name,
              })}
            </span>
            <ChevronRight
              size={15}
              strokeWidth={2.4}
              color={CHART.AMBER}
              style={{ flexShrink: 0 }}
            />
          </button>
        )}


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
                      {t('handicap.achievements.justUnlocked')}
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
