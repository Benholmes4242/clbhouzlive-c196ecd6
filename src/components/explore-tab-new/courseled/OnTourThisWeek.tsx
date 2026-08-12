import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { supabase } from '@/integrations/supabase/client';
import { useCourseImageResolver } from '@/features/tourhub/hooks/useCourseImageResolver';
import { formatCurrencyUsdCompact, formatNumber } from '@/i18n/format';
import { CourseImageFallback } from './CourseImageFallback';
import { useTourThisWeek, type TourWeekEvent } from './hooks/useTourThisWeek';
import { isPeekFresh, useTourLivePeek } from './hooks/useTourLivePeek';
import { TourRail as TourRailShell } from './DiscoverCourseLedSkeleton';
import { fmtScore } from '@/features/tourhub/utils/fmtScore';
import { getScoreColor } from '@/features/tourhub/_shared/scoreColor';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { A, CARD_SHELL, Eyebrow, ImageChip, InkAction, LABEL, NUMF, SANS, SCRIM_SOFT } from './tokens';

/**
 * Section 3 — ON TOUR THIS WEEK (BRIEF, section 3).
 *
 * The facts-and-figures template: par, yards and purse across three cells,
 * defending champion on the footer line, and a MEDIA chip when clbhouz holds
 * member media on the same course.
 *
 * VERIFY verdicts (handed to Ben by name):
 *   purse — PRESENT on 61/64 events in the current window. Rendered as the
 *     third cell; when absent the grid drops to two cells rather than inventing
 *     a field size.
 *   defending champion — PRESENT on 56/64 directly on sr_tournaments, so no
 *     prior-season derivation is needed. Absent falls back to the round count.
 *   venue -> catalogue course — sr_tournaments.golf_course_id is NULL platform
 *     wide, so the link is resolved by VENUE NAME through the Tour Hub's
 *     existing useCourseImageResolver (ILIKE + token scoring, cached in
 *     sr_course_map). Unresolved venues carry no media chip and route to the
 *     tournament only.
 */

const DOT = '\u00B7';

interface Props {
  /** Last-seen stamp for the new-since markers; null marks nothing. */
  lastSeen?: number | null;
  onTournamentPress: (e: TourWeekEvent) => void;
  onMediaPress: (courseId: string) => void;
  onTourHub: () => void;
}

/** Photo + video counts for the resolved courses, one round-trip. */
function useCourseMediaCounts(courseIds: string[]) {
  const key = Array.from(new Set(courseIds.filter(Boolean))).sort();
  return useQuery({
    queryKey: ['courseled', 'tour-media-counts', key.join('|')],
    queryFn: async (): Promise<Map<string, number>> => {
      const out = new Map<string, number>();
      if (key.length === 0) return out;
      const { data, error } = await supabase
        .from('posts')
        .select('id, tagged_course_ids, course_id, post_media(id)')
        .eq('status', 'published')
        .overlaps('tagged_course_ids', key);
      if (error) throw error;
      for (const row of ((data ?? []) as unknown) as Array<{
        tagged_course_ids: string[] | null;
        course_id: string | null;
        post_media: Array<{ id: string }> | null;
      }>) {
        const n = row.post_media?.length ?? 0;
        if (n === 0) continue;
        for (const id of row.tagged_course_ids ?? []) {
          if (key.includes(id)) out.set(id, (out.get(id) ?? 0) + n);
        }
      }
      return out;
    },
    enabled: key.length > 0,
    staleTime: 15 * 60 * 1000,
  });
}

function playDays(e: TourWeekEvent): string {
  const start = new Date(`${e.startDate}T12:00:00`);
  const end = new Date(`${e.endDate}T12:00:00`);
  const fmt = (d: Date) => d.toLocaleDateString(undefined, { weekday: 'short' });
  if (!e.thisWeek) return start.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  return e.startDate === e.endDate ? fmt(start) : `${fmt(start)} \u2013 ${fmt(end)}`;
}

/** Live and upcoming states now share one three-up, so no fixed block height. */

const LIVE_DOT = '#E5484D';

/** Canonical tour convention: under par is RED, over par ink, level neutral. */
function scoreColor(score: number | null | undefined): string {
  return getScoreColor(score, 'light');
}

/**
 * The three-up figure row shared by the LIVE and UPCOMING states, so the rail
 * reads as one structure as a member scrolls past both. Absent values are never
 * passed: the row rebalances on however many cells it is given, and the end cell
 * hugs its own edge exactly as the first does (that mirroring is a property of
 * the grid, not of the rule that used to sit above it).
 */
function ThreeUp({ cells }: { cells: Array<[string, string, string]> }) {
  if (cells.length === 0) return null;
  return (
    <div
      style={{
        marginTop: 12,
        display: 'grid',
        gridTemplateColumns: `repeat(${cells.length}, 1fr)`,
        gap: 4,
      }}
    >
      {cells.map(([label, value, tone], i) => (
        <div
          key={label}
          style={{
            minWidth: 0,
            textAlign:
              i === 0 ? 'left' : i === cells.length - 1 ? 'right' : 'center',
          }}
        >
          <div
            style={{
              ...NUMF,
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: '-0.025em',
              color: tone,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {value}
          </div>
          <div style={{ ...LABEL, fontSize: 6.5, color: A.DIM, marginTop: 4 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

/** "Rory McIlroy" -> "McIlroy". The card has room for the label, not the name. */
function surname(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : name.trim();
}

/** Whole days from today to the tee-off date; 0 or less reads "Today". */
function daysUntil(startDate: string): number {
  const start = new Date(`${startDate}T12:00:00`).getTime();
  return Math.ceil((start - Date.now()) / 86_400_000);
}



export function OnTourThisWeek({ lastSeen = null, onTournamentPress, onMediaPress, onTourHub }: Props) {
  const { t } = useTranslation('courses');
  const eventsQuery = useTourThisWeek();
  const events = eventsQuery.data;

  const venues = useMemo(
    () =>
      (events ?? []).map((e) => ({
        venueName: e.venueName,
        venueCourseName: e.venueCourseName,
        city: e.venueCity,
        country: e.venueCountry,
      })),
    [events],
  );
  const resolverQuery = useCourseImageResolver(venues);
  const resolved = resolverQuery.data;
  const courseIds = useMemo(
    () =>
      (events ?? [])
        .map((e) => resolved?.get(e.venueName)?.golfCourseId)
        .filter((v): v is string => !!v),
    [events, resolved],
  );
  const { data: mediaCounts } = useCourseMediaCounts(courseIds);

  // ONE read of sr_leaderboards for the live tournaments on screen.
  const liveIds = useMemo(
    () => (events ?? []).filter((e) => e.isLive).map((e) => e.id),
    [events],
  );
  const peekQuery = useTourLivePeek(liveIds);
  const peeks = peekQuery.data;
  const reducedMotion = usePrefersReducedMotion();

  // WHOLE-CARD HOLD (layer 2a). The resolver feeds the card's IMAGE and the
  // peek feeds its headline figures, so a card built before either settles
  // rewrites itself in front of the reader. Both are identity here, so the
  // rail holds its shell until the three reads have settled. Each is only
  // awaited when it actually has work: no venues / no live events is settled.
  const pending =
    eventsQuery.isPending ||
    (venues.length > 0 && resolverQuery.isPending) ||
    (liveIds.length > 0 && peekQuery.isPending);

  // NEW SINCE: a tournament is new when the WEEK changes, never per scoring
  // update — the card's startDate is the only stamp compared here.
  // A moving leaderboard is a state, not an event: this section neither shows
  // an eyebrow dot nor feeds the tab badge.

  if (pending) return <TourRailShell />;
  if (!events || events.length === 0) return null;

  const anyThisWeek = events.some((e) => e.thisWeek);

  return (
    <section>
      <Eyebrow
        aside={<InkAction onClick={onTourHub}>{t('discover.tourHub', 'Tour hub')}</InkAction>}
      >
        {anyThisWeek
          ? t('discover.onTourThisWeek', 'On tour this week')
          : t('discover.onTourNext', 'Next on tour')}
      </Eyebrow>

      <div
        className="scrollbar-hide"
        style={{ display: 'flex', gap: 10, overflowX: 'auto' }}
      >
        {events.map((e) => {
          const match = resolved?.get(e.venueName);
          const courseId = match?.golfCourseId ?? null;
          const mediaCount = courseId ? mediaCounts?.get(courseId) ?? 0 : 0;
          const rawPeek = e.isLive ? peeks?.get(e.id) ?? null : null;
          // Older than 10 minutes and the sync has stalled: keep the scores,
          // drop the LIVE claim for a neutral LATEST chip.
          const peekFresh = isPeekFresh(rawPeek?.updatedAt);
          const peek = rawPeek;
          const cells: Array<[string, string]> = [];
          if (e.par != null) cells.push([t('discover.par', 'Par'), formatNumber(e.par)]);
          if (e.yardage != null) cells.push([t('discover.yards', 'Yards'), formatNumber(e.yardage)]);
          if (e.purse != null)
            cells.push([t('discover.purse', 'Purse'), formatCurrencyUsdCompact(e.purse)]);

          return (
            <div
              key={e.id}
              style={{
                ...CARD_SHELL,
                // No border and no new-since ink ring on tour cards.
                border: 'none',
                boxShadow: 'none',
                width: 266,
                flexShrink: 0,
                fontFamily: SANS,
              }}
            >
              <button
                type="button"
                onClick={() => onTournamentPress(e)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: 0,
                  border: 'none',
                  background: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <CourseImageFallback
                  courseId={courseId ?? e.id}
                  courseName={match?.name ?? e.venueName}
                  imageUrl={match?.imageUrl ?? null}
                  style={{ height: 100 }}
                >
                  <div style={{ position: 'absolute', inset: 0, background: SCRIM_SOFT }} />
                  <ImageChip side="left">{e.tourLabel}</ImageChip>
                  {peek ? (
                    <ImageChip>
                      <span
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <span
                          className="clbhouz-live-dot"
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: LIVE_DOT,
                            animation:
                              peekFresh && !reducedMotion
                                ? 'clbhouzLiveDotPulse 2s ease-in-out infinite'
                                : undefined,
                          }}
                        />
                        {peekFresh
                          ? t('discover.live', 'Live')
                          : t('discover.latest', 'Latest')}
                      </span>
                    </ImageChip>
                  ) : (
                    <ImageChip>{playDays(e)}</ImageChip>
                  )}
                  <div style={{ position: 'absolute', left: 10, right: 10, bottom: 8 }}>
                    <div
                      style={{
                        fontSize: 14.5,
                        fontWeight: 700,
                        color: '#fff',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {match?.name ?? e.venueName}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 500,
                        color: 'rgba(255,255,255,0.7)',
                        marginTop: 1,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {e.name}
                    </div>
                  </div>

                </CourseImageFallback>

                {peek && peek.leaderScore != null ? (
                  (() => {
                    // ONE SHAPE FOR BOTH STATES (BRIEF_ON_TOUR_TILE_STATE).
                    // A tie is the more interesting state, so it keeps the
                    // figure and only swaps the who and margin slots.
                    const tiedCount = peek.leaderTiedExtra + 1;
                    const isTied = tiedCount > 1;
                    // MARGIN: taken straight off the peek — chasingScore minus
                    // leaderScore, both to-par, so the difference IS the shots
                    // clear. Never re-derived from rows.
                    const margin =
                      !isTied && peek.chasingScore != null
                        ? peek.chasingScore - peek.leaderScore
                        : null;
                    const thruText =
                      peek.thru == null
                        ? null
                        : peek.thru >= 18
                          ? t('discover.tour.thruF', 'F')
                          : String(peek.thru);
                    const cellsLive: Array<[string, string, string]> = [];
                    if (peek.round != null) {
                      // A count, not a score: INK, never the score colours.
                      cellsLive.push([
                        t('discover.tour.round', 'Round'),
                        `R${peek.round}`,
                        A.INK,
                      ]);
                    }
                    if (thruText) {
                      cellsLive.push([t('discover.tour.thru', 'Thru'), thruText, A.INK]);
                    }
                    // THIRD CELL — never "Second": that figure IS the margin
                    // printed on line 1, told a second time. Field average today
                    // is not derivable from this peek (it reads only the top 12
                    // positions), so the brief's stated fallback applies: holes
                    // remaining for the leader.
                    if (peek.thru != null && peek.thru < 18) {
                      cellsLive.push([
                        t('discover.tour.holesLeft', 'Holes left'),
                        String(18 - peek.thru),
                        A.INK,
                      ]);
                    }

                    return (
                      <div style={{ padding: '12px 14px 13px' }}>
                        {/* LINE 1 — the figure, who holds it, and the margin. */}
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 9 }}>
                          <span
                            style={{
                              ...NUMF,
                              fontSize: 25,
                              fontWeight: 700,
                              lineHeight: 0.92,
                              letterSpacing: '-0.035em',
                              color: scoreColor(peek.leaderScore),
                            }}
                          >
                            {fmtScore(peek.leaderScore)}
                          </span>
                          <span
                            style={{
                              flex: 1,
                              minWidth: 0,
                              fontSize: 13.5,
                              fontWeight: 700,
                              color: A.BODY,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {isTied
                              ? t('discover.tour.nTied', {
                                  defaultValue: '{{count}} tied',
                                  count: tiedCount,
                                })
                              : peek.leaderName}
                          </span>
                          {(isTied || margin != null) && (
                            <span
                              style={{
                                ...LABEL,
                                fontSize: 6.5,
                                fontWeight: 700,
                                letterSpacing: '0.13em',
                                color: A.DIM,
                                marginLeft: 'auto',
                                flexShrink: 0,
                              }}
                            >
                              {isTied
                                ? t('discover.tiedLead', 'Tied lead')
                                : t('discover.tour.clear', {
                                    defaultValue: '{{count}} clear',
                                    count: margin as number,
                                  })}
                            </span>
                          )}
                        </div>

                        {/* LINE 2 — does the lead mean anything yet. No rule
                            inside a panel: whitespace separates the blocks. */}
                        <ThreeUp cells={cellsLive} />
                      </div>
                    );

                  })()
                ) : (

                  (() => {
                    // UPCOMING takes the SAME shape as live: a line 1 with the
                    // headline fact right-aligned, then the three-up. Cells with
                    // no value are never pushed, so the row rebalances.
                    const cellsUp: Array<[string, string, string]> = [];
                    if (e.defendingChampion) {
                      cellsUp.push([
                        t('discover.defending', 'Defending'),
                        surname(e.defendingChampion),
                        A.INK,
                      ]);
                    }
                    for (const [l, v] of cells) cellsUp.push([l, v, A.INK]);
                    if (cellsUp.length === 0) return null;
                    const days = daysUntil(e.startDate);
                    return (
                      <div style={{ padding: '12px 14px 13px' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 9 }}>
                          <span
                            style={{
                              ...LABEL,
                              fontSize: 6.5,
                              fontWeight: 700,
                              letterSpacing: '0.13em',
                              color: A.DIM,
                            }}
                          >
                            {t('discover.tour.startsIn', 'Starts in')}
                          </span>
                          <span
                            style={{
                              ...NUMF,
                              marginLeft: 'auto',
                              fontSize: 15,
                              fontWeight: 700,
                              letterSpacing: '-0.025em',
                              color: A.INK,
                            }}
                          >
                            {days <= 0
                              ? t('discover.tour.startsToday', 'Today')
                              : t('discover.tour.nDays', {
                                  defaultValue: '{{count}} days',
                                  count: days,
                                })}
                          </span>
                        </div>
                        <ThreeUp cells={cellsUp} />
                      </div>
                    );
                  })()
                )}
              </button>

              {/* CONDENSE: the footer only takes height when it carries
                  something. The defending champion now lives in the three-up,
                  so the footer is the media chip alone. */}
              {!!courseId && mediaCount > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '0 14px 11px',
                }}
              >





                {courseId && mediaCount > 0 && (
                  <button
                    type="button"
                    onClick={() => onMediaPress(courseId)}
                    style={{
                      marginLeft: 'auto',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 9.5,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: A.INK,
                      background: 'transparent',
                      border: `1px solid ${A.BORDER}`,
                      borderRadius: 999,
                      padding: '5px 9px',
                      fontFamily: SANS,
                      cursor: 'pointer',
                    }}
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={A.INK}
                      strokeWidth="2.2"
                      aria-hidden
                    >
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <circle cx="9" cy="11" r="2" />
                      <path d="m21 15-4-4-6 6" />
                    </svg>
                    {t('discover.nPhotos', {
                      defaultValue: '{{count}} photos',
                      count: mediaCount,
                    })}
                  </button>
                )}
              </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default OnTourThisWeek;
