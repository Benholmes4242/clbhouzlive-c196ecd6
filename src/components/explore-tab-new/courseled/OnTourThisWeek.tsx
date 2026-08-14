import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { supabase } from '@/integrations/supabase/client';
import { useCourseImageResolver } from '@/features/tourhub/hooks/useCourseImageResolver';
import { formatCurrencyUsdCompact, formatNumber } from '@/i18n/format';
import { CourseImageFallback } from './CourseImageFallback';
import { useTourThisWeek, type TourWeekEvent } from './hooks/useTourThisWeek';
import { isPeekFresh, useTourLivePeek, type PeekPosition } from './hooks/useTourLivePeek';
import { TourRail as TourRailShell } from './DiscoverCourseLedSkeleton';
import { fmtScore } from '@/features/tourhub/utils/fmtScore';
import { getScoreColor } from '@/features/tourhub/_shared/scoreColor';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { SCRIM_BASE, SCRIM_HOTSPOT, SCRIM_TOP_BAND } from './photoScrim';
import { A, CARD_SHELL, Eyebrow, InkAction, LABEL, NUMF, SANS } from './tokens';

/**
 * Section 3 — ON TOUR THIS WEEK (BRIEF_ON_TOUR_TILE_ENRICHMENT).
 *
 * THREE STATES, ONE HEIGHT BUDGET (~170px), NO NEW QUERY. The single read of
 * sr_leaderboards at useTourLivePeek now yields the TOP THREE POSITIONS as well
 * as the four figures it always yielded; nothing else was added.
 *
 * POSITIONS, NOT PLAYERS: five tied for the lead is ONE position, and places
 * skip by tie size (a six-way T2 is followed by EIGHTH). Derivation lives in
 * useTourLivePeek so both the live and completed states use ONE row renderer.
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

const LIVE_DOT = '#E5484D';
const PHOTO_H = 84;

/** Canonical tour convention: under par is RED, over par ink, level neutral. */
function scoreColor(score: number | null | undefined): string {
  return getScoreColor(score, 'light');
}

/* ────────────────────────────── GLASS ────────────────────────────────────
   Same treatment as the friends rail's when-chip, and the same @supports rule:
   the FLAT, HIGHER-OPACITY fill is the BASE and the blur is the enhancement,
   because backdrop-filter is the property most likely to no-op on the Median
   WebView. Declared inline so the section carries its own CSS.            */
const GLASS_CSS = `
.otw-chip { background: rgba(255,255,255,0.24); border: 1px solid rgba(255,255,255,0.30); }
@supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .otw-chip {
    background: rgba(255,255,255,0.18);
    -webkit-backdrop-filter: blur(14px) saturate(160%);
    backdrop-filter: blur(14px) saturate(160%);
  }
}
`;

/** A glass badge on the photograph. Condensed: 3/8 padding, radius 7. */
function GlassChip({
  children,
  side = 'right',
}: {
  children: React.ReactNode;
  side?: 'left' | 'right';
}) {
  return (
    <span
      className="otw-chip"
      style={{
        position: 'absolute',
        top: 8,
        [side]: 8,
        fontSize: 8,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: '#FFFFFF',
        borderRadius: 7,
        padding: '3px 8px',
      }}
    >
      {children}
    </span>
  );
}

/**
 * The three-up figure row on the UPCOMING state. Absent values are never
 * passed: the row rebalances on however many cells it is given.
 */
function ThreeUp({ cells }: { cells: Array<[string, string, string]> }) {
  if (cells.length === 0) return null;
  return (
    <div
      style={{
        marginTop: 8,
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
            textAlign: i === 0 ? 'left' : i === cells.length - 1 ? 'right' : 'center',
          }}
        >
          <div
            style={{
              ...NUMF,
              fontSize: 14,
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
          <div style={{ ...LABEL, fontSize: 6.5, color: A.DIM, marginTop: 3 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

/**
 * POSITION ROWS — place · names · score. ONE renderer for the live and the
 * completed states, so ties are handled identically on both.
 *
 * NEVER APPEND A NUMBER TO A NAME: in golf "+2" after a name reads as two over
 * par. The overflow count is rendered as its own muted token.
 */
function PositionRows({ positions }: { positions: PeekPosition[] }) {
  if (positions.length === 0) return null;
  return (
    <div style={{ marginTop: 6 }}>
      {positions.map((p) => (
        <div
          key={`${p.place}-${p.names[0] ?? ''}`}
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 7,
            padding: '2.5px 0',
            lineHeight: 1.25,
          }}
        >
          <span
            style={{
              ...LABEL,
              fontSize: 8,
              color: A.DIM,
              flexShrink: 0,
              minWidth: 17,
              fontVariantNumeric: 'tabular-nums lining-nums',
            }}
          >
            {p.tied ? `T${p.place}` : String(p.place)}
          </span>
          <span
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 11.5,
              fontWeight: 600,
              color: A.BODY,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {p.names.join(', ')}
            {p.extra > 0 && (
              <span style={{ color: A.MUTE, fontWeight: 600 }}>{`  +${p.extra}`}</span>
            )}
          </span>
          <span
            style={{
              ...NUMF,
              fontSize: 12,
              fontWeight: 700,
              flexShrink: 0,
              color: scoreColor(p.score),
            }}
          >
            {fmtScore(p.score)}
          </span>
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

  // ONE read of sr_leaderboards for the tournaments on screen that HAVE a
  // board: in play, or finished inside the result window (the completed tile
  // leads with the winner and cannot be drawn without it). Off-week, with
  // nothing live and nothing just-finished, the list is empty and the query is
  // DISABLED, so the section still costs no leaderboard read.
  const boardIds = useMemo(
    () => (events ?? []).filter((e) => e.isLive || e.isResult).map((e) => e.id),
    [events],
  );
  const peekQuery = useTourLivePeek(boardIds);
  const peeks = peekQuery.data;
  const reducedMotion = usePrefersReducedMotion();

  // WHOLE-CARD HOLD (layer 2a). The resolver feeds the card's IMAGE and the
  // peek feeds its headline figures, so a card built before either settles
  // rewrites itself in front of the reader.
  const pending =
    eventsQuery.isPending ||
    (venues.length > 0 && resolverQuery.isPending) ||
    (boardIds.length > 0 && peekQuery.isPending);

  if (pending) return <TourRailShell />;
  if (!events || events.length === 0) return null;

  const anyThisWeek = events.some((e) => e.thisWeek);

  return (
    <section>
      <style>{GLASS_CSS}</style>
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
          const board = e.isLive || e.isResult ? peeks?.get(e.id) ?? null : null;
          // Older than 10 minutes and the sync has stalled: keep the scores,
          // drop the LIVE claim for a neutral LATEST chip.
          const peekFresh = isPeekFresh(board?.updatedAt);
          const peek = e.isLive ? board : null;
          const finished = e.isResult && board != null && board.positions.length > 0;
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
                  style={{ height: PHOTO_H }}
                >
                  {/* THE FRIENDS RAIL'S SCRIM, imported not copied. Order:
                      hotspot, base, top. */}
                  <div style={{ position: 'absolute', inset: 0, background: SCRIM_HOTSPOT }} />
                  <div style={{ position: 'absolute', inset: 0, background: SCRIM_BASE }} />
                  <div style={{ position: 'absolute', inset: 0, background: SCRIM_TOP_BAND }} />
                  <GlassChip side="left">{e.tourLabel}</GlassChip>
                  {peek ? (
                    <GlassChip>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
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
                    </GlassChip>
                  ) : e.isResult ? (
                    /* NO RED DOT: play is not happening. "Final" says it. */
                    <GlassChip>{t('discover.tour.final', 'Final')}</GlassChip>
                  ) : (
                    <GlassChip>{playDays(e)}</GlassChip>
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
                    // LIVE — the lead figure keeps its prominence, then the top
                    // THREE POSITIONS beneath it.
                    const tiedCount = peek.leaderTiedExtra + 1;
                    const isTied = tiedCount > 1;
                    const thruText =
                      peek.thru == null
                        ? null
                        : peek.thru >= 18
                          ? t('discover.tour.thruF', 'F')
                          : String(peek.thru);
                    const meta = [
                      peek.round != null ? `R${peek.round}` : null,
                      thruText ? `${t('discover.tour.thru', 'Thru')} ${thruText}` : null,
                    ].filter(Boolean) as string[];

                    return (
                      <div style={{ padding: '8px 12px 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
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
                          {isTied && (
                            <span
                              style={{
                                ...LABEL,
                                fontSize: 6.5,
                                letterSpacing: '0.13em',
                                color: A.DIM,
                              }}
                            >
                              {t('discover.tour.nTied', {
                                defaultValue: '{{count}} tied',
                                count: tiedCount,
                              })}
                            </span>
                          )}
                          {meta.length > 0 && (
                            <span
                              style={{
                                ...LABEL,
                                fontSize: 6.5,
                                letterSpacing: '0.13em',
                                color: A.DIM,
                                marginLeft: 'auto',
                                flexShrink: 0,
                              }}
                            >
                              {meta.join(` ${DOT} `)}
                            </span>
                          )}
                        </div>
                        <PositionRows positions={peek.positions} />
                      </div>
                    );
                  })()
                ) : finished && board ? (
                  (() => {
                    // COMPLETED — the score belongs to the WINNER, and the
                    // margin is the second fact. Second and third use the SAME
                    // position rows as the live state.
                    const winner = board.positions[0];
                    const runnerUp = board.positions[1] ?? null;
                    const margin =
                      winner.score != null && runnerUp?.score != null
                        ? runnerUp.score - winner.score
                        : null;
                    const marginText =
                      winner.tied || margin === 0
                        ? t('discover.tour.playoff', 'Playoff')
                        : margin != null && margin > 0
                          ? t('discover.tour.wonBy', {
                              defaultValue: 'Won by {{count}}',
                              count: margin,
                            })
                          : null;
                    return (
                      <div style={{ padding: '8px 12px 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                          <span
                            style={{
                              ...NUMF,
                              fontSize: 24,
                              fontWeight: 700,
                              lineHeight: 0.92,
                              letterSpacing: '-0.035em',
                              color: scoreColor(winner.score),
                            }}
                          >
                            {fmtScore(winner.score)}
                          </span>
                          <span
                            style={{
                              flex: 1,
                              minWidth: 0,
                              fontSize: 13,
                              fontWeight: 700,
                              color: A.BODY,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {winner.names.join(', ')}
                          </span>
                          {marginText && (
                            <span
                              style={{
                                ...LABEL,
                                fontSize: 6.5,
                                letterSpacing: '0.13em',
                                color: A.DIM,
                                flexShrink: 0,
                              }}
                            >
                              {marginText}
                            </span>
                          )}
                        </div>
                        <PositionRows positions={board.positions.slice(1, 3)} />
                      </div>
                    );
                  })()
                ) : (
                  (() => {
                    // UPCOMING — no scores exist, so the DEFENDING CHAMPION is
                    // the hook: a LABEL kicker ABOVE the name (saves a line and
                    // reads in the right order), then par / yards / purse.
                    // Absent champion falls back to the round count exactly as
                    // it shipped.
                    const days = daysUntil(e.startDate);
                    const fallback = days <= 0
                      ? t('discover.tour.startsToday', 'Today')
                      : t('discover.tour.nDays', {
                          defaultValue: '{{count}} days',
                          count: days,
                        });
                    const cellsUp: Array<[string, string, string]> = [];
                    for (const [l, v] of cells) cellsUp.push([l, v, A.INK]);
                    return (
                      <div style={{ padding: '8px 12px 8px' }}>
                        <div
                          style={{
                            ...LABEL,
                            fontSize: 6.5,
                            letterSpacing: '0.13em',
                            color: A.DIM,
                          }}
                        >
                          {e.defendingChampion
                            ? t('discover.defendingChampion', 'Defending champion')
                            : t('discover.tour.startsIn', 'Starts in')}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'baseline',
                            gap: 8,
                            marginTop: 4,
                          }}
                        >
                          <span
                            style={{
                              flex: 1,
                              minWidth: 0,
                              fontSize: 15,
                              fontWeight: 700,
                              letterSpacing: '-0.02em',
                              color: A.INK,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {e.defendingChampion ?? fallback}
                          </span>
                          {e.defendingChampion && (
                            <span
                              style={{
                                ...LABEL,
                                fontSize: 6.5,
                                letterSpacing: '0.13em',
                                color: A.DIM,
                                flexShrink: 0,
                              }}
                            >
                              {playDays(e)}
                            </span>
                          )}
                        </div>
                        <ThreeUp cells={cellsUp} />
                      </div>
                    );
                  })()
                )}
              </button>

              {/* CONDENSE: the footer only takes height when it carries the
                  media chip. */}
              {!!courseId && mediaCount > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '0 12px 8px',
                  }}
                >
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
