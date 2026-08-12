import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { CourseImageFallback } from './CourseImageFallback';
import { ShortlistGlassAction } from './ShortlistGlassAction';

import { useCourseCardMeta } from './hooks/useCourseCardMeta';
import { A, KICKER, NUMF, SANS, SCRIM_STRONG } from './tokens';
import { TITLE as TITLE_METRICS } from '@/lib/tokens/type';

/**
 * COURSE NEWS SHEET — the complete list of live courses behind Around the
 * World's "See all {n} courses" action (BRIEF_COURSE_NEWS_SHEET, the CARD GRID
 * amendment, the refinements brief, and the top-left figure-chip amendment).
 *
 * Content is a 2-column grid of mini course cards: image top (76px, through the
 * CourseImageFallback chain) carrying TWO glass chips on the top edge — the
 * FIGURE chip top-left ("72 GROSS", "8.2 RATING", "4 BIRDIES") and the
 * when-chip top-right — with the course name clean across the bottom scrim.
 * Beneath the image, two clamped lines of the course's TOP event in the same
 * wording grammar as the on-page cards.
 *
 * Taps: an entry that carries an opener (scorecard / review) opens that sheet
 * STACKED ABOVE this one; otherwise the card routes to the course page and
 * closes the sheet. Odd counts leave the last card alone in the left column.
 */

export interface CourseNewsEntry {
  courseId: string;
  courseName: string | null;
  courseImage: string | null;
  /** Most recent event time on the course — drives the when-chip. */
  at: string;
  /** Wording for the course's top event: actor + feat, already composed. */
  topLine: string;
  /** Figure for the top event ("72", "8.2", "4"). Figureless events: no chip. */
  figure?: string | null;
  /** Unit label beside the figure ("GROSS", "RATING", "BIRDIES"). */
  figureUnit?: string | null;
  /** Opens the scorecard / review sheet stacked above this one, when available. */
  onPress?: () => void;
}

interface Props {
  open: boolean;
  onClose: () => void;
  entries: CourseNewsEntry[];
  /** Human lens label for the caption ("For you", "Worldwide"). */
  lensLabel: string;
  whenLabel: (iso: string) => string;
  onCoursePress: (courseId: string) => void;
  /** Shortlist controls (BRIEF_DISCOVER_RELEVANCE part B). */
  canShortlist?: (courseId: string) => boolean;
  isShortlisted?: (courseId: string) => boolean;
  onToggleShortlist?: (courseId: string) => void;
}

/** "3mo ago" -> "3MO", "Last week" -> "LAST WEEK" (used only when it fits). */
function compactWhen(label: string): string {
  return label
    .replace(/\s*ago\s*$/i, '')
    .replace(/\s+/g, '')
    .toUpperCase();
}

export function CourseNewsSheet({
  open,
  onClose,
  entries,
  lensLabel,
  whenLabel,
  onCoursePress,
  canShortlist,
  isShortlisted,
  onToggleShortlist,
}: Props) {

  const { t } = useTranslation('courses');
  const ids = useMemo(() => entries.map((e) => e.courseId), [entries]);
  const metaQuery = useCourseCardMeta(open ? ids : []);
  const meta = metaQuery.data;
  // Meta feeds the card's NAME and IMAGE, so the tile is held whole while it is
  // in flight (BRIEF_DISCOVER_LOADING_STATES, layer 2a) — the entry's own
  // fallback name/image would only be rewritten a moment later.
  const metaPending = open && ids.length > 0 && metaQuery.isPending;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabelledBy="courseled-news-title"
      variant="light"
      surfaceColor={A.CANVAS}
      style={{
        height: '75dvh',
        maxHeight: '75dvh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: SANS,
        background: A.CANVAS,
      }}
    >
      <div
        style={{
          padding: '10px 16px 12px',
          background: A.CANVAS,
          borderBottom: `1px solid ${A.BORDER}`,
        }}
      >
        <div style={{ ...KICKER, color: A.DIM, marginBottom: 5 }}>
          {t('discover.kickerCourses', 'The courses')}
        </div>
        <div
          id="courseled-news-title"
          style={{
            ...TITLE_METRICS,
            color: A.INK,
          }}
        >
          {t('discover.aroundTheWorld', 'Standout rounds')}
        </div>
        <div style={{ fontSize: 11.5, color: A.MUTE, marginTop: 4 }}>
          {`${lensLabel} \u00B7 ${t('discover.last90lower', 'last 90 days')}`}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            alignItems: 'start',
          }}
        >
          {entries.map((e) => {
            const m = meta?.get(e.courseId);
            const hasFigure = !!e.figure;
            const when = whenLabel(e.at);
            return (
              <button
                key={e.courseId}
                type="button"
                onClick={() => {
                  analyticsEvents.track('discover_news_card_tap', {
                    courseId: e.courseId,
                    target: e.onPress ? 'detail' : 'course',
                  });
                  if (e.onPress) {
                    // Stacked above this sheet — the news sheet stays open.
                    e.onPress();
                    return;
                  }
                  onClose();
                  onCoursePress(e.courseId);
                }}
                style={{
                  background: A.PANEL,
                  border: `1px solid ${A.BORDER}`,
                  borderRadius: 14,
                  overflow: 'hidden',
                  padding: 0,
                  textAlign: 'left',
                  fontFamily: SANS,
                  cursor: 'pointer',
                }}
              >
                <CourseImageFallback
                  courseId={e.courseId}
                  courseName={m?.name ?? e.courseName}
                  imageUrl={m?.imageUrl ?? e.courseImage}
                  initialsSize={20}
                  pending={metaPending}
                  style={{ height: 76 }}
                >
                  <div style={{ position: 'absolute', inset: 0, background: SCRIM_STRONG }} />

                  {/* FIGURE chip — top-left, wins the space on narrow cards. */}
                  {hasFigure && (
                    <span
                      style={{
                        position: 'absolute',
                        top: 6,
                        left: 6,
                        display: 'inline-flex',
                        alignItems: 'baseline',
                        gap: 3,
                        background: 'rgba(10,14,10,0.55)',
                        backdropFilter: 'blur(6px)',
                        WebkitBackdropFilter: 'blur(6px)',
                        borderRadius: 999,
                        padding: '3px 8px',
                        maxWidth: 'calc(100% - 56px)',
                        overflow: 'hidden',
                      }}
                    >
                      <span style={{ ...NUMF, fontSize: 12, color: '#FFFFFF', lineHeight: 1 }}>
                        {e.figure}
                      </span>
                      {e.figureUnit && (
                        <span
                          style={{
                            fontSize: 7.5,
                            fontWeight: 700,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            color: 'rgba(255,255,255,0.72)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {e.figureUnit}
                        </span>
                      )}
                    </span>
                  )}

                  {/* WHEN chip — top-right, truncates when a figure chip is present. */}
                  <span
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      fontSize: 7.5,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: '#FFFFFF',
                      background: 'rgba(10,14,10,0.55)',
                      backdropFilter: 'blur(6px)',
                      WebkitBackdropFilter: 'blur(6px)',
                      borderRadius: 999,
                      padding: '3px 8px',
                      maxWidth: hasFigure ? 46 : 88,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {hasFigure ? compactWhen(when) : when}
                  </span>

                  {/* SHORTLIST — bottom-right; figure chip owns top-left and the
                      when chip top-right, so no collision at 320dp. */}
                  {onToggleShortlist && canShortlist?.(e.courseId) && (
                    <ShortlistGlassAction
                      shortlisted={!!isShortlisted?.(e.courseId)}
                      onToggle={() => onToggleShortlist(e.courseId)}
                      label={t('discover.shortlist.action', 'Add to your list')}
                      size={24}
                    />
                  )}

                  <div
                    style={{
                      position: 'absolute',
                      left: 8,
                      right: onToggleShortlist && canShortlist?.(e.courseId) ? 36 : 8,
                      bottom: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#fff',
                      letterSpacing: '-0.01em',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {m?.name ?? e.courseName ?? t('discover.unknownCourse', 'Course')}
                  </div>
                </CourseImageFallback>


                <div
                  style={{
                    padding: '7px 9px',
                    fontSize: 11,
                    fontWeight: 600,
                    lineHeight: 1.35,
                    color: A.BODY,
                    minHeight: 42,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {e.topLine}
                </div>
              </button>
            );
          })}
        </div>
        <div aria-hidden style={{ height: 24 }} />
      </div>
    </BottomSheet>
  );
}

export default CourseNewsSheet;
