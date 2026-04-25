/**
 * IntelligenceHero — Tour Hub focal point
 *
 * Deep-purple magazine card establishing Clbhouz Intelligence as the AI brand
 * on the Tour Hub. Auto-detects tournament lifecycle (live / results / upcoming)
 * via `useIntelligenceLifecycleState` (mirrors HeroCarousel's 1.5-day window).
 *
 * Phase A: persistent shell (Masthead + TrackRecord + CTA).
 * Phase B (this commit): full content blocks for each lifecycle state.
 *   - Live    → performance band + 3 picks with live position + reasoning
 *   - Results → "WE CALLED IT" recap when Top Pick wins, else final standings
 *   - Upcoming → venue card with course-fit chips + 3 picks with reasoning
 * Phase C: wires the CTA to open IntelligenceAllPicksSheet.
 *
 * Editorial copy reads from INTELLIGENCE_HERO_FALLBACK (V1 hardcoded). V2 will
 * move to a Claude-driven daily pipeline via championship_editorial_daily.
 */

import { memo, useMemo, useState } from 'react';
import { Brain, ChevronRight, Check } from 'lucide-react';
import {
  useIntelligenceLifecycleState,
  type IntelligenceLifecycleState,
} from '../hooks/useIntelligenceLifecycleState';
import { usePickHistory } from '../hooks/usePickHistory';
import { usePredictionTracker } from '../hooks/usePredictionTracker';
import type { AIPredictionData, AITopContender } from '../hooks/useAIPredictions';
import type { TrackedPrediction, PredictionTrackerData } from './tournament-insights/types';
import { PlayerAvatar } from './PlayerAvatar';
import { INTELLIGENCE_HERO_FALLBACK } from '../utils/editorialFallbacks';
import { IntelligenceAllPicksSheet } from './IntelligenceAllPicksSheet';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const WEEKDAYS = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

const PURPLE_ACCENT = '#A78BFA';
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
  if (state === 'results' && data?.tournament?.endDate) {
    const d = new Date(data.tournament.endDate);
    return `FINAL · ${MONTHS[d.getMonth()]} ${d.getDate()}`;
  }
  const startIso = nextTournamentPredictions?.tournament?.startDate ?? data?.tournament?.startDate;
  if (startIso) {
    const d = new Date(startIso);
    return `TEES OFF ${WEEKDAYS[d.getDay()]}`;
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
  const handleOpenSheet = () => setSheetOpen(true);
  const handleCloseSheet = () => setSheetOpen(false);

  return (
    <section
      aria-label="Clbhouz Intelligence"
      style={{ paddingLeft: 16, paddingRight: 16 }}
    >
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 20,
          padding: '24px 18px 18px',
          background:
            'linear-gradient(135deg, #1a0f2e 0%, #2d1b4e 50%, #1e1138 100%)',
          boxShadow:
            '0 12px 40px -8px rgba(124, 58, 237, 0.45), 0 4px 12px rgba(0, 0, 0, 0.25)',
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
              'radial-gradient(circle, rgba(167, 139, 250, 0.35) 0%, transparent 70%)',
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
              'radial-gradient(circle, rgba(247, 147, 30, 0.18) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <Masthead stateLabel={stateLabel} />

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
    </section>
  );
});

// ─── Persistent shell sub-components ────────────────────────────────────────

function Masthead({ stateLabel }: { stateLabel: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background:
              'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(167, 139, 250, 0.55)',
            flexShrink: 0,
          }}
        >
          <Brain size={15} color="#ffffff" strokeWidth={2.4} />
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: PURPLE_ACCENT,
            textShadow: '0 0 12px rgba(167, 139, 250, 0.5)',
          }}
        >
          Clbhouz Intelligence
        </span>
      </div>
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.55)',
          fontVariantNumeric: 'tabular-nums',
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
      <StatPill value={String(topFives)} label="Top-5" />
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
        border: '1px solid rgba(255,255,255,0.12)',
        cursor: 'pointer',
        background: 'rgba(255,255,255,0.06)',
        color: '#ffffff',
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: '-0.1px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <span>See all Intelligence picks</span>
      <ChevronRight size={15} strokeWidth={2.4} />
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
        {picks.slice(0, 3).map((p) => (
          <ResultsPickRow key={p.playerId} pick={p} />
        ))}
      </div>
    </div>
  );
}

function UpcomingStateBlock({ data }: { data: AIPredictionData | null }) {
  const editorial = INTELLIGENCE_HERO_FALLBACK.upcoming;
  const venueName = data?.tournament?.venueName ?? 'Venue TBC';
  const tournamentName = data?.tournament?.name ?? 'Next Tournament';
  const courseChips = (() => {
    const liveStats = data?.courseAnalysis?.keyStats ?? [];
    if (liveStats.length > 0) return liveStats.slice(0, 3);
    return editorial.courseFitChips.slice(0, 3);
  })();

  return (
    <div>
      <Eyebrow>{editorial.eyebrow}</Eyebrow>
      <Headline>{editorial.headline}</Headline>
      <Standfirst>{editorial.standfirst}</Standfirst>

      {/* Venue card */}
      <div
        style={{
          marginTop: 14,
          padding: '12px 14px',
          borderRadius: 12,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div
          style={{
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: PURPLE_ACCENT,
          }}
        >
          {tournamentName}
        </div>
        <div
          style={{
            marginTop: 4,
            fontSize: 14,
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '-0.2px',
          }}
        >
          {venueName}
        </div>
        <div
          style={{
            marginTop: 10,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
          }}
        >
          {courseChips.map((chip, i) => (
            <span
              key={`${chip}-${i}`}
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.04em',
                padding: '4px 9px',
                borderRadius: 999,
                background: 'rgba(167, 139, 250, 0.12)',
                border: '1px solid rgba(167, 139, 250, 0.28)',
                color: PURPLE_ACCENT,
              }}
            >
              {chip}
            </span>
          ))}
        </div>
      </div>

      {/* Picks list */}
      {data?.topContenders && data.topContenders.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.topContenders.slice(0, 3).map((p) => (
            <UpcomingPickRow key={p.playerId} contender={p} />
          ))}
        </div>
      )}
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
            background: 'rgba(167, 139, 250, 0.14)',
            color: PURPLE_ACCENT,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          FIT {Math.round(fitScore)}
        </div>
      )}
    </div>
  );
}

// ─── Atoms ───────────────────────────────────────────────────────────────────

function Eyebrow({
  children,
  color = PURPLE_ACCENT,
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
          : 'rgba(255,255,255,0.04)',
        border: highlight
          ? '1px solid rgba(247, 147, 30, 0.35)'
          : '1px solid rgba(255,255,255,0.06)',
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
          color: highlight ? AMBER_ACCENT : 'rgba(255,255,255,0.55)',
        }}
      >
        {label}
      </div>
    </div>
  );
}
