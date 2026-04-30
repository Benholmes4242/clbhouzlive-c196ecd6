/**
 * IntelligenceHero — Tour Hub focal point
 *
 * Deep-purple magazine card establishing clbhouz Intelligence as the AI brand
 * on the Tour Hub. Auto-detects tournament lifecycle (live / results / upcoming)
 * via `useIntelligenceLifecycleState` (mirrors HeroCarousel's 1.5-day window).
 *
 * Phase A: persistent shell (Masthead + TrackRecord + CTA).
 * Phase B: full content blocks for each lifecycle state.
 *   - Live    → performance band + 3 picks with live position + reasoning
 *   - Results → "WE CALLED IT" recap when Top Pick wins, else final standings
 *   - Upcoming → venue card with par/yardage bullets + 3 picks with chevron-expand reasoning
 * Phase C: wires the CTA to open IntelligenceAllPicksSheet.
 * v2 Polish: date-range state labels, About sheet, chevron-expand pick rows,
 *            location line on venue card, FIT badge removed, brand casing.
 *
 * Editorial copy reads from INTELLIGENCE_HERO_FALLBACK (V1 hardcoded). V1.2 will
 * move per-tournament copy to a Claude-driven daily pipeline.
 */

import { memo, useMemo, useState } from 'react';
import { Brain, ChevronRight, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { useCountdown } from '@/hooks/useCountdown';
import {
  useIntelligenceLifecycleState,
  type IntelligenceLifecycleState,
} from '../hooks/useIntelligenceLifecycleState';
import { useIntelligenceHistoricalPicks } from '../hooks/useIntelligenceHistoricalPicks';
import { usePredictionTracker } from '../hooks/usePredictionTracker';
import type { AIPredictionData, AITopContender } from '../hooks/useAIPredictions';
import type { TrackedPrediction, PredictionTrackerData } from './tournament-insights/types';
import { PlayerAvatar } from './PlayerAvatar';
import {
  INTELLIGENCE_HERO_FALLBACK,
  buildUpcomingHeadline,
  getVenueRequirements,
} from '../utils/editorialFallbacks';
import { IntelligenceAllPicksSheet } from './IntelligenceAllPicksSheet';
import { IntelligenceAboutSheet } from './IntelligenceAboutSheet';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTHS_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const GREEN_DEEP = '#073D2A';
const GREEN_MID = '#0A5238';
const GREEN_DARK = '#042418';
const GREEN_ACCENT = '#2DBB78';
const AMBER_ACCENT = '#F7931E';

function formatPosition(p: TrackedPrediction): string {
  if (p.performanceStatus === 'cut') return 'MC';
  if (p.performanceStatus === 'withdrawn') return 'WD';
  if (p.actualPosition === null) return '—';
  return `${p.actualPositionTied ? 'T' : ''}${p.actualPosition}`;
}

function formatScore(score: number | null): string {
  if (score === null || score === undefined) return 'E';
  if (score === 0) return 'E';
  return score > 0 ? `+${score}` : `${score}`;
}

/** Reasoning playing-out heuristic per Phase B brief: actualPos ≤ predictedRank × 5. */
function isReasoningPlayingOut(p: TrackedPrediction): boolean {
  if (p.actualPosition === null) return false;
  if (p.performanceStatus === 'cut' || p.performanceStatus === 'withdrawn') return false;
  return p.actualPosition <= p.predictedRank * 5;
}

/** Date range for masthead state label. Always includes month on both sides for clarity. */
function formatDateRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  return `${start.getDate()} ${MONTHS_ABBR[start.getMonth()]} – ${end.getDate()} ${MONTHS_ABBR[end.getMonth()]}`;
}

/**
 * Location line for venue card. Three formats:
 *   - US:                          "Doral, Florida · USA"
 *   - International with region:   "Hamilton, Ontario · Canada"
 *   - International without region: "Wentworth · United Kingdom"
 */
function formatLocation(t: AIPredictionData['tournament']): string {
  const left: string[] = [];
  if (t.venueCity) left.push(t.venueCity);
  if (t.venueState) left.push(t.venueState);
  const leftStr = left.join(', ');
  if (t.venueCountry) {
    return leftStr ? `${leftStr} · ${t.venueCountry}` : t.venueCountry;
  }
  return leftStr;
}

function getVenueBullets(t: AIPredictionData['tournament']): string[] {
  const bullets: string[] = [];
  if (t.par && t.yardage) {
    bullets.push(`Par ${t.par} · ${t.yardage.toLocaleString()} yards`);
  }
  const fallback = getVenueRequirements(t.name);
  if (fallback?.surface) bullets.push(fallback.surface);
  if (fallback?.demands) bullets.push(fallback.demands);
  return bullets;
}

function formatStateLabel(
  state: IntelligenceLifecycleState,
  data: AIPredictionData | null | undefined,
  nextTournamentPredictions: AIPredictionData | null,
  tracker: PredictionTrackerData | undefined,
): string {
  if (state === 'live') {
    const lead = tracker?.predictions[0];
    const noScoresYet =
      !!lead &&
      (lead.thru === null || lead.thru === 0) &&
      (lead.currentRound === null || lead.currentRound === 1);
    if (noScoresYet) return 'TEES OFF SOON';
    const round = lead?.currentRound ?? 1;
    return `LIVE · ROUND ${round}`;
  }
  if (state === 'results' && data?.tournament?.startDate && data?.tournament?.endDate) {
    return formatDateRange(data.tournament.startDate, data.tournament.endDate);
  }
  const t = nextTournamentPredictions?.tournament ?? data?.tournament;
  if (t?.startDate && t?.endDate) {
    return formatDateRange(t.startDate, t.endDate);
  }
  return 'UPCOMING';
}

// ─── Component ──────────────────────────────────────────────────────────────

export const IntelligenceHero = memo(function IntelligenceHero() {
  const {
    state,
    activeTournamentId,
    data,
    nextTournamentPredictions,
    isLoading,
  } = useIntelligenceLifecycleState();
  const { data: pickHistory = [] } = usePickHistory();

  // Tracker is needed for both live AND results states (per Phase B audit).
  // Upcoming skips it — there is nothing to track.
  const trackerEnabled = state === 'live' || state === 'results';
  const { data: tracker } = usePredictionTracker(
    trackerEnabled ? activeTournamentId : null,
    trackerEnabled ? data : null,
  );

  // ─── Computed track record ────────────────────────────────────────────────
  const { wins, topFives, topFiveRate } = useMemo(() => {
    const w = pickHistory.filter(e => e.isWinner).length;
    const t5 = pickHistory.filter(
      e => e.actualPosition !== null && e.actualPosition <= 5,
    ).length;
    const total = pickHistory.length || 1;
    const rate = Math.round((t5 / total) * 100);
    return { wins: w, topFives: t5, topFiveRate: rate };
  }, [pickHistory]);

  const stateLabel = useMemo(
    () => formatStateLabel(state, data, nextTournamentPredictions, tracker),
    [state, data, nextTournamentPredictions, tracker],
  );

  const [sheetOpen, setSheetOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const handleOpenSheet = () => setSheetOpen(true);
  const handleCloseSheet = () => setSheetOpen(false);
  const handleOpenAbout = () => setAboutOpen(true);
  const handleCloseAbout = () => setAboutOpen(false);

  return (
    <section
      aria-label="clbhouz Intelligence"
      style={{ paddingLeft: 16, paddingRight: 16 }}
    >
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 20,
          padding: '24px 18px 18px',
          background:
            `linear-gradient(135deg, ${GREEN_DEEP} 0%, ${GREEN_MID} 50%, ${GREEN_DARK} 100%)`,
          boxShadow:
            '0 8px 30px -10px rgba(6,58,38,0.55), inset 0 1px 0 rgba(255,255,255,0.10)',
        }}
      >
        {/* ── Decorative orbs (preserved per Phase A refinement) ── */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: -60,
            right: -60,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(45,187,120,0.18) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            bottom: -80,
            left: -60,
            width: 240,
            height: 240,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(247,147,30,0.10) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <Masthead stateLabel={stateLabel} onInfoTap={handleOpenAbout} />

          <Divider top={14} bottom={16} />

          {/* ── State-conditional content ── */}
          {isLoading ? (
            <StateMessage label="Loading Intelligence…" />
          ) : (
            <>
              {state === 'live' && (
                <LiveStateBlock data={data} tracker={tracker} />
              )}
              {state === 'results' && (
                <ResultsStateBlock data={data} tracker={tracker} />
              )}
              {state === 'upcoming' && (
                <UpcomingStateBlock data={nextTournamentPredictions ?? data ?? null} />
              )}
            </>
          )}

          {/* ── Track record stat strip ── */}
          <div style={{ marginTop: 18 }}>
            <TrackRecord wins={wins} topFives={topFives} topFiveRate={topFiveRate} />
          </div>

          {/* ── CTA ── */}
          <CTA onOpenSheet={handleOpenSheet} />
        </div>
      </div>

      {/* ── Phase C bottom sheet (portal-rendered by BottomSheet primitive) ── */}
      <IntelligenceAllPicksSheet open={sheetOpen} onClose={handleCloseSheet} />

      {/* ── v2 Polish: About sheet (also portal-rendered) ── */}
      <IntelligenceAboutSheet
        open={aboutOpen}
        onClose={handleCloseAbout}
        trackRecord={{ wins, topFives }}
      />
    </section>
  );
});

// ─── Persistent shell sub-components ────────────────────────────────────────

function Masthead({
  stateLabel,
  onInfoTap,
}: {
  stateLabel: string;
  onInfoTap: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        {/* Brain icon — tappable, opens About sheet */}
        <button
          type="button"
          onClick={onInfoTap}
          aria-label="About clbhouz Intelligence"
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            background: AMBER_ACCENT,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(247,147,30,0.35)',
            flexShrink: 0,
          }}
        >
          <Brain size={15} color={GREEN_DEEP} strokeWidth={2.8} />
        </button>
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: AMBER_ACCENT,
            textShadow: '0 0 12px rgba(247,147,30,0.5)',
          }}
        >
          clbhouz Intelligence
        </span>
        {/* "i" info icon — also tappable, opens About sheet */}
        <button
          type="button"
          onClick={onInfoTap}
          aria-label="About clbhouz Intelligence"
          style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.4)',
            background: 'transparent',
            color: 'rgba(255,255,255,0.75)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            flexShrink: 0,
            fontFamily: '"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            fontStyle: 'italic',
            fontSize: 10,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          i
        </button>
      </div>
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.55)',
          fontVariantNumeric: 'tabular-nums',
          flexShrink: 0,
        }}
      >
        {stateLabel}
      </span>
    </div>
  );
}

function TrackRecord({
  wins,
  topFives,
  topFiveRate,
}: {
  wins: number;
  topFives: number;
  topFiveRate: number;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 8,
      }}
    >
      <StatPill value={String(wins)} label="Wins" highlight />
      <StatPill value={String(topFives)} label="Top-5s" />
      <StatPill value={`${topFiveRate}%`} label="Top-5 Rate" />
    </div>
  );
}

function CTA({ onOpenSheet }: { onOpenSheet: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpenSheet}
      style={{
        marginTop: 16,
        width: '100%',
        padding: '13px 16px',
        borderRadius: 12,
        border: 'none',
        cursor: 'pointer',
        background: AMBER_ACCENT,
        color: GREEN_DEEP,
        fontSize: 13,
        fontWeight: 900,
        letterSpacing: '-0.1px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        boxShadow: '0 2px 12px rgba(247,147,30,0.25)',
      }}
    >
      <span>See all Intelligence picks</span>
      <ChevronRight size={15} strokeWidth={3} />
    </button>
  );
}

// ─── State blocks ────────────────────────────────────────────────────────────

function LiveStateBlock({
  data,
  tracker,
}: {
  data: AIPredictionData | null | undefined;
  tracker: PredictionTrackerData | undefined;
}) {
  const editorial = INTELLIGENCE_HERO_FALLBACK.live;
  const picks = tracker?.predictions ?? [];
  const accuracy = tracker?.accuracy;

  return (
    <div>
      <Eyebrow>{editorial.eyebrow}</Eyebrow>
      <Headline>{editorial.headline}</Headline>
      <Standfirst>{editorial.standfirst}</Standfirst>

      {/* Performance band — honest zeros pre-tee-off (per refinement) */}
      {accuracy && (
        <div
          style={{
            marginTop: 14,
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            flexWrap: 'wrap',
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.6)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <PerformanceChip label={`${accuracy.inTop5} IN T5`} />
          <PerformanceChip label={`${accuracy.inTop10} IN T10`} />
        </div>
      )}

      {/* Picks list */}
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {picks.length === 0 && data?.topContenders.slice(0, 3).map((p) => (
          <UpcomingPickRow key={p.playerId} contender={p} />
        ))}
        {picks.slice(0, 3).map((p) => (
          <LivePickRow key={p.playerId} pick={p} />
        ))}
      </div>
    </div>
  );
}

function ResultsStateBlock({
  data,
  tracker,
}: {
  data: AIPredictionData | null | undefined;
  tracker: PredictionTrackerData | undefined;
}) {
  const picks = tracker?.predictions ?? [];
  const topPick = picks[0];
  const topPickWon = !!topPick && topPick.actualPosition === 1;

  // "WE CALLED IT" recap — only when our Top Pick actually won.
  if (topPickWon && topPick) {
    const editorial = INTELLIGENCE_HERO_FALLBACK.results.win;
    return (
      <div>
        <Eyebrow color={AMBER_ACCENT} glow>{editorial.eyebrow}</Eyebrow>
        <Headline>{editorial.headline}</Headline>
        <Standfirst>{editorial.standfirst}</Standfirst>

        {/* Hero slot — 56px squircle wrapper around lg avatar with amber ring */}
        <div
          style={{
            marginTop: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              padding: 2,
              borderRadius: '38%',
              background:
                'linear-gradient(135deg, rgba(247,147,30,1) 0%, rgba(247,147,30,0.4) 100%)',
              boxShadow: '0 0 18px rgba(247,147,30,0.5)',
              flexShrink: 0,
            }}
          >
            <PlayerAvatar
              playerId={topPick.playerId}
              playerName={topPick.playerName}
              tourCode="pga"
              size="md"
            />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '-0.3px',
                lineHeight: 1.1,
              }}
            >
              {topPick.playerName}
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: AMBER_ACCENT,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              WINNER · {formatScore(topPick.score)}
            </div>
          </div>
        </div>

        {/* Other picks — compact rows */}
        {picks.length > 1 && (
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {picks.slice(1, 3).map((p) => (
              <ResultsPickRow key={p.playerId} pick={p} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Honest "FINAL STANDINGS" — Top Pick did not win.
  const editorial = INTELLIGENCE_HERO_FALLBACK.results.standings;
  return (
    <div>
      <Eyebrow>{editorial.eyebrow}</Eyebrow>
      <Headline>{editorial.headline}</Headline>
      <Standfirst>{editorial.standfirst}</Standfirst>

      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {picks.slice(0, 3).map((p, i) => (
          <ExpandablePickRow
            key={p.playerId}
            playerId={p.playerId}
            playerName={p.playerName}
            reasons={p.reasons}
            defaultExpanded={i === 0}
            tier={i === 0 ? 'TOP PICK' : i === 1 ? 'STRONG' : 'CONTENTION'}
            trailing={<ResultsTrailing pick={p} />}
          />
        ))}
      </div>
    </div>
  );
}

function UpcomingStateBlock({ data }: { data: AIPredictionData | null }) {
  const editorial = INTELLIGENCE_HERO_FALLBACK.upcoming;
  const tournament = data?.tournament;
  const venueName = tournament?.venueName ?? 'Venue TBC';
  const tournamentName = tournament?.name ?? 'Next Tournament';
  const headline = buildUpcomingHeadline(tournamentName);
  const locationLine = tournament ? formatLocation(tournament) : '';
  const bullets = tournament ? getVenueBullets(tournament) : [];

  return (
    <div>
      <Eyebrow color={AMBER_ACCENT}>{editorial.eyebrow}</Eyebrow>
      <Headline>{headline}</Headline>
      <Standfirst>{editorial.standfirst}</Standfirst>

      {/* Venue card */}
      <div
        style={{
          marginTop: 14,
          padding: '12px 14px',
          borderRadius: 12,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.10)',
        }}
      >
        <div
          style={{
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: GREEN_ACCENT,
          }}
        >
          {tournamentName}
        </div>
        <div
          style={{
            marginTop: 4,
            marginBottom: 4,
            fontSize: 16,
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '-0.2px',
            lineHeight: 1.2,
          }}
        >
          {venueName}
        </div>

        {/* Two-column row: location + bullets on the left, countdown on the right */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          {/* Left column — location + spec bullets */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {locationLine && (
              <div
                style={{
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.55)',
                  letterSpacing: '-0.05px',
                }}
              >
                {locationLine}
              </div>
            )}
            {bullets.length > 0 && (
              <ul
                style={{
                  margin: '8px 0 0',
                  padding: 0,
                  listStyle: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                {bullets.map((b, i) => (
                  <li
                    key={i}
                    style={{
                      fontSize: 11,
                      color: 'rgba(255,255,255,0.65)',
                      letterSpacing: '-0.05px',
                      lineHeight: 1.4,
                      display: 'flex',
                      gap: 6,
                    }}
                  >
                    <span style={{ color: GREEN_ACCENT, flexShrink: 0 }}>·</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Right column — countdown (only when start date is available) */}
          {tournament?.startDate && (
            <VenueTileCountdown startDate={tournament.startDate} />
          )}
        </div>
      </div>

      {/* Picks list — chevron-expand, Top Pick auto-expanded */}
      {data?.topContenders && data.topContenders.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.topContenders.slice(0, 3).map((p, i) => (
            <ExpandablePickRow
              key={p.playerId}
              playerId={p.playerId}
              playerName={p.playerName}
              reasons={p.reasons}
              defaultExpanded={i === 0}
              tier={i === 0 ? 'TOP PICK' : i === 1 ? 'STRONG' : 'CONTENTION'}
              collapsedReasonPreview={p.reasons[0]}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Venue tile countdown (Upcoming state only) ──────────────────────────────

const PAD2 = (n: number) => String(n).padStart(2, '0');

/**
 * VenueTileCountdown — compact right-column countdown for the UpcomingStateBlock
 * venue tile. Above 24h: D / H / M with M highlighted. Below 24h: H / M / S
 * with S highlighted (live energy follows the most-granular visible unit).
 *
 * Memoised so the parent IntelligenceHero card does not re-render every tick —
 * only this component re-renders.
 */
const VenueTileCountdown = memo(function VenueTileCountdown({
  startDate,
}: {
  startDate: string;
}) {
  const countdown = useCountdown(startDate);
  if (!countdown) return null;

  const showSeconds = countdown.totalMs < 24 * 60 * 60 * 1000;

  return (
    <div style={{ textAlign: 'right', flexShrink: 0 }}>
      <div
        style={{
          fontSize: 8,
          fontWeight: 900,
          color: AMBER_ACCENT,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          marginBottom: 4,
        }}
      >
        Tees Off In
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 8,
          justifyContent: 'flex-end',
        }}
      >
        {showSeconds ? (
          <>
            <CountdownUnit value={countdown.hours} label="H" />
            <CountdownUnit value={countdown.minutes} label="M" />
            <CountdownUnit value={countdown.seconds} label="S" highlight />
          </>
        ) : (
          <>
            <CountdownUnit value={countdown.days} label="D" />
            <CountdownUnit value={countdown.hours} label="H" />
            <CountdownUnit value={countdown.minutes} label="M" highlight />
          </>
        )}
      </div>
    </div>
  );
});

function CountdownUnit({
  value,
  label,
  highlight,
}: {
  value: number;
  label: string;
  highlight?: boolean;
}) {
  const color = highlight ? AMBER_ACCENT : '#ffffff';
  const labelColor = highlight ? AMBER_ACCENT : 'rgba(255,255,255,0.55)';
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
      <span
        style={{
          fontSize: 18,
          fontWeight: 900,
          color,
          letterSpacing: '-0.4px',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1,
        }}
      >
        {PAD2(value)}
      </span>
      <span
        style={{
          fontSize: 9,
          fontWeight: 800,
          color: labelColor,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Pick rows ───────────────────────────────────────────────────────────────

function LivePickRow({ pick }: { pick: TrackedPrediction }) {
  const reasoningHit = isReasoningPlayingOut(pick);
  const positionStr = formatPosition(pick);
  const scoreStr = formatScore(pick.score);
  const reasonText = pick.reasons[0] ?? '';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <PlayerAvatar
        playerId={pick.playerId}
        playerName={pick.playerName}
        tourCode="pga"
        size="sm"
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.2px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0,
            }}
          >
            {pick.playerName}
          </span>
          {reasoningHit && (
            <Check
              size={11}
              color={AMBER_ACCENT}
              strokeWidth={3}
              aria-label="Reasoning playing out"
            />
          )}
        </div>
        {reasonText && (
          <div
            style={{
              marginTop: 2,
              fontSize: 11,
              color: 'rgba(255,255,255,0.55)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {reasonText}
          </div>
        )}
      </div>
      <div
        style={{
          textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
          flexShrink: 0,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 800, color: '#ffffff' }}>
          {positionStr}
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>
          {scoreStr}
        </div>
      </div>
    </div>
  );
}

function ResultsPickRow({ pick }: { pick: TrackedPrediction }) {
  const positionStr = formatPosition(pick);
  const scoreStr = formatScore(pick.score);
  const won = pick.actualPosition === 1;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <PlayerAvatar
        playerId={pick.playerId}
        playerName={pick.playerName}
        tourCode="pga"
        size="sm"
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '-0.2px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {pick.playerName}
        </div>
        <div
          style={{
            marginTop: 2,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          PICK {pick.predictedRank}
        </div>
      </div>
      <div
        style={{
          textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            color: won ? AMBER_ACCENT : '#ffffff',
          }}
        >
          {positionStr}
        </div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.55)',
          }}
        >
          {scoreStr}
        </div>
      </div>
    </div>
  );
}

function UpcomingPickRow({ contender }: { contender: AITopContender }) {
  const reasonText = contender.reasons[0] ?? '';
  const fitScore = contender.courseFitScore;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <PlayerAvatar
        playerId={contender.playerId}
        playerName={contender.playerName}
        tourCode="pga"
        size="sm"
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '-0.2px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {contender.playerName}
        </div>
        {reasonText && (
          <div
            style={{
              marginTop: 2,
              fontSize: 11,
              color: 'rgba(255,255,255,0.55)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {reasonText}
          </div>
        )}
      </div>
      {!!fitScore && (
        <div
          style={{
            flexShrink: 0,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.06em',
            padding: '4px 8px',
            borderRadius: 8,
            background: 'rgba(45,187,120,0.18)',
            color: GREEN_ACCENT,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          FIT {Math.round(fitScore)}
        </div>
      )}
    </div>
  );
}

// ─── Expandable pick row (Upcoming + Results) ──────────────────────────────

function ExpandablePickRow({
  playerId,
  playerName,
  reasons,
  defaultExpanded = false,
  tier,
  collapsedReasonPreview,
  trailing,
}: {
  playerId: string;
  playerName: string;
  reasons: string[];
  defaultExpanded?: boolean;
  tier: 'TOP PICK' | 'STRONG' | 'CONTENTION';
  collapsedReasonPreview?: string;
  trailing?: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const tierColor =
    tier === 'TOP PICK' ? AMBER_ACCENT
    : tier === 'STRONG' ? GREEN_ACCENT
    : 'rgba(255,255,255,0.65)';
  const visibleReasons = reasons.filter(Boolean).slice(0, 3);

  return (
    <div
      style={{
        borderRadius: 12,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.10)',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        aria-expanded={expanded}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          cursor: 'pointer',
          textAlign: 'left',
          color: 'inherit',
        }}
      >
        <PlayerAvatar
          playerId={playerId}
          playerName={playerName}
          tourCode="pga"
          size="sm"
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.2px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {playerName}
          </div>
          <div
            style={{
              marginTop: 2,
              fontSize: expanded ? 9 : 11,
              fontWeight: expanded ? 800 : 500,
              letterSpacing: expanded ? '0.14em' : '-0.05px',
              textTransform: expanded ? 'uppercase' : 'none',
              color: expanded ? tierColor : 'rgba(255,255,255,0.55)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {expanded ? tier : (collapsedReasonPreview ?? visibleReasons[0] ?? '')}
          </div>
        </div>
        {trailing}
        <span
          aria-hidden
          style={{
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 22,
            height: 22,
            borderRadius: 999,
            background: 'rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.65)',
          }}
        >
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </span>
      </button>

      {expanded && visibleReasons.length > 0 && (
        <div
          style={{
            padding: '4px 14px 12px 56px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {visibleReasons.map((r, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 8,
                fontSize: 12,
                lineHeight: 1.5,
                color: 'rgba(255,255,255,0.78)',
                letterSpacing: '-0.05px',
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  color: tierColor,
                  fontWeight: 800,
                  marginTop: 1,
                }}
              >
                ·
              </span>
              <span>{r}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ResultsTrailing({ pick }: { pick: TrackedPrediction }) {
  const positionStr = formatPosition(pick);
  const scoreStr = formatScore(pick.score);
  const won = pick.actualPosition === 1;

  return (
    <div
      style={{
        textAlign: 'right',
        fontVariantNumeric: 'tabular-nums',
        flexShrink: 0,
        marginRight: 4,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: won ? AMBER_ACCENT : '#ffffff',
        }}
      >
        {positionStr}
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>
        {scoreStr}
      </div>
    </div>
  );
}

// ─── Atoms ───────────────────────────────────────────────────────────────────

function Eyebrow({
  children,
  color = GREEN_ACCENT,
  glow,
}: {
  children: React.ReactNode;
  color?: string;
  glow?: boolean;
}) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color,
        textShadow: glow ? `0 0 14px ${color}80` : undefined,
      }}
    >
      {children}
    </div>
  );
}

function Headline({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        margin: '6px 0 0',
        fontSize: 22,
        fontWeight: 900,
        lineHeight: 1.1,
        letterSpacing: '-0.5px',
        color: '#ffffff',
      }}
    >
      {children}
    </h2>
  );
}

function Standfirst({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        margin: '8px 0 0',
        fontSize: 13,
        lineHeight: 1.4,
        color: 'rgba(255,255,255,0.7)',
        letterSpacing: '-0.1px',
      }}
    >
      {children}
    </p>
  );
}

function PerformanceChip({ label }: { label: string }) {
  return (
    <span
      style={{
        padding: '4px 9px',
        borderRadius: 999,
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      {label}
    </span>
  );
}

function Divider({ top = 0, bottom = 0 }: { top?: number; bottom?: number }) {
  return (
    <div
      style={{
        height: 1,
        background: 'rgba(255,255,255,0.1)',
        marginTop: top,
        marginBottom: bottom,
      }}
    />
  );
}

function StateMessage({ label }: { label: string }) {
  return (
    <div
      style={{
        padding: '14px 0',
        fontSize: 13,
        fontWeight: 600,
        color: 'rgba(255,255,255,0.6)',
        letterSpacing: '-0.1px',
      }}
    >
      {label}
    </div>
  );
}

function StatPill({
  value,
  label,
  highlight,
}: {
  value: string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        borderRadius: 12,
        padding: '10px 8px',
        textAlign: 'center',
        background: highlight
          ? 'rgba(247, 147, 30, 0.12)'
          : 'rgba(255,255,255,0.05)',
        border: highlight
          ? '1px solid rgba(247, 147, 30, 0.35)'
          : '1px solid rgba(255,255,255,0.10)',
      }}
    >
      <div
        style={{
          fontSize: 24,
          fontWeight: 900,
          color: highlight ? AMBER_ACCENT : '#ffffff',
          letterSpacing: '-0.6px',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 8,
          fontWeight: 800,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: highlight ? AMBER_ACCENT : 'rgba(255,255,255,0.65)',
        }}
      >
        {label}
      </div>
    </div>
  );
}
