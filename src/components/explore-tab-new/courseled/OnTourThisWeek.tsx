import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { supabase } from '@/integrations/supabase/client';
import { useCourseImageResolver } from '@/features/tourhub/hooks/useCourseImageResolver';
import { formatCurrencyUsdCompact, formatNumber } from '@/i18n/format';
import { CourseImageFallback } from './CourseImageFallback';
import { useTourThisWeek, type TourWeekEvent } from './hooks/useTourThisWeek';
import {
  isPeekFresh,
  useTourLivePeek,
  type LivePeek,
  type PeekPosition,
} from './hooks/useTourLivePeek';
import { TourRail as TourRailShell } from './DiscoverCourseLedSkeleton';
import { fmtScore } from '@/features/tourhub/utils/fmtScore';
import { getScoreColor } from '@/features/tourhub/_shared/scoreColor';
import {
  TOPAR_UNDER_DARK,
  TOPAR_OVER_DARK,
  TOPAR_EVEN_DARK,
} from '@/features/tourhub/_shared/tokens';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { SCRIM_STANDOUT } from '@/styles/photoScrim';
import { CARD_SHELL, Eyebrow, InkAction, LABEL, NUMF, SANS } from './tokens';

/**
 * Section 3 — ON TOUR THIS WEEK.
 *
 * BRIEF_ON_TOUR_GLASS_TILE_AND_TICKER: the tile is now ONE PHOTOGRAPH EDGE TO
 * EDGE with the leaderboard in a DARK GLASS PANEL inset from the left, right
 * and bottom, so the image reads all the way round it. The white body block is
 * gone, and the ~170px height budget of BRIEF_ON_TOUR_TILE_ENRICHMENT is
 * SUPERSEDED — the tile is TILE_H (226) tall and the skeleton's TourRail moves
 * with it.
 *
 * THREE STATES, ONE ROW RENDERER, NO NEW QUERY. The single read of
 * sr_leaderboards at useTourLivePeek yields the TOP THREE POSITIONS as well as
 * the four figures it always yielded.
 *
 * POSITIONS, NOT PLAYERS: five tied for the lead is ONE position, and places
 * skip by tie size (a six-way T2 is followed by EIGHTH). The ticker does not
 * touch that derivation, and it does NOT add a fourth position row — it only
 * reveals every NAME a position holds.
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

/** FULL-BLEED TILE. Supersedes the ~170px budget; the skeleton matches it. */
const TILE_H = 210;
const TILE_W = 266;

/* ──────────────────────────── PANEL COLOURS ───────────────────────────────
   NO FADED COLOUR: every figure and label on the glass is a SOLID value, not
   a colour derived by reducing another colour's opacity. The scrim and the
   glass are the only translucent things on the tile.                       */
const PANEL_INK = '#FFFFFF';
const PANEL_BODY = '#F2F5F8';
const PANEL_LABEL = '#CFD6DD';
const PANEL_MUTE = '#AAB3BB';

/**
 * THE UNDER-PAR RED ON GLASS. #D2222D (and the dark-surface #DC2626) are
 * unreadable over a photograph, so the documented exception is a LIGHTER RED
 * held as a NAMED CONSTANT with the reason attached.
 */
const GLASS_UNDER_RED = '#FF5D5D';

/**
 * Canonical tour convention: under par is RED, over par ink, level neutral.
 * ROUTED THROUGH the existing helper rather than around it — getScoreColor
 * still decides the SEMANTICS on the dark surface, and this map only swaps the
 * three dark-surface tokens for their solid, photograph-legible equivalents.
 */
const GLASS_SCORE: Record<string, string> = {
  [TOPAR_UNDER_DARK]: GLASS_UNDER_RED,
  [TOPAR_OVER_DARK]: PANEL_BODY,
  [TOPAR_EVEN_DARK]: PANEL_LABEL,
};
function scoreColorOnGlass(score: number | null | undefined): string {
  return GLASS_SCORE[getScoreColor(score, 'dark')] ?? PANEL_INK;
}

/* ────────────────────────────── GLASS ────────────────────────────────────
   The panel and chip glass live in liquid-glass.css (.otw-panel, and the
   shared .standout-figure-chip family) because @supports CANNOT be expressed
   in a style object — anyone building this with inline styles ships the
   blur-only version, which looks broken on the exact devices Ben's members
   use. Declared here only for the chips this section owns.                 */
const GLASS_CSS = `
.otw-chip { background: rgba(24,30,26,0.62); border: 1px solid rgba(255,255,255,0.28); }
@supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .otw-chip {
    background: rgba(24,30,26,0.40);
    -webkit-backdrop-filter: blur(16px) saturate(180%);
    backdrop-filter: blur(16px) saturate(180%);
  }
}

`;

/** A glass badge on the photograph. Condensed: 3/8 padding, radius 7. */
function GlassChip({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className="otw-chip"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: 8.5,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: '#FFFFFF',
        borderRadius: 7,
        padding: '3px 8px',
        flexShrink: 0,
        ...style,
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
function ThreeUp({ cells }: { cells: Array<[string, string]> }) {
  if (cells.length === 0) return null;
  return (
    <div
      style={{
        marginTop: 7,
        display: 'grid',
        gridTemplateColumns: `repeat(${cells.length}, 1fr)`,
        gap: 4,
      }}
    >
      {cells.map(([label, value], i) => (
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
              color: PANEL_INK,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {value}
          </div>
          <div style={{ ...LABEL, fontSize: 8.5, color: PANEL_LABEL, marginTop: 2 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

/* ───────────────────────────── THE TICKER ─────────────────────────────────
   TARGET SPEED, and the duration is DERIVED from the LONGEST overflowing row
   in the tile — fix the duration instead and the longest row moves FASTEST,
   which is exactly backwards. Derived from the longest, nothing on the tile
   ever exceeds the target speed and shorter rows simply move slower; every
   row starts and finishes together either way.                            */
const TICKER_SPEED_PX_PER_S = 26;
/** The clear gap between the end of one pass and the start of the next, so
 *  the first name is identifiable AS the first. */
const TICKER_GAP = 36;
const TICKER_MIN_S = 7;

/**
 * POSITION ROWS — place · names · score. ONE renderer for the live, completed
 * and next-up states, so ties are handled identically on all three.
 *
 * NEVER APPEND A NUMBER TO A NAME: in golf "+2" after a name reads as two over
 * par. The overflow count is rendered as its own token, and it SCROLLS LAST.
 *
 * ONLY OVERFLOWING ROWS SCROLL — a single-name leader drifting sideways for no
 * reason looks broken. THE PLACE AND THE SCORE NEVER MOVE: a moving number is
 * an unreadable number.
 */
function PositionRows({ positions, paused }: { positions: PeekPosition[]; paused: boolean }) {
  const reducedMotion = usePrefersReducedMotion();
  const cellRefs = useRef<Array<HTMLDivElement | null>>([]);
  const textRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const [overflowing, setOverflowing] = useState<boolean[]>([]);
  const [durationS, setDurationS] = useState(0);

  const signature = positions.map((p) => `${p.place}:${p.names.join('|')}:${p.extra}`).join('/');

  useLayoutEffect(() => {
    if (reducedMotion) {
      setOverflowing([]);
      setDurationS(0);
      return;
    }
    const flags: boolean[] = [];
    let widest = 0;
    positions.forEach((_, i) => {
      const cell = cellRefs.current[i];
      const text = textRefs.current[i];
      if (!cell || !text) {
        flags[i] = false;
        return;
      }
      const contentW = text.scrollWidth;
      const over = contentW > cell.clientWidth + 1;
      flags[i] = over;
      if (over) widest = Math.max(widest, contentW);
    });
    setOverflowing(flags);
    setDurationS(
      widest > 0 ? Math.max(TICKER_MIN_S, (widest + TICKER_GAP) / TICKER_SPEED_PX_PER_S) : 0,
    );
    // Re-measured whenever the positions themselves change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, reducedMotion]);

  if (positions.length === 0) return null;

  return (
    <div style={{ marginTop: 6 }}>
      {positions.map((p, i) => {
        const scroll = !reducedMotion && overflowing[i] === true && durationS > 0;
        const content = (
          <>
            {p.names.join(', ')}
            {p.extra > 0 && (
              <span style={{ color: PANEL_MUTE, fontWeight: 600 }}>{`  +${p.extra}`}</span>
            )}
          </>
        );
        const textStyle: React.CSSProperties = {
          fontSize: 11.5,
          fontWeight: 600,
          color: PANEL_BODY,
          whiteSpace: 'nowrap',
        };
        return (
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
                fontSize: 8.5,
                color: PANEL_LABEL,
                flexShrink: 0,
                minWidth: 18,
                fontVariantNumeric: 'tabular-nums lining-nums',
              }}
            >
              {p.tied ? `T${p.place}` : String(p.place)}
            </span>
            <div
              ref={(el) => {
                cellRefs.current[i] = el;
              }}
              className={scroll ? 'otw-namecell' : undefined}
              style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}
            >
              {scroll ? (
                <div
                  className="otw-ticker-track"
                  style={{
                    animationDuration: `${durationS}s`,
                    animationPlayState: paused ? 'paused' : 'running',
                  }}
                >
                  <span
                    ref={(el) => {
                      textRefs.current[i] = el;
                    }}
                    style={{ ...textStyle, paddingRight: TICKER_GAP }}
                  >
                    {content}
                  </span>
                  <span aria-hidden style={{ ...textStyle, paddingRight: TICKER_GAP }}>
                    {content}
                  </span>
                </div>
              ) : (
                <span
                  ref={(el) => {
                    textRefs.current[i] = el;
                  }}
                  style={{
                    ...textStyle,
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {content}
                </span>
              )}
            </div>
            <span
              style={{
                ...NUMF,
                fontSize: 12,
                fontWeight: 700,
                flexShrink: 0,
                color: scoreColorOnGlass(p.score),
              }}
            >
              {fmtScore(p.score)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Whole days from today to the tee-off date; 0 or less reads "Today". */
function daysUntil(startDate: string): number {
  const start = new Date(`${startDate}T12:00:00`).getTime();
  return Math.ceil((start - Date.now()) / 86_400_000);
}

/**
 * ONE TILE. Owns the two things that pause its tickers:
 *   PRESS      — pointer down pauses, up/cancel/leave resumes.
 *   VISIBILITY — a tile scrolled out of the rail is PAUSED, not merely clipped.
 *
 * NO THIRD CONCURRENCY CEILING: this is not a decode or a playback cost, it is
 * a compositor transform on at most three text spans per VISIBLE tile, and the
 * rail shows two at a time. MAX_PLAYING and MAX_CONCURRENT_LOADS stay the one
 * mirrored ceiling; visibility alone is the gate here.
 */
function TourTile({
  e,
  courseId,
  courseName,
  imageUrl,
  mediaCount,
  peek,
  peekFresh,
  finished,
  board,
  cells,
  onTournamentPress,
  onMediaPress,
}: {
  e: TourWeekEvent;
  courseId: string | null;
  courseName: string;
  imageUrl: string | null;
  mediaCount: number;
  peek: LivePeek | null;
  peekFresh: boolean;
  finished: boolean;
  board: LivePeek | null;
  cells: Array<[string, string]>;
  onTournamentPress: (e: TourWeekEvent) => void;
  onMediaPress: (courseId: string) => void;
}) {
  const { t } = useTranslation('courses');
  const reducedMotion = usePrefersReducedMotion();
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [pressed, setPressed] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = cardRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) setVisible(entry.isIntersecting);
      },
      { threshold: 0.01 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const paused = pressed || !visible;

  const panel = (() => {
    if (peek && peek.leaderScore != null) {
      // LIVE — the lead figure keeps its prominence, then the top THREE
      // POSITIONS beneath it.
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
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span
              style={{
                ...NUMF,
                fontSize: 25,
                fontWeight: 700,
                lineHeight: 0.92,
                letterSpacing: '-0.035em',
                color: scoreColorOnGlass(peek.leaderScore),
              }}
            >
              {fmtScore(peek.leaderScore)}
            </span>
            {isTied && (
              <span style={{ ...LABEL, fontSize: 8.5, letterSpacing: '0.11em', color: PANEL_LABEL }}>
                {t('discover.tour.nTied', { defaultValue: '{{count}} tied', count: tiedCount })}
              </span>
            )}
            {meta.length > 0 && (
              <span
                style={{
                  ...LABEL,
                  fontSize: 8.5,
                  letterSpacing: '0.11em',
                  color: PANEL_LABEL,
                  marginLeft: 'auto',
                  flexShrink: 0,
                }}
              >
                {meta.join(` ${DOT} `)}
              </span>
            )}
          </div>
          <PositionRows positions={peek.positions} paused={paused} />
        </>
      );
    }

    if (finished && board) {
      // COMPLETED — the score belongs to the WINNER, and the margin is the
      // second fact. Second and third use the SAME position rows.
      const winner: PeekPosition = board.positions[0];
      const runnerUp: PeekPosition | null = board.positions[1] ?? null;
      const margin =
        winner.score != null && runnerUp?.score != null ? runnerUp.score - winner.score : null;
      const marginText =
        winner.tied || margin === 0
          ? t('discover.tour.playoff', 'Playoff')
          : margin != null && margin > 0
            ? t('discover.tour.wonBy', { defaultValue: 'Won by {{count}}', count: margin })
            : null;
      return (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span
              style={{
                ...NUMF,
                fontSize: 24,
                fontWeight: 700,
                lineHeight: 0.92,
                letterSpacing: '-0.035em',
                color: scoreColorOnGlass(winner.score),
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
                color: PANEL_INK,
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
                  fontSize: 8.5,
                  letterSpacing: '0.11em',
                  color: PANEL_LABEL,
                  flexShrink: 0,
                }}
              >
                {marginText}
              </span>
            )}
          </div>
          <PositionRows positions={board.positions.slice(1, 3)} paused={paused} />
        </>
      );
    }

    // UPCOMING — no scores exist, so the DEFENDING CHAMPION is the hook: a
    // LABEL kicker ABOVE the name, then par / yards / purse.
    const days = daysUntil(e.startDate);
    const fallback =
      days <= 0
        ? t('discover.tour.startsToday', 'Today')
        : t('discover.tour.nDays', { defaultValue: '{{count}} days', count: days });
    return (
      <>
        <div style={{ ...LABEL, fontSize: 8.5, letterSpacing: '0.11em', color: PANEL_LABEL }}>
          {e.defendingChampion
            ? t('discover.defendingChampion', 'Defending champion')
            : t('discover.tour.startsIn', 'Starts in')}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 3 }}>
          <span
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: PANEL_INK,
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
                fontSize: 8.5,
                letterSpacing: '0.11em',
                color: PANEL_LABEL,
                flexShrink: 0,
              }}
            >
              {playDays(e)}
            </span>
          )}
        </div>
        <ThreeUp cells={cells} />
      </>
    );
  })();

  return (
    <div
      ref={cardRef}
      style={{
        ...CARD_SHELL,
        // No border and no new-since ink ring on tour cards.
        border: 'none',
        boxShadow: 'none',
        position: 'relative',
        width: TILE_W,
        height: TILE_H,
        flexShrink: 0,
        fontFamily: SANS,
      }}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
    >
      {/* THE PHOTOGRAPH TAKES THE WHOLE TILE. */}
      <CourseImageFallback
        courseId={courseId ?? e.id}
        courseName={courseName}
        imageUrl={imageUrl}
        initialsSize={30}
        style={{ position: 'absolute', inset: 0 }}
      >
        {/* ONE layer — the canonical SCRIM_STANDOUT, imported not rewritten.
            It carries the legibility under the panel; darkening the glass would
            stop it being glass. */}
        <div style={{ position: 'absolute', inset: 0, background: SCRIM_STANDOUT }} />
      </CourseImageFallback>

      {/* THE WHOLE TILE TAPS THROUGH TO THE TOURNAMENT, exactly as before. */}
      <button
        type="button"
        onClick={() => onTournamentPress(e)}
        aria-label={`${e.name} ${DOT} ${courseName}`}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
          padding: 0,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: 8,
          pointerEvents: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
          <GlassChip>{e.tourLabel}</GlassChip>
          <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 6 }}>
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
                  {peekFresh ? t('discover.live', 'Live') : t('discover.latest', 'Latest')}
                </span>
              </GlassChip>
            ) : e.isResult ? (
              /* NO RED DOT: play is not happening. "Final" says it. */
              <GlassChip>{t('discover.tour.final', 'Final')}</GlassChip>
            ) : (
              <GlassChip>{playDays(e)}</GlassChip>
            )}
          </span>
        </div>

        {/* VENUE, then EVENT, over the photograph and below the chips. */}
        <div style={{ marginTop: 8, paddingLeft: 2, paddingRight: 2 }}>
          <div
            style={{
              fontSize: 14.5,
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {courseName}
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: PANEL_LABEL,
              marginTop: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {e.name}
          </div>
        </div>

        {/* THE DARK GLASS PANEL, inset from left, right and bottom so the image
            reads all the way round it. */}
        <div
          className="otw-panel"
          style={{
            marginTop: 'auto',
            borderRadius: 11,
            padding: '8px 10px 9px',
          }}
        >
          {panel}
        </div>
      </div>

      {/* The media chip stays a SEPARATE tap, and an unresolved venue still
          carries none. */}
      {!!courseId && mediaCount > 0 && (
        <button
          type="button"
          className="otw-chip"
          onClick={() => onMediaPress(courseId)}
          style={{
            position: 'absolute',
            zIndex: 3,
            top: 36,
            right: 8,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 8.5,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#FFFFFF',
            borderRadius: 999,
            padding: '4px 8px',
            fontFamily: SANS,
            cursor: 'pointer',
          }}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.2"
            aria-hidden
          >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="9" cy="11" r="2" />
            <path d="m21 15-4-4-6 6" />
          </svg>
          {t('discover.nPhotos', { defaultValue: '{{count}} photos', count: mediaCount })}
        </button>
      )}
    </div>
  );
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

      <div className="scrollbar-hide" style={{ display: 'flex', gap: 10, overflowX: 'auto' }}>
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
            <TourTile
              key={e.id}
              e={e}
              courseId={courseId}
              courseName={match?.name ?? e.venueName}
              imageUrl={match?.imageUrl ?? null}
              mediaCount={mediaCount}
              peek={peek}
              peekFresh={peekFresh}
              finished={finished}
              board={board}
              cells={cells}
              onTournamentPress={onTournamentPress}
              onMediaPress={onMediaPress}
            />
          );
        })}
      </div>
    </section>
  );
}

export default OnTourThisWeek;
