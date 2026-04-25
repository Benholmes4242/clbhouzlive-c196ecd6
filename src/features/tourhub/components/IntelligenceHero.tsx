/**
 * IntelligenceHero — Tour Hub focal point (V1 redesign Phase A)
 *
 * Phase A scope: visual shell only.
 *  - No-card-on-page treatment (deep-purple grid card DELETED).
 *  - Persistent shell: masthead, editorial headline, standfirst, track record, CTA.
 *  - Idle vs Active state branching via `useIntelligenceState()`. Both state
 *    blocks are STUBS in Phase A (Phase B fills idle, Phase C fills active).
 *
 * Editorial copy reads from championship_editorial_daily (surface =
 * 'intelligence_quote') with INTELLIGENCE_QUOTE_FALLBACK as the V1 fallback.
 */

import { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, ChevronRight } from 'lucide-react';
import { useAIPredictions } from '../hooks/useAIPredictions';
import { usePickHistory } from '../hooks/usePickHistory';
import { useIntelligenceState } from '../hooks/useIntelligenceState';
import { useDailyEditorial } from '@/hooks/championship/useDailyEditorial';
import { INTELLIGENCE_QUOTE_FALLBACK } from '../utils/editorialFallbacks';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatIssueDate(d: Date): string {
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

const SEASON_START_MS = new Date(new Date().getFullYear(), 0, 1).getTime();
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
function computeIssueNumber(): number {
  return Math.floor((Date.now() - SEASON_START_MS) / WEEK_MS) + 1;
}

// ─── Component ──────────────────────────────────────────────────────────────

export const IntelligenceHero = memo(function IntelligenceHero() {
  const navigate = useNavigate();

  const { activeTournamentId } = useAIPredictions();
  const { state, isLoading } = useIntelligenceState();
  const { data: pickHistory = [] } = usePickHistory();
  const { data: editorial } = useDailyEditorial({
    surface: 'intelligence_quote',
    seasonId: null,
    timeFilter: 'all_time',
  });

  // ─── Computed record ───────────────────────────────────────────────────────
  const { wins, topFives, accuracy, lastWin } = useMemo(() => {
    const w = pickHistory.filter(e => e.isWinner).length;
    const t5 = pickHistory.filter(
      e => e.actualPosition !== null && e.actualPosition <= 5,
    ).length;
    const total = pickHistory.length || 1;
    const acc = Math.round((t5 / total) * 100);
    const last = pickHistory.find(e => e.isWinner) ?? null;
    return { wins: w, topFives: t5, accuracy: acc, lastWin: last };
  }, [pickHistory]);

  const issueDate = useMemo(() => formatIssueDate(new Date()), []);
  const issueNumber = useMemo(() => computeIssueNumber(), []);

  // ─── Editorial standfirst with fallback ────────────────────────────────────
  // Idle: editorial.standfirst OR computed from real lastWin OR generic fallback.
  // Active: Phase C will swap in tournament-specific copy.
  const idleStandfirst = useMemo(() => {
    if (editorial?.standfirst) return editorial.standfirst;
    if (lastWin?.topPickName && lastWin?.tournamentName) {
      return `Clbhouz called ${wins} PGA TOUR winner${wins === 1 ? '' : 's'} this season — including ${lastWin.topPickName} at the ${lastWin.tournamentName}.`;
    }
    return INTELLIGENCE_QUOTE_FALLBACK.pullQuote;
  }, [editorial?.standfirst, lastWin, wins]);

  const handleSeeAll = () => {
    if (activeTournamentId) {
      navigate(`/tourhub/tournament/${activeTournamentId}`);
    } else {
      navigate('/tourhub');
    }
  };

  if (isLoading) {
    return <IntelligenceHeroSkeleton />;
  }

  return (
    <section
      aria-label="Clbhouz Intelligence"
      style={{
        background: 'transparent',
        padding: '8px 16px',
        fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif',
        color: '#0F172A',
      }}
    >
      <Masthead issueNumber={issueNumber} dateLabel={issueDate} />

      <EditorialHeadline wins={wins} topFives={topFives} />

      <Standfirst text={idleStandfirst} />

      <TrackRecord wins={wins} topFives={topFives} accuracy={accuracy} />

      {state === 'active' && <ActiveStateStub />}
      {state === 'idle' && <IdleStateStub />}

      <CTA onClick={handleSeeAll} />
    </section>
  );
});

// ─── Persistent shell sub-components ────────────────────────────────────────

function Masthead({ issueNumber, dateLabel }: { issueNumber: number; dateLabel: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 6px 20px rgba(124, 58, 237, 0.4)',
          flexShrink: 0,
        }}
      >
        <Brain size={18} color="#ffffff" strokeWidth={2.5} />
      </div>
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: '0.12em',
            color: '#7C3AED',
            textTransform: 'uppercase',
            lineHeight: 1.1,
          }}
        >
          Clbhouz Intelligence
        </div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: '#94A3B8',
            marginTop: 2,
            letterSpacing: '0.02em',
          }}
        >
          Issue {issueNumber} · {dateLabel}
        </div>
      </div>
    </div>
  );
}

function EditorialHeadline({ wins, topFives }: { wins: number; topFives: number }) {
  return (
    <h2
      style={{
        fontSize: 30,
        lineHeight: 1.05,
        letterSpacing: '-1px',
        fontWeight: 900,
        color: '#0F172A',
        margin: '0 0 10px',
      }}
    >
      {wins} winner{wins === 1 ? '' : 's'}. {topFives} top-five{topFives === 1 ? '' : 's'}.
      <br />
      <span
        style={{
          background: 'linear-gradient(135deg, #7C3AED 0%, #F7931E 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        One season.
      </span>
    </h2>
  );
}

function Standfirst({ text }: { text: string }) {
  return (
    <p
      style={{
        fontSize: 13,
        lineHeight: 1.5,
        color: '#475569',
        margin: '0 0 18px',
        fontWeight: 500,
      }}
    >
      {text}
    </p>
  );
}

function TrackRecord({
  wins,
  topFives,
  accuracy,
}: {
  wins: number;
  topFives: number;
  accuracy: number;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        background: '#ffffff',
        border: '1px solid #E2E8F0',
        borderRadius: 14,
        overflow: 'hidden',
        marginBottom: 18,
      }}
    >
      <StatCell value={String(wins)} label="Wins" highlight />
      <StatCell value={String(topFives)} label="Top-5" divider />
      <StatCell value={`${accuracy}%`} label="Top-5 Rate" divider />
    </div>
  );
}

function StatCell({
  value,
  label,
  highlight,
  divider,
}: {
  value: string;
  label: string;
  highlight?: boolean;
  divider?: boolean;
}) {
  return (
    <div
      style={{
        padding: '14px 8px',
        textAlign: 'center',
        background: highlight ? 'rgba(247, 147, 30, 0.08)' : 'transparent',
        borderLeft: divider ? '1px solid #E2E8F0' : 'none',
      }}
    >
      <div
        style={{
          fontSize: 26,
          fontWeight: 900,
          color: highlight ? '#F7931E' : '#0F172A',
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
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: highlight ? '#F7931E' : '#64748B',
        }}
      >
        {label}
      </div>
    </div>
  );
}

function CTA({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        marginTop: 18,
        width: '100%',
        padding: '14px',
        borderRadius: 14,
        border: 'none',
        cursor: 'pointer',
        background: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
        color: '#ffffff',
        fontSize: 13,
        fontWeight: 800,
        letterSpacing: '-0.1px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        boxShadow: '0 8px 24px -8px rgba(124, 58, 237, 0.5)',
      }}
    >
      <span>See all Intelligence picks</span>
      <ChevronRight size={14} strokeWidth={2.5} />
    </button>
  );
}

// ─── State block stubs (Phase B / C will fill these) ────────────────────────

function IdleStateStub() {
  // Phase B fills: CalledItRecap, HonestyLayer, NextUp header, VenueCard,
  // CourseFitChips, PicksList (mode="upcoming"). Phase A renders nothing.
  return null;
}

function ActiveStateStub() {
  // Phase C fills: LivePerformanceBand, ActiveHeadline, ActiveStandfirst,
  // VenueCard (in-progress), CourseFitChips, PicksList (mode="live"),
  // WatchingNote. Phase A renders nothing.
  return null;
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function IntelligenceHeroSkeleton() {
  return (
    <section
      aria-label="Clbhouz Intelligence loading"
      style={{ padding: '8px 16px' }}
    >
      <div
        style={{
          height: 36,
          width: 200,
          borderRadius: 8,
          background: '#E2E8F0',
          marginBottom: 16,
        }}
      />
      <div
        style={{
          height: 100,
          borderRadius: 12,
          background: '#F1F5F9',
          marginBottom: 16,
        }}
      />
      <div
        style={{
          height: 80,
          borderRadius: 14,
          background: '#F1F5F9',
        }}
      />
    </section>
  );
}
