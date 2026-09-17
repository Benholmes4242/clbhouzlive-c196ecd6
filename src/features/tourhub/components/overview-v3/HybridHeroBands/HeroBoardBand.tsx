/**
 * TYPE — THE HERO EXCEPTION (BRIEF_TOUR_OVERVIEW_TYPE_SCALE, Part 2).
 * The hero is a broadcast surface. Tracked-out caps over photography read
 * larger than their point size, so a ticker segment, a band label or a rank
 * marker takes the AXIS floor of 10 rather than the READ floor of 11 — the
 * same exception granted to the scorecard axis and the chart ticks. It covers
 * COORDINATES AND MARKERS ONLY. It does NOT cover leader names, tournament
 * names, course names, scores, or any sentence: those are language and take
 * 11. Nothing goes below 10.
 */
/**
 * HeroBoardSection — the always-on live leaderboard that EXTENDS DOWNWARD from
 * the hero.
 *
 * It is NOT inside the hero card and it never replaces the photo. The hero is a
 * horizontally swiping carousel whose cards share a definite height
 * (TOTAL_HERO_HEIGHT_TARGET); putting the board inside would have forced every
 * card taller, including upcoming tournaments that have no board and would then
 * carry ~270px of dead space. So the board renders as a section BENEATH the
 * carousel, tracking the active slide: the photo moves horizontally on swipe
 * while the board cross-fades in place.
 *
 * Order, one continuous dark surface with NO seam:
 *   photo → board rows → continuation strip (in the hero) → full-leaderboard
 *   row → stat strip → course shape panel.
 * STRAIGHT bottom edge — the page canvas breathes below it, it does not tuck
 * under a radius.
 *
 * COLLAPSE CONTROLS (BRIEF_HERO_PICKS_ROW §0a — this OVERTURNS the previous
 * rule in both halves, which read: "There is NO collapse control on the board:
 * on a live slide it is always on; on a results or upcoming slide it renders
 * nothing at all. The COURSE SHAPE panel is the only thing that opens."):
 *   - TWO panels now open — COURSE SHAPE and OUR PICKS. The original objection
 *     stands and is not violated: a vertical scroller under a horizontal pager
 *     is still forbidden, and this adds one 37px collapsed row opening to a
 *     FIXED three-row panel that never scrolls internally.
 *   - The band now renders on UPCOMING slides too, because that is the phase
 *     where the picks are most worth reading. With no board there are no rows,
 *     no full-leaderboard row, no stat strip and no course shape — and NO
 *     placeholder or reserved height for any of them (§1). §0b is NOT
 *     overturned: the band being a section rather than a card is exactly what
 *     lets it render at its own height here.
 *
 * Six rows, fixed, never internally scrollable — a vertical scroller under a
 * horizontal pager is a gesture trap. The full-leaderboard row is the route to
 * the rest. The stat strip at the foot carries the field figures that used to
 * live in the removed "On the course" section.
 */

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronDown } from 'lucide-react';

import { AMBER, FONT, GOLD, INK, WHITE_ALPHA_06, WHITE_ALPHA_08, WHITE_ALPHA_12, WHITE_ALPHA_65, TOPAR_UNDER_DARK } from '../../../_shared/tokens';
import { PAGE_CANVAS } from '@/lib/tokens/surfaces';
import { MiniBoard } from '../../../tournament-v2/sections/MiniBoard';
import { useTourSelection } from '../../../context/TourSelectionContext';
import { PlayerAvatar } from '../../PlayerAvatar';
import { ClbhouzPickMark } from '../../../_shared/ClbhouzPickMark';
import { useAIPredictions, type AITopContender } from '../../../hooks/useAIPredictions';
import { formatToPar } from '../../../overview/data/liveRoundStats';
import { useTournamentTeeTimes } from '../../../hooks/useTournamentTeeTimes';
import { useTournamentDefendingChamp } from '../../../hooks/useTournamentDefendingChamp';
import { useTournamentLastYearTop4 } from '../../../hooks/useTournamentLastYearTop4';
import { useTournamentFieldStrength } from '../../../hooks/useTournamentFieldStrength';
import { useTournamentVenueRecord } from '../../../overview/data/useTournamentVenueRecord';

/**
 * SIX rows. It was five while the board occupied the photo band, because the
 * floating ChromeIsland overlays the top ~46px of the hero and a sixth row
 * would have buried the leader. Extending downward removes that constraint —
 * no chrome clearance applies here.
 */
export const HERO_BOARD_ROWS = 5;

export function shouldShowOverviewBoard(entries: Array<{ position?: number | null; score?: number | null }>): boolean {
  const rows = entries.slice(0, HERO_BOARD_ROWS);
  if (rows.length === 0) return false;
  return rows.some((row) => row.position != null || (row.score != null && row.score !== 0));
}

const FIGS = { fontVariantNumeric: 'tabular-nums' as const, fontFeatureSettings: '"kern" 1, "liga" 1' };
const WON_LABEL = 'WON';

type SettledFigure = {
  right: string;
  rightColor: string;
  figure: string | null;
  figureColor: string;
};

/**
 * TOUR COLOUR RULE (unchanged from the removed panel): under par is RED,
 * level/over is INK — which on this dark surface is white.
 */
function tourFigColor(v: number | null | undefined): string {
  if (v == null || v === 0) return '#FFFFFF';
  return v < 0 ? TOPAR_UNDER_DARK : '#FFFFFF';
}

function settledFigureFor(
  line: { position: number | null; tied: boolean; score: number | null } | undefined,
): SettledFigure | null {
  if (!line || line.position == null) return null;

  // A TIED FIRST IS NOT A WIN - T1 stays a numeral. Unchanged rule from
  // MICRO_BRIEF_PICKS_ROW_WINNER section 2.
  const won = line.position === 1 && !line.tied;

  return {
    right: won ? WON_LABEL : `${line.tied ? 'T' : ''}${line.position}`,
    rightColor: won ? GOLD : WHITE_ALPHA_65,
    figure: line.score == null ? null : formatToPar(line.score),
    figureColor: tourFigColor(line.score),
  };
}

/**
 * Three equal thirds, not left/centre/right alignment. Figures are NOT heavy:
 * weight 600 with letter-spacing eased to -0.01em; still tabular.
 */
function StatCell({
  label,
  value,
  color,
  sub,
  align = 'left',
}: {
  label: string;
  value: string;
  color?: string;
  sub?: string | null;
  align?: 'left' | 'center' | 'right';
}) {
  return (
    <div style={{ flex: '1 1 0', minWidth: 0, textAlign: align }}>
      <div
        style={{
          fontSize: 10 /* AXIS 10 — HERO BROADCAST EXCEPTION: tracked marker/coordinate over photography (see file header) */,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: WHITE_ALPHA_65,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: '-0.01em',
          lineHeight: 1.05,
          marginTop: 2,
          color: color ?? '#FFFFFF',
          ...FIGS,
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: WHITE_ALPHA_65,
            marginTop: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

interface HeroBoardSectionProps {
  tournamentId: string;
  entries: any[];
  /**
   * Active round. NULL on an upcoming (or completed) slide, where the band
   * exists only to carry the picks row — TODAY is meaningless without it.
   */
  currentRound: number | null;
  /**
   * The lifecycle phase of the slide, read off the hero carousel's own
   * `slide.type` (§2). NO NEW QUERY: the pulse hook would be one, and the
   * carousel already knows.
   */
  phase: 'live' | 'upcoming' | 'completed';
  onFullLeaderboard: () => void;
  onRowTap?: (playerId: string) => void;
}

export function overviewTournamentDoorKey(phase: HeroBoardSectionProps['phase']): string {
  if (phase === 'completed') return 'overview.ticker.fullResults';
  if (phase === 'upcoming') return 'overview.leaderboardBand.ctaUpcoming';
  return 'overview.ticker.fullLeaderboard';
}

export function HeroBoardSection({
  tournamentId,
  entries,
  currentRound,
  phase,
  onFullLeaderboard,
  onRowTap,
}: HeroBoardSectionProps) {
  const { t } = useTranslation('tourhub');
  const navigate = useNavigate();
  const [picksOpen, setPicksOpen] = useState(false);
  const hasBoard = phase !== 'upcoming' && shouldShowOverviewBoard(entries);
  const { data: venueRecord } = useTournamentVenueRecord(tournamentId);

  const { viewingTournamentId, viewingTourSlug } = useTourSelection();
  const pickTourCode = viewingTourSlug ?? 'pga';
  const picksTid = viewingTournamentId ?? tournamentId;
  const { data: predictions } = useAIPredictions(picksTid);
  const picks = (predictions?.topContenders ?? []) as AITopContender[];
  const hasPicks = picks.length > 0;
  const pickPlayerIds = useMemo(() => {
    const ids = new Set<string>();
    for (const p of picks) if (p?.playerId) ids.add(String(p.playerId));
    return ids.size > 0 ? ids : undefined;
  }, [picks]);

  const boardByPlayer = useMemo(() => {
    const map = new Map<string, { position: number | null; tied: boolean; score: number | null }>();
    for (const entry of entries as any[]) {
      const id = entry?.player?.id;
      if (!id) continue;
      map.set(String(id), { position: entry.position ?? null, tied: Boolean(entry.position_tied), score: entry.score ?? null });
    }
    return map;
  }, [entries]);

  const closedFigure = useMemo(() => {
    if (!hasPicks) return null;
    const ranked = [...picks].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));
    if (phase === 'upcoming') {
      const names = ranked.slice(0, 3).map((pick) => surnameOf(pick.playerName)).filter(Boolean);
      return names.length > 0 ? `${names.join(', ')} to win` : null;
    }
    const placed = ranked
      .map((pick) => ({ pick, line: boardByPlayer.get(String(pick.playerId)) }))
      .filter((item) => item.line?.position != null)
      .sort((a, b) => (a.line?.position ?? 999) - (b.line?.position ?? 999));
    if (placed.length === 0) return surnameOf(ranked[0]?.playerName) || null;
    if (phase === 'completed') {
      const best = placed[0];
      const settled = settledFigureFor(best.line);
      return settled?.right === WON_LABEL
        ? `Picked ${surnameOf(best.pick.playerName)} to win · ${WON_LABEL}`
        : `${surnameOf(best.pick.playerName)} ${settled?.right ?? ''}`.trim();
    }
    return placed.slice(0, 2).map(({ pick, line }) => `${surnameOf(pick.playerName)} ${line?.tied ? 'T' : ''}${line?.position}`).join(', ');
  }, [boardByPlayer, hasPicks, phase, picks]);

  const showThreeUp = phase === 'upcoming' || !hasBoard;
  const { data: teeTimes = [] } = useTournamentTeeTimes(tournamentId, showThreeUp);
  const { data: defending } = useTournamentDefendingChamp(showThreeUp ? tournamentId : null);
  const { data: lastYear } = useTournamentLastYearTop4(showThreeUp ? tournamentId : null);
  const { data: fieldStrength } = useTournamentFieldStrength(showThreeUp ? tournamentId : null);
  const firstTeeCandidate = teeTimes[0] ?? null;
  const firstTee = firstTeeCandidate?.time && firstTeeCandidate.time !== '\u2014'
    ? firstTeeCandidate
    : null;
  const priorWinner = lastYear?.find((row) => row.rank === '1' || row.rank === 'T1') ?? null;
  const threeUp = [
    firstTee ? { label: t('overview.hero.firstTee'), value: firstTee.time, sub: 'Thu, BST', color: INK } : null,
    defending?.name ? { label: t('overview.hero.defending'), value: surnameOf(defending.name), sub: priorWinner?.score || defending.score || null, color: priorWinner?.score?.startsWith('-') ? TOPAR_UNDER_DARK : INK } : null,
    fieldStrength?.topRanked != null ? { label: t('overview.hero.field'), value: `${fieldStrength.topRanked} of top 20`, sub: t('overview.hero.worldRanked'), color: INK } : null,
  ].filter((cell): cell is { label: string; value: string; sub: string | null; color: string } => Boolean(cell));
  const hasThreeUp = threeUp.length > 0;

  return (
    <div style={{ background: PAGE_CANVAS, fontFamily: FONT }}>
      {hasBoard ? (
        <MiniBoard
          tournamentId={tournamentId}
          entries={entries}
          limit={5}
          currentRound={currentRound}
          theme="heroBoard"
          phase={phase === 'completed' ? 'completed' : 'live'}
          pickPlayerIds={pickPlayerIds}
          onRowTap={onRowTap}
        />
      ) : null}

      {hasThreeUp ? (
        <div style={{ display: 'grid', gridTemplateColumns: threeUp.length === 1 ? 'minmax(0, 1fr)' : `repeat(${threeUp.length}, minmax(0, 1fr))`, padding: '14px 24px 10px' }}>
          {threeUp.map((cell, index) => (
            <div key={cell.label} style={{ minWidth: 0, padding: threeUp.length === 1 ? 0 : '0 10px', textAlign: threeUp.length === 1 ? 'left' : 'center' }}>
              <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: WHITE_ALPHA_65 }}>{cell.label}</div>
              <div style={{ marginTop: 4, fontSize: 16, fontWeight: 700, color: cell.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cell.value}</div>
              {cell.sub ? <div style={{ marginTop: 2, fontSize: 11, color: cell.color === TOPAR_UNDER_DARK ? TOPAR_UNDER_DARK : WHITE_ALPHA_65, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cell.sub}</div> : null}
            </div>
          ))}
        </div>
      ) : null}

      {hasPicks && closedFigure ? (
        <>
          <button
            type="button"
            onClick={() => setPicksOpen((open) => !open)}
            aria-expanded={picksOpen}
            style={{ width: '100%', minHeight: 44, margin: 0, padding: '10px 24px', display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr) auto', alignItems: 'center', gap: 10, border: 'none', borderTop: `1px solid ${WHITE_ALPHA_06}`, background: 'transparent', color: INK, textAlign: 'left', cursor: 'pointer', fontFamily: FONT }}
          >
            {/* Amber here is the clbhouz mark, its documented second meaning on Tour. */}
            <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: AMBER }}>{t('overview.hero.ourPicks')}</span>
            <span style={{ minWidth: 0, fontSize: 13, color: 'rgba(248,250,252,0.85)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{closedFigure}</span>
            {picksOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          {picksOpen ? <PicksPanel picks={picks} tourCode={pickTourCode} phase={phase} boardByPlayer={boardByPlayer} predictions={predictions ?? null} /> : null}
        </>
      ) : null}

      <div
        data-overview-action-row
        style={{ width: '100%', minHeight: 56, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, borderTop: `1px solid ${WHITE_ALPHA_06}` }}
      >
        <button
          type="button"
          onClick={onFullLeaderboard}
          data-overview-board-cta
          style={{ minWidth: 0, minHeight: 44, margin: 0, padding: 0, display: 'inline-flex', alignItems: 'center', gap: 4, border: 'none', background: 'transparent', color: INK, fontFamily: FONT, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', textAlign: 'left', whiteSpace: 'nowrap' }}
        >
          {t(overviewTournamentDoorKey(phase))}
          <ChevronRight size={16} aria-hidden />
        </button>
        {venueRecord?.courseId ? (
          <button
            type="button"
            onClick={() => navigate(`/course/${venueRecord.courseId}`)}
            data-overview-course-cta
            style={{ minWidth: 0, minHeight: 44, margin: 0, padding: 0, display: 'inline-flex', alignItems: 'center', gap: 4, border: 'none', background: 'transparent', color: INK, fontFamily: FONT, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', textAlign: 'right', whiteSpace: 'nowrap' }}
          >
            {t('overview.venueRecord.viewCourse', 'View course')}
            <ChevronRight size={16} aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** Surname only — the closed row and the panel figures both read this way. */
function surnameOf(full: string | null | undefined): string {
  const s = (full ?? '').trim();
  if (!s) return '';
  const parts = s.split(/\s+/);
  return parts[parts.length - 1];
}

/**
 * §3 — THE OPEN PANEL. THREE pick rows, an optional editorial line above them,
 * a provenance line GATED ON isAIPowered, and nothing below. FIXED height
 * content: exactly three rows, never internally scrollable.
 *
 * DEPENDENCY: This panel used to carry a mandatory "See all picks" route out.
 * That row was removed per AMENDMENT 2 to BRIEF_HERO_PICKS_ROW. The full picks
 * page remains reachable through the overview picks row and panel
 * overview page (it has its own header chevron to the same destination). If
 * that carousel is ever removed, the full picks page becomes unreachable from
 * the overview entirely — re-add a route here or keep the carousel alive.
 */
function PicksPanel({
  picks,
  tourCode,
  phase,
  boardByPlayer,
  predictions,
}: {
  picks: AITopContender[];
  /** §CHANGE 2 — the event's tour, for the shared headshot resolver. */
  tourCode: string;
  phase: 'live' | 'upcoming' | 'completed';
  boardByPlayer: Map<string, { position: number | null; tied: boolean; score: number | null }>;
  predictions: { isAIPowered?: boolean; isStale?: boolean; confidence?: number; editorialFraming?: string | null } | null;
}) {
  const { t } = useTranslation('tourhub');
  const rows = picks.slice(0, 3);
  const hasConfidence = predictions?.isAIPowered;

  return (
    <div style={{ background: PAGE_CANVAS }}>
      {/* Editorial framing when populated — and NO empty row when it is not. */}
      {predictions?.editorialFraming ? (
        <div
          style={{
            padding: '10px 24px 0',
            fontSize: 11,
            fontWeight: 500,
            lineHeight: 1.35,
            color: WHITE_ALPHA_65,
          }}
        >
          {predictions.editorialFraming}
        </div>
      ) : null}

      <div
        style={{
          padding: hasConfidence ? '10px 24px 0' : '10px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {rows.map((p, i) => {
          const line = boardByPlayer.get(String(p.playerId));
          const settled = phase === 'completed' ? settledFigureFor(line) : null;
          const liveLine = phase === 'live' && line && line.position != null ? line : null;
          const figure = settled
            ? settled.figure
            : liveLine
              ? (liveLine.score == null ? null : formatToPar(liveLine.score))
              : phase === 'upcoming' && p.winProbability != null
                ? `${Math.round(p.winProbability)}%`
                : null;
          const figureColor = settled
            ? settled.figureColor
            : liveLine
              ? tourFigColor(liveLine.score)
              : '#FFFFFF';
          const pull = p.pulledQuote || p.reasons?.[0] || null;

          return (
            <div key={p.playerId || i} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span
                style={{
                  width: 12,
                  flexShrink: 0,
                  fontSize: 10 /* AXIS 10 — HERO BROADCAST EXCEPTION: tracked marker/coordinate over photography (see file header) */,
                  fontWeight: 700,
                  color: WHITE_ALPHA_65,
                  ...FIGS,
                }}
              >
                {p.rank ?? i + 1}
              </span>
              {/* §CHANGE 2 — THE SAME RESOLVER THE REST OF TOUR HUB USES.
                  AITopContender.photoUrl comes from sr_players.photo_url only,
                  which is null for most players, so this row rendered
                  silhouettes beside a carousel showing real faces for the same
                  three players. PlayerAvatar wraps getPlayerHeadshotCandidates
                  and walks the folder chain itself — no third resolver, no new
                  query. photoUrl is still passed: it is tried FIRST when present. */}
              <span style={{ flexShrink: 0, display: 'inline-flex' }}>
                <PlayerAvatar
                  playerId={String(p.playerId ?? '')}
                  playerName={p.playerName}
                  tourCode={tourCode}
                  photoUrl={p.photoUrl ?? null}
                  size="xs"
                />
              </span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#FFFFFF',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {p.playerName}
                  </span>
                  <ClbhouzPickMark size={10} label={t('overview.onTheCourse.ourPicksLabel')} />
                  {liveLine && (
                    <span style={{ fontSize: 10 /* AXIS 10 — HERO BROADCAST EXCEPTION: tracked marker/coordinate over photography (see file header) */, fontWeight: 600, color: WHITE_ALPHA_65, ...FIGS }}>
                      {`${liveLine.tied ? 'T' : ''}${liveLine.position}`}
                    </span>
                  )}
                </span>
                {pull && (
                  <span
                    style={{
                      display: 'block',
                      fontSize: 11,
                      fontWeight: 500,
                      color: WHITE_ALPHA_65,
                      marginTop: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {pull}
                  </span>
                )}
              </span>
              {(settled || figure) && (
                <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {settled && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: settled.right === WON_LABEL ? 800 : 600,
                        letterSpacing: settled.right === WON_LABEL ? '0.08em' : undefined,
                        color: settled.rightColor,
                        ...FIGS,
                      }}
                    >
                      {settled.right}
                    </span>
                  )}
                  {figure && (
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: figureColor, ...FIGS }}>
                      {figure}
                    </span>
                  )}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* PROVENANCE — here, not in the label, and only when the payload really
          is AI-powered. Staleness rides the same line. This is the panel's LAST
          element when it renders; its bottom padding closes the panel cleanly. */}
      {hasConfidence && (
        <div
          style={{
            padding: '10px 24px',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: WHITE_ALPHA_65,
          }}
        >
          {t('overview.onTheCourse.ourPicksProvenance', {
            confidence: Math.round((predictions.confidence ?? 0) * 100),
          })}
          {predictions.isStale ? ` · ${t('overview.onTheCourse.ourPicksStale')}` : ''}
        </div>
      )}
    </div>
  );
}

export default HeroBoardSection;
