/**
 * BRIEF_COURSE_TAB_REBUILD §3.5 — THE RECORD BOOK, flat.
 *
 * The bordered CourseRecordBook Panel becomes a flat section. Nothing is
 * deleted: CourseRecordBook.tsx is untouched (AchievementsPanel, which referred to
 * it) and the data is the SAME read — useCourseRecordSummary over the existing
 * get_course_legends RPC. No new query, no RPC change.
 *
 * TWO STATES BUILT TOGETHER:
 *
 *   FULL — several holders. One row per board: avatar, board name, holder,
 *   figure with its unit. The viewer's own standing rides on the row as before.
 *
 *   ONE NAME, FIVE TIMES — when a single member holds every board shown, five
 *   identical avatars and five identical names is a rendering bug wearing a
 *   list. So the person is stated ONCE at the top ("Sam Rae holds all five
 *   boards"), and the boards below become bare board/figure rows. Same figures,
 *   same order, same drill-down; the repetition is what goes.
 *
 * COLOUR: amber means the viewing member and nothing else. The crown still
 * marks the course record (lowest gross, all time).
 *
 * NAVIGATION: one row, "All boards ›" — a right chevron, because it navigates
 * (to the Champions tab). It keeps the existing course_record_book_opened event.
 */
import React from 'react';
import { Crown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '@/i18n/format';
import { legendCategoryLabel, formatLegendValueCompact } from '@/lib/gam/visuals';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { analyticsEvents } from '@/utils/analyticsEvents';
import type { CourseLegendRow, LegendCategory } from '@/lib/gam/types';
import { A, FIGS, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { useCourseRecordSummary } from '../useCourseRecordSummary';
import AboutSection, { ABOUT_KICKER, AboutHairline, aboutFig } from './AboutSection';

/** The unit under each figure, so a bare number never has to explain itself. */
const UNIT_KEY: Record<string, string> = {
  lowest_gross_all_time: 'gross',
  most_rounds_all_time: 'rounds',
  best_stableford_all_time: 'points',
  most_birdies_all_time: 'birdies',
  best_score_diff_all_time: 'diff',
};

const BoardLabel: React.FC<{ category: LegendCategory; tone?: string }> = ({ category, tone }) => (
  <div style={{ ...ABOUT_KICKER, display: 'flex', alignItems: 'center', gap: 4, color: tone ?? A.DIM }}>
    {category === 'lowest_gross_all_time' ? <Crown size={10} color={A.AMBER} strokeWidth={2.6} /> : null}
    {legendCategoryLabel[category]}
  </div>
);

const BoardFigure: React.FC<{ category: LegendCategory; value: number; tone: string }> = ({
  category,
  value,
  tone,
}) => {
  const { t } = useTranslation('courses');
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ ...aboutFig(16, tone), lineHeight: 1 }}>{formatLegendValueCompact(category, value)}</div>
      {UNIT_KEY[category] ? (
        <div style={{ ...ABOUT_KICKER, marginTop: 3 }}>{t(`courseDetail.records.units.${UNIT_KEY[category]}`)}</div>
      ) : null}
    </div>
  );
};

/** Joint-holder faces: two overlapping 30px squircles, or one plus "+N". Decorative. */
const STACK_CUT = '0 0 0 2px #0A0A0C';
const HolderStack: React.FC<{ rows: CourseLegendRow[] }> = ({ rows }) => {
  const [first, second] = rows;
  const disc: React.CSSProperties = { position: 'absolute', top: 3, width: 30, height: 30, borderRadius: '34%', boxShadow: STACK_CUT };
  return (
    <div aria-hidden="true" style={{ position: 'relative', width: 52, height: 36 }}>
      <div style={{ ...disc, left: 0, zIndex: 0 }}>
        <SquircleAvatar src={first.user_photo_url} alt="" userId={first.user_id} size={30} thinRing />
      </div>
      {rows.length === 2 ? (
        <div style={{ ...disc, left: 20, zIndex: 1 }}>
          <SquircleAvatar src={second.user_photo_url} alt="" userId={second.user_id} size={30} thinRing />
        </div>
      ) : (
        <div
          style={{
            ...disc, left: 20, zIndex: 1, background: 'rgba(248,250,252,0.16)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, color: 'rgba(248,250,252,0.80)', fontFamily: SANS, ...FIGS,
          }}
        >
          +{rows.length - 1}
        </div>
      )}
    </div>
  );
};

interface RecordBookProps {
  courseId: string;
  courseName: string;
  /** Opens the Champions tab — the same handler the Panel version used. */
  onSeeAll?: () => void;
}

const RecordBook: React.FC<RecordBookProps> = ({ courseId, courseName, onSeeAll }) => {
  const { t } = useTranslation('courses');
  const { user } = useSupabaseSession();
  const { isLoading, previewRows, unclaimedCount, hasAnyHolder, viewerByCategory } =
    useCourseRecordSummary(courseId, user?.id ?? null);

  const openBoards = React.useCallback(() => {
    analyticsEvents.track('course_record_book_opened', { course_id: courseId });
    onSeeAll?.();
  }, [courseId, onSeeAll]);

  const heading = t('courseDetail.sections.recordBook');
  const meta =
    unclaimedCount > 0
      ? t('courseDetail.records.unclaimedMeta', {
          count: unclaimedCount,
          unclaimed: formatNumber(unclaimedCount),
        })
      : null;

  /** Where the viewing member stands on a board they do not hold. */
  const viewerLine = (category: LegendCategory, isYou: boolean, shared = false) => {
    if (isYou) {
      return (
        <div style={{ ...ABOUT_KICKER, color: A.AMBER_DEEP, marginTop: 4 }}>
          {shared ? t('courseDetail.records.youShare') : t('courseDetail.records.youHold')}
        </div>
      );
    }
    const standing = viewerByCategory.get(category);
    if (!standing) return null;
    return (
      <div style={{ marginTop: 3, fontSize: 10.5, fontWeight: 600, color: A.BODY, ...FIGS }}>
        <span>
          {t('courseDetail.records.youValue', {
            value: formatLegendValueCompact(category, standing.row.value),
          })}
        </span>
        <span style={{ marginLeft: 9, color: A.MUTE }}>
          {standing.behind
            ? t('courseDetail.records.youBehind', { gap: standing.gap })
            : t('courseDetail.records.youAhead')}
        </span>
      </div>
    );
  };

  const drillDown = (
    <>
      <AboutHairline style={{ marginTop: 18 }} />
      <button
        type="button"
        onClick={openBoards}
        style={{
          display: 'block',
          width: '100%',
          textAlign: 'left',
          background: 'transparent',
          border: 0,
          padding: '14px 0 0',
          cursor: 'pointer',
          fontFamily: SANS,
        }}
      >
        <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: A.INK }}>
          {t('courseDetail.records.allBoards')} ›
        </span>
        <span style={{ display: 'block', marginTop: 5, fontSize: 11, lineHeight: 1.5, color: A.DIM }}>
          {t('courseDetail.records.allBoardsSub')}
        </span>
      </button>
    </>
  );

  if (isLoading) return null;

  // NOBODY ON ANY BOARD — a sentence, not a card, and the link stays because
  // the destination explains what the boards are.
  if (!hasAnyHolder || previewRows.length === 0) {
    return (
      <AboutSection heading={heading}>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, fontWeight: 600, color: A.MUTE, fontFamily: SANS }}>
          {t('courseDetail.records.empty', { courseName })}
        </p>
        {drillDown}
      </AboutSection>
    );
  }

  // ONE NAME, EVERY BOARD.
  // Joint holders break a sweep: two members jointly holding every board must
  // not read as "X holds all five" — the full state says it board by board.
  const allUntied = previewRows.every((r) => r.rows.length === 1);
  const holderIds = new Set(previewRows.map((r) => r.row.user_id));
  const sweep = allUntied && holderIds.size === 1 && previewRows.length > 1 ? previewRows[0].row : null;

  if (sweep) {
    const isYou = !!user?.id && sweep.user_id === user.id;
    const tone = isYou ? A.AMBER_DEEP : A.INK;
    return (
      <AboutSection heading={heading} meta={meta}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <SquircleAvatar
            src={sweep.user_photo_url}
            alt={sweep.user_display_name ?? 'Golfer'}
            userId={sweep.user_id}
            size={30}
            thinRing
          />
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: tone,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontFamily: SANS,
              }}
            >
              {isYou
                ? t('courseDetail.records.sweepYou', {
                    count: previewRows.length,
                    boards: formatNumber(previewRows.length),
                  })
                : t('courseDetail.records.sweep', {
                    name: sweep.user_display_name ?? 'Golfer',
                    count: previewRows.length,
                    boards: formatNumber(previewRows.length),
                  })}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
          {previewRows.map(({ category, row }) => (
            <button
              key={category}
              type="button"
              onClick={openBoards}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 74px',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                textAlign: 'left',
                background: 'transparent',
                border: 0,
                padding: 0,
                cursor: 'pointer',
                fontFamily: SANS,
              }}
            >
              <BoardLabel category={category} tone={isYou ? A.AMBER_DEEP : undefined} />
              <BoardFigure category={category} value={row.value} tone={tone} />
            </button>
          ))}
        </div>

        {drillDown}
      </AboutSection>
    );
  }

  // FULL STATE — one row per board, each on its own hairline. The avatar
  // column widens to 52px for the WHOLE list when any board is tied, so labels
  // stay aligned; an untied course is pixel-identical to before.
  const anyTied = previewRows.some((r) => r.rows.length > 1);
  const isViewer = (r: { user_id: string; is_self: boolean }) =>
    r.is_self || (!!user?.id && r.user_id === user.id);
  const nameOf = (r: { user_id: string; is_self: boolean; user_display_name: string | null }) =>
    isViewer(r) ? t('courseDetail.records.you') : r.user_display_name ?? 'Golfer';
  return (
    <AboutSection heading={heading} meta={meta}>
      <div style={{ display: 'grid' }}>
        {previewRows.map(({ category, row, rows }) => {
          const isYou = rows.some(isViewer);
          const shared = rows.length > 1;
          const tone = isYou ? A.AMBER_DEEP : A.INK;
          return (
            <button
              key={category}
              type="button"
              onClick={openBoards}
              style={{
                display: 'grid',
                gridTemplateColumns: `${anyTied ? 52 : 36}px 1fr 74px`,
                alignItems: 'center',
                gap: 12,
                width: '100%',
                textAlign: 'left',
                background: 'transparent',
                border: 0,
                borderBottom: `1px solid ${A.HAIRLINE}`,
                padding: '11px 0',
                cursor: 'pointer',
                fontFamily: SANS,
              }}
            >
              {shared ? (
                <HolderStack rows={rows} />
              ) : (
                <SquircleAvatar
                  src={row.user_photo_url}
                  alt={row.user_display_name ?? 'Golfer'}
                  userId={row.user_id}
                  size={36}
                  thinRing
                />
              )}
              <div style={{ minWidth: 0 }}>
                <BoardLabel category={category} tone={isYou ? A.AMBER_DEEP : undefined} />
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: tone,
                    marginTop: 3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {rows.length === 1
                    ? nameOf(row)
                    : rows.length === 2
                      ? t('courseDetail.records.jointTwo', { first: nameOf(rows[0]), second: nameOf(rows[1]) })
                      : t('courseDetail.records.jointMany', { first: nameOf(rows[0]), count: rows.length - 1 })}
                </div>
                {viewerLine(category, isYou, shared)}
              </div>
              <BoardFigure category={category} value={row.value} tone={tone} />
            </button>
          );
        })}
      </div>
      {drillDown}
    </AboutSection>
  );
};

export default RecordBook;
