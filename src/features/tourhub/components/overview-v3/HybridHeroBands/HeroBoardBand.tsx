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
 *   photo → board rows (live/completed) or upcoming facts line (upcoming) →
 *   OUR PICKS block → action row (primary tournament door + secondary course).
 * There is no stat strip and no COURSE SHAPE panel in this file or in
 * OverviewHero.tsx any more — older briefs described both; neither renders.
 * STRAIGHT bottom edge — the page canvas breathes below it, it does not tuck
 * under a radius.
 *
 * PICKS DO NOT COLLAPSE (BRIEF — THE PICKS COME OUT FROM BEHIND THE CHEVRON,
 * superseding BRIEF_HERO_PICKS_ROW §0a): the picks are the band's content and
 * render whenever picks exist, on every phase. The rule that survives: a
 * vertical scroller under a horizontal pager is a gesture trap and is
 * forbidden. The picks block is a FIXED grid of at most three cards and never
 * scrolls internally — do not turn it into a carousel or a scroller.
 *
 * The band renders on UPCOMING slides too. With no board there are no rows —
 * and NO placeholder or reserved height for them (§1).
 *
 * Board rows are fixed, never internally scrollable. The primary action is
 * the route to the rest of the board.
 */

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Trophy } from 'lucide-react';

import { AMBER, FONT, GOLD, INK, WHITE_ALPHA_06, WHITE_ALPHA_08, WHITE_ALPHA_32, WHITE_ALPHA_65, TOPAR_UNDER_DARK } from '../../../_shared/tokens';
import { PAGE_CANVAS } from '@/lib/tokens/surfaces';
import { MiniBoard } from '../../../tournament-v2/sections/MiniBoard';
import { useTourSelection } from '../../../context/TourSelectionContext';
import { PlayerAvatar } from '../../PlayerAvatar';
import { useAIPredictions, type AITopContender } from '../../../hooks/useAIPredictions';
import { formatToPar } from '../../../overview/data/liveRoundStats';
import { useTournamentTeeTimes } from '../../../hooks/useTournamentTeeTimes';
import { useTournamentDefendingChamp } from '../../../hooks/useTournamentDefendingChamp';
import { useTournamentLastYearTop4 } from '../../../hooks/useTournamentLastYearTop4';
import { useTournamentFieldStrength } from '../../../hooks/useTournamentFieldStrength';
import { useTournamentVenueRecord } from '../../../overview/data/useTournamentVenueRecord';
import { surnameOf } from '../../../_shared/playerName';
import { r } from '@/lib/radius';
import { PicksSheet } from './PicksSheet';
import type { HeroState } from '../HybridHero.utils';
import type { BoardEntry } from '../../../leaderboard/BoardTable';

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
  entries: BoardEntry[];
  /**
   * Active round. NULL on an upcoming (or completed) slide, where the band
   * exists only to carry the picks row — TODAY is meaningless without it.
   */
  currentRound: number | null;
  /**
   * The lifecycle phase of the slide, derived by `boardPhaseFor` from the ONE
   * HeroState OverviewHero computes — never from the carousel's `slide.type`,
   * so the photo and the board cannot describe the same event differently.
   */
  phase: 'live' | 'upcoming' | 'completed';
  /**
   * The champion's Sportradar id (sr_tournaments.winner_id), i.e. the same
   * champion the hero's ChampionStrip crowns. NULL on live/upcoming slides and
   * whenever the winner could not be resolved authoritatively — in which case
   * no trophy renders. Never compared by name or by position (a T1 playoff
   * loser is not the champion).
   */
  championSrId?: string | null;
  /** Team-event champions have no tournament winner_id, so members are matched by player id. */
  championPlayerIds?: string[];
  onFullLeaderboard: () => void;
  onRowTap?: (playerId: string) => void;
}

/**
 * The band's phase, read off the single HeroState. Suspended play keeps the
 * live columns (its scores are live scores); every `results` variant is
 * completed; upcoming is upcoming.
 */
export function boardPhaseFor(state: HeroState): HeroBoardSectionProps['phase'] {
  if (state.kind === 'live' || state.kind === 'suspended') return 'live';
  if (state.kind === 'results') return 'completed';
  return 'upcoming';
}

/**
 * Champion gate — the SAME rule as HybridHero's ChampionStrip: OverviewHero
 * passes `championSrId` only when `isChampionResolvable(state)` holds, and the
 * trophy is matched here by id alone. Never compared by name or by position
 * (a T1 playoff loser is not the champion).
 *
 * The champion's BOARD player id, resolved by id alone: the leaderboard row
 * whose player carries the champion's sr_id. Position is never consulted.
 */
export function resolveChampionPlayerId(
  entries: Array<{ player?: { id?: string | null; sr_id?: string | null } | null }>,
  championSrId: string | null | undefined,
  phase: HeroBoardSectionProps['phase'],
): string | null {
  if (phase !== 'completed' || !championSrId) return null;
  for (const entry of entries) {
    const player = entry?.player;
    if (player?.sr_id && String(player.sr_id) === String(championSrId) && player.id) {
      return String(player.id);
    }
  }
  return null;
}

/** A pick earns the trophy only when the pick IS the champion, by player id. */
export function pickWonTournament(
  pickPlayerId: string | null | undefined,
  championPlayerId: string | null,
  championPlayerIds: string[] = [],
): boolean {
  if (!pickPlayerId) return false;
  if (championPlayerId && String(pickPlayerId) === championPlayerId) return true;
  return championPlayerIds.some((id) => String(pickPlayerId) === String(id));
}

export function overviewTournamentDoorKey(phase: HeroBoardSectionProps['phase']): string {
  if (phase === 'completed') return 'overview.ticker.fullResults';
  if (phase === 'upcoming') return 'overview.leaderboardBand.ctaUpcoming';
  return 'overview.ticker.fullLeaderboard';
}

export function shouldLoadUpcomingFacts(phase: HeroBoardSectionProps['phase']): boolean {
  return phase === 'upcoming';
}

export interface UpcomingHeroFact {
  label: string;
  value: string;
  trailing: string | null;
  trailingColor: string;
}

export function compactUpcomingFacts(facts: Array<UpcomingHeroFact | null>): UpcomingHeroFact[] {
  return facts.filter((fact): fact is UpcomingHeroFact => fact !== null);
}

export function HeroBoardSection({
  tournamentId,
  entries,
  currentRound,
  phase,
  championSrId,
  championPlayerIds = [],
  onFullLeaderboard,
  onRowTap,
}: HeroBoardSectionProps) {
  const { t } = useTranslation('tourhub');
  const navigate = useNavigate();
  const hasBoard = phase !== 'upcoming' && shouldShowOverviewBoard(entries);
  const { data: venueRecord } = useTournamentVenueRecord(tournamentId);

  const { viewingTournamentId, viewingTourSlug } = useTourSelection();
  const pickTourCode = viewingTourSlug ?? 'pga';
  const picksTid = viewingTournamentId ?? tournamentId;
  const { data: predictions } = useAIPredictions(picksTid);
  const picks = (predictions?.topContenders ?? []) as AITopContender[];
  const hasPicks = picks.length > 0;
  const [picksOpen, setPicksOpen] = useState(false);
  const pickPlayerIds = useMemo(() => {
    const ids = new Set<string>();
    for (const p of picks) if (p?.playerId) ids.add(String(p.playerId));
    return ids.size > 0 ? ids : undefined;
  }, [picks]);

  const boardByPlayer = useMemo(() => {
    const map = new Map<string, { position: number | null; tied: boolean; score: number | null }>();
    for (const entry of entries) {
      const line = { position: entry.position ?? null, tied: Boolean(entry.position_tied), score: entry.score ?? null };
      const id = entry?.player?.id;
      if (id) {
        map.set(String(id), line);
        continue;
      }
      for (const member of entry?.team?.members ?? []) {
        const memberId = member?.player?.id;
        if (memberId) map.set(String(memberId), line);
      }
    }
    return map;
  }, [entries]);

  const championPlayerId = useMemo(
    () => resolveChampionPlayerId(entries, championSrId, phase),
    [championSrId, entries, phase],
  );

  const showUpcomingFacts = shouldLoadUpcomingFacts(phase);
  const { data: teeTimes = [] } = useTournamentTeeTimes(tournamentId, showUpcomingFacts);
  const { data: defending } = useTournamentDefendingChamp(showUpcomingFacts ? tournamentId : null);
  const { data: lastYear } = useTournamentLastYearTop4(showUpcomingFacts ? tournamentId : null);
  const { data: fieldStrength } = useTournamentFieldStrength(showUpcomingFacts ? tournamentId : null);
  const firstTeeCandidate = teeTimes[0] ?? null;
  const firstTee = firstTeeCandidate?.time && firstTeeCandidate.time !== '\u2014'
    ? firstTeeCandidate
    : null;
  const priorWinner = lastYear?.find((row) => row.rank === '1' || row.rank === 'T1') ?? null;
  const priorScore = priorWinner?.score || defending?.score || null;
  const upcomingFacts = compactUpcomingFacts([
    firstTee ? { label: t('overview.hero.firstTee'), value: firstTee.time, trailing: null, trailingColor: INK } : null,
    defending?.name ? { label: t('overview.hero.defending'), value: surnameOf(defending.name), trailing: priorScore, trailingColor: priorScore && /^[-−]/.test(priorScore) ? TOPAR_UNDER_DARK : INK } : null,
    fieldStrength?.topRanked != null ? { label: t('overview.hero.field'), value: `${fieldStrength.topRanked} of top 20`, trailing: null, trailingColor: INK } : null,
  ]);
  const hasUpcomingFacts = showUpcomingFacts && upcomingFacts.length > 0;

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

      {hasUpcomingFacts ? (
        <div data-overview-facts style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '4px 6px', padding: '13px 20px', lineHeight: 1.3 }}>
          {upcomingFacts.map((fact, index) => (
            <span key={fact.label} style={{ display: 'inline-flex', alignItems: 'baseline', gap: 5, whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: WHITE_ALPHA_65 }}>{fact.label}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: INK }}>{fact.value}</span>
              {fact.trailing ? <span style={{ fontSize: 14, fontWeight: 700, color: fact.trailingColor }}>{fact.trailing}</span> : null}
              {index < upcomingFacts.length - 1 ? <span aria-hidden style={{ marginLeft: 1, color: WHITE_ALPHA_65 }}>·</span> : null}
            </span>
          ))}
        </div>
      ) : null}

      {hasPicks ? (
        <PicksBlock
          picks={picks}
          tourCode={pickTourCode}
          phase={phase}
          boardByPlayer={boardByPlayer}
          championPlayerId={championPlayerId}
          championPlayerIds={championPlayerIds}
          onOpenPick={() => setPicksOpen(true)}
        />
      ) : null}
      {hasPicks ? (
        <PicksSheet
          open={picksOpen}
          onClose={() => setPicksOpen(false)}
          picks={picks}
          predictions={predictions ?? null}
          eventName={predictions?.tournament?.name ?? ''}
          venueName={predictions?.tournament?.venueName || null}
        />
      ) : null}

      <div
        data-overview-action-row
        style={{ padding: '12px 20px 18px', display: 'flex', alignItems: 'stretch', gap: 8, borderTop: `1px solid ${WHITE_ALPHA_06}` }}
      >
        <button
          type="button"
          onClick={onFullLeaderboard}
          data-overview-board-cta
          style={{ flex: '1.8 1 0', minWidth: 0, minHeight: 48, margin: 0, padding: '0 12px', borderRadius: r.md, background: WHITE_ALPHA_08, border: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: INK, fontFamily: FONT, fontSize: 13.5, fontWeight: 700, letterSpacing: '-0.01em', cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          {t(overviewTournamentDoorKey(phase))}
          <ChevronRight size={16} aria-hidden />
        </button>
        {venueRecord?.courseId ? (
          <button
            type="button"
            onClick={() => navigate(`/courses/${venueRecord.courseId}`)}
            data-overview-course-cta
            style={{ flex: '1 1 0', minWidth: 0, minHeight: 48, margin: 0, padding: '0 12px', borderRadius: r.md, background: 'transparent', border: `1px solid ${WHITE_ALPHA_08}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: WHITE_ALPHA_65, fontFamily: FONT, fontSize: 13.5, fontWeight: 700, letterSpacing: '-0.01em', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            {t('overview.venueRecord.course')}
            <ChevronRight size={16} aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  );
}

/**
 * §3 — THE PICKS BLOCK. Amber OUR PICKS header, optional event-level editorial
 * line, a FIXED grid of up to three cards (never padded, never scrolling) and
 * a provenance line GATED ON isAIPowered. Each card opens PicksSheet.
 */
function PicksBlock({
  picks,
  tourCode,
  phase,
  boardByPlayer,
  championPlayerId,
  championPlayerIds,
  onOpenPick,
}: {
  onOpenPick: () => void;
  picks: AITopContender[];
  /** The event's tour, for the shared headshot resolver. */
  tourCode: string;
  phase: 'live' | 'upcoming' | 'completed';
  boardByPlayer: Map<string, { position: number | null; tied: boolean; score: number | null }>;
  /** The champion, by player id — settledFigureFor can only see a POSITION,
   *  and a playoff winner's position is T1, so identity comes in separately. */
  championPlayerId: string | null;
  championPlayerIds: string[];
}) {
  const { t } = useTranslation('tourhub');
  const cards = picks.slice(0, 3);

  return (
    <div data-overview-picks style={{ background: PAGE_CANVAS }}>
      <div style={{ padding: '14px 20px 9px', display: 'flex', alignItems: 'center', gap: 8, borderTop: `1px solid ${WHITE_ALPHA_06}` }}>
        {/* Amber here is the clbhouz mark, its documented second meaning on Tour. */}
        {/* PicksSheet's eyebrow reads this same key on purpose: one label, one
            key, so band and sheet cannot drift apart in translation. */}
        <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: AMBER }}>{t('overview.hero.ourPicks')}</span>
      </div>

      <div style={{ padding: '0 16px 14px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {cards.map((p, i) => {
          const line = boardByPlayer.get(String(p.playerId));
          const settledRaw = phase === 'completed' ? settledFigureFor(line) : null;
          /* THE CHAMPION WEARS THE WIN, WHATEVER THE BOARD SAYS. A playoff
             winner ties on strokes, so settledFigureFor returns "T1" — right
             for everyone else, the playoff LOSER included. Identity separates
             them, via the same test the trophy uses. */
          const isChampion = phase === 'completed'
            && pickWonTournament(p.playerId, championPlayerId, championPlayerIds);
          const settled = settledRaw && isChampion
            ? { ...settledRaw, right: WON_LABEL, rightColor: GOLD }
            : settledRaw;
          const liveLine = phase === 'live' && line && line.position != null ? line : null;

          let figureLine: React.ReactNode;
          if (liveLine) {
            figureLine = (
              <>
                <span style={{ color: WHITE_ALPHA_65 }}>{`${liveLine.tied ? 'T' : ''}${liveLine.position}`}</span>
                {liveLine.score != null ? <span style={{ color: tourFigColor(liveLine.score) }}>{formatToPar(liveLine.score)}</span> : null}
              </>
            );
          } else if (settled) {
            figureLine = (
              <>
                {settled.right === WON_LABEL ? <Trophy data-pick-trophy size={11} color={GOLD} strokeWidth={2.5} aria-hidden /> : null}
                <span style={{ color: settled.rightColor }}>{settled.right}</span>
                {settled.figure ? <span style={{ color: settled.figureColor }}>{settled.figure}</span> : null}
              </>
            );
          } else {
            // Absent figure renders NOTHING (same rule as MiniBoard): no dash,
            // and no win % on upcoming picks — an unlabelled number is not data.
            figureLine = null;
          }

          return (
            <button
              type="button"
              key={p.playerId || i}
              data-overview-pick-card
              onClick={onOpenPick}
              aria-label={t('overview.picksSheet.cardAria', { name: p.playerName, defaultValue: `Why we picked ${p.playerName}` })}
              className="active:opacity-70 transition-opacity"
              style={{ position: 'relative', margin: 0, fontFamily: FONT, color: 'inherit', cursor: 'pointer', background: WHITE_ALPHA_06, border: `1px solid ${WHITE_ALPHA_06}`, borderRadius: r.sm, padding: '11px 10px', textAlign: 'center', minWidth: 0 }}
            >
              <ChevronRight size={12} strokeWidth={2.6} color={WHITE_ALPHA_32} aria-hidden style={{ position: 'absolute', top: 7, right: 7 }} />
              {/* The shared resolver walks the headshot folder chain itself;
                  photoUrl is tried FIRST when present. No second resolver. */}
              <div style={{ display: 'flex', justifyContent: 'center', margin: '0 auto 8px' }}>
                <PlayerAvatar
                  playerId={String(p.playerId ?? '')}
                  playerName={p.playerName}
                  tourCode={tourCode}
                  photoUrl={p.photoUrl ?? null}
                  size="sm"
                />
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {surnameOf(p.playerName)}
              </div>
              {figureLine ? (
                <div style={{ marginTop: 5, fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4, ...FIGS }}>
                  {figureLine}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>

    </div>
  );
}

export default HeroBoardSection;
