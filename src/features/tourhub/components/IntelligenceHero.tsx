/**
 * IntelligenceHero — Tour Hub focal point
 *
 * Deep-purple magazine card establishing Clbhouz Intelligence as the AI brand
 * on the Tour Hub. Auto-detects tournament lifecycle (live / results / upcoming)
 * via `useIntelligenceLifecycleState` (mirrors HeroCarousel's 1.5-day window).
 *
 * Phase A: persistent shell (Masthead + TrackRecord + CTA) wraps state-conditional
 * stub blocks. Phase B fills the stubs with full content. Phase C wires the CTA
 * to open IntelligenceAllPicksSheet (currently a no-op).
 *
 * Editorial copy reads from championship_editorial_daily (surface =
 * 'intelligence_quote') with INTELLIGENCE_QUOTE_FALLBACK as the V1 fallback.
 */

import { memo, useMemo } from 'react';
import { Brain, ChevronRight } from 'lucide-react';
import { useIntelligenceLifecycleState, type IntelligenceLifecycleState } from '../hooks/useIntelligenceLifecycleState';
import { usePickHistory } from '../hooks/usePickHistory';
import type { AIPredictionData } from '../hooks/useAIPredictions';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const WEEKDAYS = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

function formatStateLabel(
  state: IntelligenceLifecycleState,
  data: AIPredictionData | null | undefined,
  nextTournamentPredictions: AIPredictionData | null,
): string {
  if (state === 'live') {
    // Round number isn't on AIPredictionData yet; render generic "LIVE" until
    // Phase B wires usePredictionTracker (which exposes currentRound).
    return 'LIVE';
  }
  if (state === 'results' && data?.tournament?.endDate) {
    const d = new Date(data.tournament.endDate);
    return `FINAL · ${MONTHS[d.getMonth()]} ${d.getDate()}`;
  }
  // upcoming
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
    data,
    nextTournamentPredictions,
    isLoading,
  } = useIntelligenceLifecycleState();
  const { data: pickHistory = [] } = usePickHistory();

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
    () => formatStateLabel(state, data, nextTournamentPredictions),
    [state, data, nextTournamentPredictions],
  );

  const handleOpenSheet = () => {
    // Phase C wires this to open IntelligenceAllPicksSheet.
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('[IntelligenceHero] CTA tapped — sheet wiring lands in Phase C');
    }
  };

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

        {/* Grid pattern overlay deleted per Phase A refinement (was lines 146-158). */}

        <div style={{ position: 'relative', zIndex: 1 }}>
          <Masthead stateLabel={stateLabel} />

          {/* ── Divider ── */}
          <div
            style={{
              height: 1,
              background: 'rgba(255,255,255,0.1)',
              marginTop: 14,
              marginBottom: 16,
            }}
          />

          {/* ── State-conditional content ── */}
          {isLoading ? (
            <StateStub label="Loading Intelligence…" />
          ) : (
            <>
              {state === 'live' && <LiveStateStub />}
              {state === 'results' && <ResultsStateStub />}
              {state === 'upcoming' && <UpcomingStateStub />}
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
            color: '#A78BFA',
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

// ─── Phase A state stubs (Phase B replaces with full content blocks) ────────

function LiveStateStub() {
  return <StateStub label="Live tournament in progress." />;
}

function ResultsStateStub() {
  return <StateStub label="Recent results." />;
}

function UpcomingStateStub() {
  return <StateStub label="Next tournament preview." />;
}

function StateStub({ label }: { label: string }) {
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

// ─── Atoms ───────────────────────────────────────────────────────────────────

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
          color: highlight ? '#F7931E' : '#ffffff',
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
          color: highlight ? '#F7931E' : 'rgba(255,255,255,0.55)',
        }}
      >
        {label}
      </div>
    </div>
  );
}
