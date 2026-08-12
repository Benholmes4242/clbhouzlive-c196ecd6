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
 * - The chase line renders NOTHING when there is no live chase. A zero gap is
 *   a TIE, described as such, and only shown when no real chase exists. The
 *   chosen row rotates daily from the closest five.
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
import { CHART, CHART_FONT } from '../charts';
import { formatRelativeAgo } from '@/i18n/format';

const MAX_ROWS = 3;

interface Props {
  userId: string;
  viewMode?: 'owner' | 'friend';
  ownerFirstName?: string | null;
}

/**
 * Dark-surface variant of the business type scale. LOCAL on purpose: the shared
 * chart LABEL_STYLE renders at weight 800 and 0.13em, and nothing in this tile
 * renders at 800. CHART tokens are used, never repointed.
 */
const KICKER: React.CSSProperties = {
  fontFamily: CHART_FONT,
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.19em',
  textTransform: 'uppercase',
  color: CHART.INK,
};

const LABEL: React.CSSProperties = {
  fontFamily: CHART_FONT,
  fontSize: 8,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: CHART.DIM,
};

const BODY: React.CSSProperties = {
  fontFamily: CHART_FONT,
  fontSize: 12.5,
  fontWeight: 400,
  lineHeight: 1.45,
  color: CHART.MUTE,
};

const figureStyle: React.CSSProperties = {
  fontSize: 30,
  fontWeight: 700,
  lineHeight: 1,
  letterSpacing: '-0.04em',
  color: CHART.INK,
  fontVariantNumeric: 'tabular-nums lining-nums',
};

/**
 * djb2. There is no exported seed helper in the app - the only other daily
 * seed (useHoleMedia) keeps its own local copy - so this is a second local one
 * rather than a new shared module for one call site.
 */
function djb2(input: string): number {
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Local calendar day, so the row is stable within a day and moves at midnight. */
function todayKey(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const CHASE_POOL = 5;

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

  /**
   * D1 - a zero gap is a TIE, not a chase. Two disjoint sets:
   *   chase = gap_to_first > 0   (actionable, always preferred)
   *   level = gap_to_first === 0 (the consolation, only when no chase exists)
   * Null gaps and viewer_rank 1 are discarded here as well as in the RPC.
   *
   * D3 - the closest FIVE chases form a pool and ONE is picked from a seed of
   * the member id and the local date, so the line rotates daily and is
   * identical on every render within a day. A pool of one is a no-op.
   */
  const chaseState = React.useMemo(() => {
    const eligible = (pulse ?? []).filter(
      (p) =>
        p.kind === 'chase' &&
        p.gap_to_first != null &&
        p.viewer_rank !== 1,
    );
    const chases = eligible
      .filter((p) => Math.abs(p.gap_to_first ?? 0) > 0)
      .sort((a, b) => Math.abs(a.gap_to_first ?? 0) - Math.abs(b.gap_to_first ?? 0))
      .slice(0, CHASE_POOL);

    if (chases.length > 0) {
      const idx = djb2(`${userId}-${todayKey()}`) % chases.length;
      return { mode: 'chase' as const, row: chases[idx] };
    }

    const level = eligible
      .filter((p) => Math.abs(p.gap_to_first ?? 0) === 0)
      .slice(0, CHASE_POOL);
    if (level.length > 0) {
      const idx = djb2(`${userId}-${todayKey()}`) % level.length;
      return { mode: 'level' as const, row: level[idx] };
    }
    return null;
  }, [pulse, userId]);

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
  const titlesVisible = (titlesHeld ?? 0) > 0;

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
          <span style={KICKER}>{kicker}</span>
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
              ...KICKER,
              color: CHART.INK,
            }}
          >
            {t('handicap.achievements.trophyRoom')}
            <ChevronRight size={13} strokeWidth={2.6} />
          </button>
        </div>

        {/* Figures - a real grid so the digits and their labels align (D5). */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${titlesVisible ? 3 : 2}, minmax(0, 1fr))`,
            gap: 12,
            marginTop: 14,
          }}
        >
          <div>
            <div style={figureStyle}>{trophies}</div>
            <div style={{ ...LABEL, marginTop: 8 }}>{t('handicap.trophies.label')}</div>
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
              <div style={{ ...LABEL, marginTop: 8 }}>{t('handicap.achievements.streak')}</div>
            </button>
          )}
          {/* B1 - TITLES. Self-hides at zero; the row rebalances to two. */}
          {titlesVisible && (
            <div>
              <div style={figureStyle}>{titlesHeld}</div>
              <div style={{ ...LABEL, marginTop: 8 }}>
                {t('handicap.achievements.titles')}
              </div>
            </div>
          )}
        </div>

        {/* B2 - Tied / Behind / nothing at all. No rule inside the tile (D6). */}
        {chaseState && (
          <button
            type="button"
            onClick={() => {
              analyticsEvents.track('handicap_chase_tapped', {
                course_id: chaseState.row.course_id,
                category: chaseState.row.category,
              });
              navigate(`/courses/${chaseState.row.course_id}`);
            }}
            style={{
              marginTop: 20,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              background: 'none',
              border: 'none',
              padding: 0,
              textAlign: 'left',
              cursor: 'pointer',
              fontFamily: CHART_FONT,
            }}
          >
            <span style={{ minWidth: 0 }}>
              <span style={{ ...LABEL, display: 'block' }}>
                {chaseState.mode === 'level'
                  ? t('handicap.achievements.levelKicker')
                  : t('handicap.achievements.chaseKicker')}
              </span>
              {chaseState.mode === 'chase' && (
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 5,
                    marginTop: 6,
                  }}
                >
                  <span style={figureStyle}>{buildChaseHeadline(chaseState.row).n}</span>
                  <span style={{ ...LABEL, color: CHART.MUTE }}>
                    {buildChaseHeadline(chaseState.row).unit}
                  </span>
                </span>
              )}
              <span style={{ ...BODY, display: 'block', marginTop: 6 }}>
                {t(
                  chaseState.mode === 'level'
                    ? 'handicap.achievements.levelLine'
                    : 'handicap.achievements.chaseLine',
                  {
                    name:
                      chaseState.row.counterparty_name ||
                      t('handicap.achievements.leaderFallback'),
                    course: chaseState.row.course_name,
                  },
                )}
              </span>
            </span>
            <ChevronRight
              size={15}
              strokeWidth={2.4}
              color={CHART.DIM}
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
                    <div style={{ ...LABEL, color: CHART.INK, marginBottom: 4 }}>
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
                  <div style={{ ...BODY, marginTop: 2 }}>
                    {u.description}
                  </div>
                  <div style={{ ...LABEL, marginTop: 8 }}>{u.rarity}</div>
                </div>
                <span style={{ ...LABEL, flexShrink: 0, whiteSpace: 'nowrap' }}>
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
