import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { supabase } from '@/integrations/supabase/client';
import { useCourseImageResolver } from '@/features/tourhub/hooks/useCourseImageResolver';
import { formatCurrencyUsdCompact, formatNumber } from '@/i18n/format';
import { CourseImageFallback } from './CourseImageFallback';
import { useTourThisWeek, type TourWeekEvent } from './hooks/useTourThisWeek';
import { isPeekFresh, useTourLivePeek } from './hooks/useTourLivePeek';
import { fmtScore } from '@/features/tourhub/utils/fmtScore';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { countNewSince, isNewSince, useReportNewCount } from './newSince';
import { A, CARD_SHELL, Eyebrow, ImageChip, InkAction, LABEL, NEW_CARD_RING, NUMF, SANS, SCRIM_SOFT } from './tokens';

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

/** Live block and stat grid share one height so the rail stays level. */
const STAT_BLOCK_H = 64;
const LIVE_DOT = '#E5484D';
const UNDER_PAR = '#0F8F4A';
const OVER_PAR = '#C0392B';

function scoreColor(score: number | null | undefined): string {
  if (score == null || score === 0) return A.INK;
  return score < 0 ? UNDER_PAR : OVER_PAR;
}



export function OnTourThisWeek({ lastSeen = null, onTournamentPress, onMediaPress, onTourHub }: Props) {
  const { t } = useTranslation('courses');
  const { data: events } = useTourThisWeek();

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
  const { data: resolved } = useCourseImageResolver(venues);
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
  const { data: peeks } = useTourLivePeek(liveIds);
  const reducedMotion = usePrefersReducedMotion();

  // NEW SINCE: a tournament is new when the WEEK changes, never per scoring
  // update — the card's startDate is the only stamp compared here.
  const newCount = countNewSince(events ?? [], (e) => e.startDate, lastSeen);
  useReportNewCount('tour', newCount);

  if (!events || events.length === 0) return null;
  const anyThisWeek = events.some((e) => e.thisWeek);

  return (
    <section>
      <Eyebrow
        dot={newCount > 0}
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
                ...(isNewSince(e.startDate, lastSeen) ? NEW_CARD_RING : null),
                width: 272,
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
                        fontSize: 14,
                        fontWeight: 800,
                        color: '#fff',
                        letterSpacing: '-0.015em',
                      }}
                    >
                      {match?.name ?? e.venueName}
                    </div>
                    <div
                      style={{
                        fontSize: 10.5,
                        color: 'rgba(255,255,255,0.8)',
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

                {peek ? (
                  <div
                    style={{
                      height: STAT_BLOCK_H,
                      boxSizing: 'border-box',
                      padding: '8px 12px 8px',
                    }}
                  >
                    <div style={{ ...LABEL, color: A.DIM }}>
                      {peek.leaderTiedExtra > 0
                        ? t('discover.tiedLead', 'Tied lead')
                        : t('discover.leader', 'Leader')}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 1 }}>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 800,
                          color: A.INK,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        {peek.leaderName}
                      </span>
                      <span
                        style={{
                          ...NUMF,
                          fontSize: 17,
                          fontWeight: 800,
                          color: scoreColor(peek.leaderScore),
                        }}
                      >
                        {fmtScore(peek.leaderScore)}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: A.BODY, lineHeight: 1.3 }}>
                      {peek.round != null && peek.thru != null && peek.thru >= 18
                        ? t('discover.roundFinished', 'R{{round}} \u00b7 F', { round: peek.round })
                        : peek.round != null && peek.thru != null
                          ? t('discover.roundThru', 'R{{round}} \u00b7 thru {{thru}}', {
                              round: peek.round,
                              thru: peek.thru,
                            })
                          : peek.thru != null
                            ? t('discover.thruOnly', 'Thru {{thru}}', { thru: peek.thru })
                            : e.tourLabel}
                    </div>
                  </div>

                ) : (
                  cells.length > 0 && (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${cells.length}, 1fr)`,
                        height: STAT_BLOCK_H,
                        boxSizing: 'border-box',
                        padding: '10px 12px 8px',
                      }}
                    >
                      {cells.map(([l, v]) => (
                        <div key={l} style={{ textAlign: 'center' }}>
                          <div style={LABEL}>{l}</div>
                          <div style={{ ...NUMF, fontSize: 14.5, color: A.INK, marginTop: 2 }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </button>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '0 12px 11px',
                }}
              >
                {peek && peek.chasingName ? (
                  <span style={{ fontSize: 11, fontWeight: 600, color: A.BODY, lineHeight: 1.35 }}>
                    {peek.chasingName} {DOT}{' '}
                    <span style={{ ...NUMF, fontWeight: 700, color: A.BODY }}>
                      {fmtScore(peek.chasingScore)}
                    </span>
                  </span>
                ) : peek ? (
                  // Second place unresolved while live: omit rather than blank.
                  <span style={{ fontSize: 11, color: A.DIM }}>{e.tourLabel}</span>
                ) : e.defendingChampion ? (
                  <span style={{ fontSize: 11, fontWeight: 600, color: A.BODY, lineHeight: 1.35 }}>
                    {t('discover.defending', 'Defending')} {DOT}{' '}
                    <span style={{ fontWeight: 600, color: A.BODY }}>{e.defendingChampion}</span>
                  </span>
                ) : (
                  <span style={{ fontSize: 11, color: A.DIM }}>{e.tourLabel}</span>
                )}


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
                      fontWeight: 800,
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
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default OnTourThisWeek;
