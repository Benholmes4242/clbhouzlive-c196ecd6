import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { CourseImageFallback } from './CourseImageFallback';
import { ShortlistGlassAction } from './ShortlistGlassAction';

import { useCourseCardMeta } from './hooks/useCourseCardMeta';
import { A, KICKER, LABEL, NUMF, SANS } from './tokens';
import { SCRIM_STANDOUT } from '@/styles/photoScrim';
import { TITLE as TITLE_METRICS } from '@/lib/tokens/type';

/**
 * THE STANDOUT ROUNDS SHEET — the complete list of FEATS behind Around the
 * World's see-all action (BRIEF_STANDOUT_SHEET_GROUPED_ROWS).
 *
 * §0 SETTLED: this is a FEAT LIST, not a course list. The old build collapsed
 * each course to its single most notable event, which is why its header said
 * "the courses" — but the section it serves shows feats, and the sheet is "the
 * record" that must hold everything. One row per feat; a course with four
 * standout rounds appears four times, distinguished by its two-line name.
 *
 * §1/§2 GROUPED ROWS. Rows sit under STICKY achievement headers in the same
 * order as the section (Records broken / Once in a lifetime / Beating the
 * course), each carrying its count. NO KIND BUDGET IS APPLIED HERE — with 208
 * course records against 49 of everything else, the headers are the only thing
 * that makes an ace findable, and the sheet must still show every feat.
 *
 * Taps are unchanged: an entry carrying an opener opens the scorecard / review
 * STACKED ABOVE this sheet; otherwise the row routes to the course page and
 * closes the sheet.
 */

export interface CourseNewsEntry {
  /** Stable per-FEAT key (event id) — courses repeat down the list. */
  id: string;
  courseId: string;
  courseName: string | null;
  courseImage: string | null;
  /** Group this feat belongs to, and its already-localised heading. */
  groupId: string;
  groupLabel: string;
  /** Event time — drives the relative date on the member line. */
  at: string;
  /** The achievement, in the section's wording ("New course record"). */
  featLine: string;
  /** Member name, already resolved ("You" for the viewer). */
  who: string;
  isOwn: boolean;
  avatarUrl?: string | null;
  avatarUserId?: string | null;
  /** Figure for the feat ("72", "8.2", "4"). Figureless feats: no chip. */
  figure?: string | null;
  /** Unit label beside the figure ("GROSS", "RATING", "BIRDIES"). */
  figureUnit?: string | null;
  /** TOPAR red on an under-par score, as the tiles do it. */
  figureTone?: string;
  /**
   * SECOND FIGURE (§6) — the wait on a first-ever feat, drawn in the same chip
   * after a hairline. Null renders no hairline at all.
   */
  wait?: number | null;
  waitLabel?: string | null;
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
  /**
   * SHORTLIST (§7) — resolved by the caller as "signed in AND the member has
   * NOT played this course". It is the want-to-play control, so a played or
   * rated course never shows it; that is the rule behind its conditional
   * appearance, and it is worth keeping.
   */
  canShortlist?: (courseId: string) => boolean;
  isShortlisted?: (courseId: string) => boolean;
  onToggleShortlist?: (courseId: string) => void;
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

  /** Distinct courses — meta reads once even when a course repeats. */
  const ids = useMemo(
    () => Array.from(new Set(entries.map((e) => e.courseId))),
    [entries],
  );
  const metaQuery = useCourseCardMeta(open ? ids : []);
  const meta = metaQuery.data;
  const metaPending = open && ids.length > 0 && metaQuery.isPending;

  /**
   * GROUPS in ARRIVAL ORDER — the entries are handed over already sorted in the
   * section's group order, so nothing is re-ranked here.
   */
  const buckets = useMemo(() => {
    const out: { id: string; label: string; items: CourseNewsEntry[] }[] = [];
    for (const e of entries) {
      let b = out.find((x) => x.id === e.groupId);
      if (!b) {
        b = { id: e.groupId, label: e.groupLabel, items: [] };
        out.push(b);
      }
      b.items.push(e);
    }
    return out;
  }, [entries]);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabelledBy="courseled-news-title"
      variant="light"
      surfaceColor={A.CANVAS}
      style={{
        height: 'auto',
        maxHeight: '85dvh',
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
          {t('discover.kickerFeats', 'The record')}
        </div>
        <div id="courseled-news-title" style={{ ...TITLE_METRICS, color: A.INK }}>
          {t('discover.aroundTheWorld', 'Standout rounds')}
        </div>
        <div style={{ fontSize: 11.5, color: A.MUTE, marginTop: 4 }}>
          {`${lensLabel} \u00B7 ${t('discover.last90lower', 'last 90 days')}`}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {buckets.map((b) => (
          <section key={b.id}>
            {/* STICKY HEADER — opaque canvas so rows never show through. */}
            <div
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 2,
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 8,
                padding: '8px 16px',
                background: A.CANVAS,
                borderBottom: `1px solid ${A.BORDER}`,
              }}
            >
              <span style={{ ...LABEL, color: A.INK }}>{b.label}</span>
              <span style={{ ...NUMF, fontSize: 11, color: A.MUTE }}>{b.items.length}</span>
            </div>

            {b.items.map((e) => {
              const m = meta?.get(e.courseId);
              const name = m?.name ?? e.courseName ?? t('discover.unknownCourse', 'Course');
              const showShortlist = !!onToggleShortlist && !!canShortlist?.(e.courseId);
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => {
                    analyticsEvents.track('discover_news_card_tap', {
                      courseId: e.courseId,
                      target: e.onPress ? 'detail' : 'course',
                    });
                    if (e.onPress) {
                      e.onPress();
                      return;
                    }
                    onClose();
                    onCoursePress(e.courseId);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '10px 16px',
                    background: A.CANVAS,
                    border: 'none',
                    borderBottom: `1px solid ${A.BORDER}`,
                    textAlign: 'left',
                    fontFamily: SANS,
                    cursor: 'pointer',
                  }}
                >
                  {/* THE THUMB — 84x62, the figure chip on it. */}
                  <div style={{ width: 84, flexShrink: 0 }}>
                    <CourseImageFallback
                      courseId={e.courseId}
                      courseName={name}
                      imageUrl={m?.imageUrl ?? e.courseImage}
                      initialsSize={16}
                      pending={metaPending}
                      style={{ height: 62, borderRadius: 8, overflow: 'hidden' }}
                    >
                      <div style={{ position: 'absolute', inset: 0, background: SCRIM_STANDOUT }} />
                      {e.figure && (
                        <span
                          className="standout-figure-chip"
                          style={{
                            position: 'absolute',
                            top: 6,
                            left: 6,
                            display: 'inline-flex',
                            alignItems: 'baseline',
                            gap: 3,
                            padding: '3px 7px',
                            borderRadius: 8,
                            maxWidth: 'calc(100% - 12px)',
                          }}
                        >
                          <span
                            style={{
                              ...NUMF,
                              fontSize: 13,
                              lineHeight: 1,
                              color: e.figureTone ?? '#FFFFFF',
                            }}
                          >
                            {e.figure}
                          </span>
                          {e.figureUnit && (
                            <span
                              style={{
                                fontSize: 6.5,
                                fontWeight: 700,
                                letterSpacing: '0.12em',
                                textTransform: 'uppercase',
                                lineHeight: 1,
                                color: 'rgba(255,255,255,0.9)',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {e.figureUnit}
                            </span>
                          )}
                          {/* THE SECOND FIGURE (§6) — one hairline, then the
                              wait. No hairline at all when there is none. */}
                          {e.wait != null && e.wait > 0 ? (
                            <>
                              <span
                                aria-hidden
                                style={{
                                  alignSelf: 'stretch',
                                  width: 1,
                                  marginLeft: 1,
                                  background: 'rgba(255,255,255,0.24)',
                                }}
                              />
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'baseline',
                                  gap: 2,
                                }}
                              >
                                {e.waitLabel && (
                                  <span
                                    style={{
                                      fontSize: 6.5,
                                      fontWeight: 700,
                                      letterSpacing: '0.12em',
                                      textTransform: 'uppercase',
                                      color: 'rgba(255,255,255,0.72)',
                                    }}
                                  >
                                    {e.waitLabel}
                                  </span>
                                )}
                                <span
                                  style={{ ...NUMF, fontSize: 11, lineHeight: 1, color: '#FFFFFF' }}
                                >
                                  {e.wait}
                                </span>
                              </span>
                            </>
                          ) : null}
                        </span>
                      )}
                      {showShortlist && (
                        <ShortlistGlassAction
                          shortlisted={!!isShortlisted?.(e.courseId)}
                          onToggle={() => onToggleShortlist?.(e.courseId)}
                          label={t('discover.shortlist.action', 'Add to your list')}
                          size={22}
                        />
                      )}
                    </CourseImageFallback>
                  </div>

                  {/* THE TEXT — course name over two lines, so two courses at
                      one club stay distinguishable. */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        lineHeight: 1.25,
                        color: A.INK,
                        letterSpacing: '-0.01em',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {name}
                    </div>
                    {e.featLine && (
                      <div
                        style={{
                          fontSize: 11.5,
                          fontWeight: 600,
                          color: A.BODY,
                          marginTop: 2,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {e.featLine}
                      </div>
                    )}
                    {/* MEMBER LINE — avatar, name, and the date IN FULL (§4). */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        marginTop: 4,
                        minWidth: 0,
                      }}
                    >
                      <SquircleAvatar
                        size={16}
                        src={e.avatarUrl ?? null}
                        userId={e.avatarUserId ?? null}
                        alt={e.who}
                        hideRing
                      />
                      {e.who && (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: e.isOwn ? A.AMBER : A.INK,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: 130,
                          }}
                        >
                          {e.who}
                        </span>
                      )}
                      <span style={{ fontSize: 10.5, color: A.MUTE, whiteSpace: 'nowrap' }}>
                        {whenLabel(e.at)}
                      </span>
                    </div>
                  </div>

                  <ChevronRight size={16} color={A.DIM} style={{ flexShrink: 0 }} />
                </button>
              );
            })}
          </section>
        ))}
        <div aria-hidden style={{ height: 24 }} />
      </div>
    </BottomSheet>
  );
}

export default CourseNewsSheet;
