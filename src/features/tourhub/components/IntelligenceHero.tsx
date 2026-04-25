/**
 * IntelligenceHero — Tour Hub focal point (V1 redesign Phase B)
 *
 * Phase A: visual shell (no-card, masthead, headline, standfirst, track record, CTA).
 * Phase B: idle state content — CalledItRecap, HonestyLayer, NextUp + VenueCard,
 *          CourseFitChips, EnrichedPickRow list (upcoming mode).
 * Phase C: active state content (still stubbed).
 *
 * Editorial copy reads from championship_editorial_daily (surface =
 * 'intelligence_quote') with INTELLIGENCE_QUOTE_FALLBACK as the V1 fallback.
 *
 * Design language: squircle avatars throughout (per platform standard).
 * Rings are squircle-shaped to match — see RingedSquircleAvatar.
 */

import { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain,
  ChevronRight,
  Trophy,
  AlertCircle,
  MapPin,
  CheckCircle2,
  Activity,
  Eye,
} from 'lucide-react';
import {
  useAIPredictions,
  type AITopContender,
  type AIPredictionData,
} from '../hooks/useAIPredictions';
import { usePickHistory, type PickHistoryEntry } from '../hooks/usePickHistory';
import { useIntelligenceState } from '../hooks/useIntelligenceState';
import { usePredictionTracker } from '../hooks/usePredictionTracker';
import type { TrackedPrediction } from './tournament-insights/types';
import { useDailyEditorial } from '@/hooks/championship/useDailyEditorial';
import {
  INTELLIGENCE_QUOTE_FALLBACK,
  formatCalledItReasoningFallback,
} from '../utils/editorialFallbacks';
import { PlayerAvatar } from './PlayerAvatar';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatIssueDate(d: Date): string {
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

function formatScoreToPar(score: number | null | undefined): string {
  if (score === null || score === undefined) return '—';
  if (score === 0) return 'E';
  if (score < 0) return String(score);
  return `+${score}`;
}

function formatVenueLine(t: AIPredictionData['tournament']): string {
  const parts: string[] = [];
  if (typeof t.par === 'number' && t.par > 0) parts.push(`Par ${t.par}`);
  if (typeof t.yardage === 'number' && t.yardage > 0)
    parts.push(`${t.yardage.toLocaleString()} yds`);
  const loc = [t.venueCity, t.venueState].filter(Boolean).join(', ');
  if (loc) parts.push(loc);
  return parts.join(' · ');
}

function getTierLabel(rank: number): string {
  if (rank === 1) return 'Top Pick';
  if (rank === 2) return 'Strong Contender';
  return 'In Contention';
}

const SEASON_START_MS = new Date(new Date().getFullYear(), 0, 1).getTime();
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
function computeIssueNumber(): number {
  return Math.floor((Date.now() - SEASON_START_MS) / WEEK_MS) + 1;
}

/** Read snapshot_data.course_fit_chips with safe typing. */
function readCourseFitChips(
  snapshot: Record<string, unknown> | null | undefined,
  key: 'course_fit_chips' | 'active_course_fit_chips' = 'course_fit_chips',
): string[] | null {
  if (!snapshot) return null;
  const raw = snapshot[key];
  if (Array.isArray(raw) && raw.every((c) => typeof c === 'string')) {
    return raw as string[];
  }
  return null;
}

/** Read a string field from snapshot_data with safe typing. */
function readSnapshotString(
  snapshot: Record<string, unknown> | null | undefined,
  key: string,
): string | null {
  if (!snapshot) return null;
  const raw = snapshot[key];
  return typeof raw === 'string' && raw.trim().length > 0 ? raw : null;
}

// ─── Component ──────────────────────────────────────────────────────────────

export const IntelligenceHero = memo(function IntelligenceHero() {
  const navigate = useNavigate();

  const {
    data: activePredictions,
    activeTournamentId,
    nextTournamentPredictions,
  } = useAIPredictions();
  const { state, isLoading } = useIntelligenceState();
  const { data: pickHistory = [] } = usePickHistory();
  const { data: editorial } = useDailyEditorial({
    surface: 'intelligence_quote',
    seasonId: null,
    timeFilter: 'all_time',
  });

  // Live tracker — gated to active state only (per Phase C decision 1)
  const trackerEnabled = state === 'active' && !!activePredictions;
  const { data: tracker, isLoading: trackerLoading } = usePredictionTracker(
    trackerEnabled ? activeTournamentId : null,
    trackerEnabled ? activePredictions : null,
  );

  // ─── Computed record ───────────────────────────────────────────────────────
  const { wins, topFives, accuracy, lastWin, lastResult } = useMemo(() => {
    const w = pickHistory.filter((e) => e.isWinner).length;
    const t5 = pickHistory.filter(
      (e) => e.actualPosition !== null && e.actualPosition <= 5,
    ).length;
    const total = pickHistory.length || 1;
    const acc = Math.round((t5 / total) * 100);
    const last = pickHistory.find((e) => e.isWinner) ?? null;
    const recent = pickHistory[0] ?? null;
    return { wins: w, topFives: t5, accuracy: acc, lastWin: last, lastResult: recent };
  }, [pickHistory]);

  const issueDate = useMemo(() => formatIssueDate(new Date()), []);
  const issueNumber = useMemo(() => computeIssueNumber(), []);

  // ─── Editorial standfirst with fallback ────────────────────────────────────
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

  const isActive = state === 'active';
  const topPickTracked = tracker?.predictions?.find((p) => p.predictedRank === 1) ?? null;
  const secondPickTracked = tracker?.predictions?.find((p) => p.predictedRank === 2) ?? null;

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

      {isActive ? (
        <ActiveHeadline
          topPick={topPickTracked}
          contender={secondPickTracked}
          tournamentName={activePredictions?.tournament.name ?? null}
          loading={trackerLoading}
        />
      ) : (
        <EditorialHeadline wins={wins} topFives={topFives} />
      )}

      <Standfirst text={idleStandfirst} />

      <TrackRecord wins={wins} topFives={topFives} accuracy={accuracy} />

      {isActive && activePredictions && (
        <ActiveStateBlock
          tournament={activePredictions.tournament}
          picks={activePredictions.topContenders.slice(0, 3)}
          tracker={tracker ?? null}
          trackerLoading={trackerLoading}
          editorialSnapshot={editorial?.snapshotData}
        />
      )}
      {!isActive && (
        <IdleStateBlock
          lastWin={lastWin}
          lastResult={lastResult}
          upcoming={nextTournamentPredictions}
          editorialSnapshot={editorial?.snapshotData}
        />
      )}

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

// ─── Idle state block ───────────────────────────────────────────────────────

interface IdleStateBlockProps {
  lastWin: PickHistoryEntry | null;
  lastResult: PickHistoryEntry | null;
  upcoming: AIPredictionData | null;
  editorialSnapshot: Record<string, unknown> | null | undefined;
}

function IdleStateBlock({
  lastWin,
  lastResult,
  upcoming,
  editorialSnapshot,
}: IdleStateBlockProps) {
  // Show honesty layer only when last completed result was NOT a win and NOT MC/WD.
  const showHonesty =
    lastResult !== null &&
    !lastResult.isWinner &&
    lastResult.actualPosition !== null &&
    // Also hide if the most-recent result happens to BE the most-recent win
    // (means there's been no miss after the last win — nothing to acknowledge).
    !(lastWin && lastResult.tournamentId === lastWin.tournamentId);

  const upcomingPicks = (upcoming?.topContenders ?? []).slice(0, 3);
  const courseFitChips =
    readCourseFitChips(editorialSnapshot, 'course_fit_chips') ??
    INTELLIGENCE_QUOTE_FALLBACK.upcomingCourseFitChips;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 4 }}>
      {lastWin && <CalledItRecap winData={lastWin} />}
      {showHonesty && lastResult && <HonestyLayer missData={lastResult} />}
      {upcoming && (
        <>
          <NextUpHeader />
          <VenueCard tournament={upcoming.tournament} />
          <CourseFitChips chips={courseFitChips} />
          <PicksList picks={upcomingPicks} />
        </>
      )}
    </div>
  );
}

// ─── CalledItRecap ──────────────────────────────────────────────────────────

function CalledItRecap({ winData }: { winData: PickHistoryEntry }) {
  // V1 — pre-round-one reasoning archive does not exist (Flag 1, option ζ).
  // We render a generic italic quote WITHOUT the "POSTED PRE-ROUND ONE"
  // eyebrow to avoid lying about provenance.
  const reasoning = formatCalledItReasoningFallback(winData.topPickName);
  const score = formatScoreToPar(winData.scoreToPar);

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid rgba(247, 147, 30, 0.35)',
        borderRadius: 14,
        padding: '14px 14px 12px',
        boxShadow: '0 4px 16px -8px rgba(247, 147, 30, 0.25)',
      }}
    >
      {/* Eyebrow */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <Trophy size={11} color="#F7931E" strokeWidth={2.5} />
        <span
          style={{
            fontSize: 9,
            fontWeight: 900,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: '#F7931E',
          }}
        >
          We Called It · {winData.shortName || winData.tournamentName}
        </span>
      </div>

      {/* Player + score row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <RingedSquircleAvatar
          playerId={winData.topPickPlayerId}
          playerName={winData.topPickName}
          innerSize={56}
          ringColor="#F7931E"
        />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: '#0F172A',
              lineHeight: 1.15,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {winData.topPickName}
          </div>
          <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginTop: 3 }}>
            Won outright · {winData.year}
          </div>
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 900,
            letterSpacing: '-0.8px',
            color: '#F7931E',
            fontVariantNumeric: 'tabular-nums',
            flexShrink: 0,
          }}
        >
          {score}
        </div>
      </div>

      {/* Reasoning block — NO "POSTED PRE-ROUND ONE" eyebrow because it's a
          fallback (Flag 1). When the archive ships in V1.1, gate the eyebrow
          on a real provenance flag. */}
      <div
        style={{
          marginTop: 12,
          padding: '10px 12px',
          background: 'rgba(247, 147, 30, 0.04)',
          border: '1px solid rgba(247, 147, 30, 0.15)',
          borderRadius: 10,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 12,
            lineHeight: 1.5,
            fontStyle: 'italic',
            color: '#475569',
            fontWeight: 500,
          }}
        >
          “{reasoning}”
        </p>
      </div>
    </div>
  );
}

// ─── HonestyLayer ───────────────────────────────────────────────────────────

function HonestyLayer({ missData }: { missData: PickHistoryEntry }) {
  // Editorial copy for the miss is V1 fallback only (Phase B audit:
  // championship_editorial_daily.snapshot_data.miss_note is V1.2 brief).
  // We compose a factual lead-in from real data + generic note.
  const positionLabel =
    missData.actualPosition !== null
      ? `${missData.actualPositionTied ? 'T' : ''}${missData.actualPosition}`
      : 'missed cut';
  const lead = `Our Top Pick at the ${missData.shortName || missData.tournamentName} finished ${positionLabel}.`;
  const note = INTELLIGENCE_QUOTE_FALLBACK.missNote;

  return (
    <div
      style={{
        background: 'rgba(100, 116, 139, 0.06)',
        border: '1px solid rgba(100, 116, 139, 0.18)',
        borderRadius: 12,
        padding: '12px 14px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <AlertCircle size={12} color="#64748B" strokeWidth={2.4} />
        <span
          style={{
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: '#64748B',
          }}
        >
          The Miss · Last Week
        </span>
      </div>
      <p
        style={{
          margin: 0,
          fontSize: 12,
          lineHeight: 1.5,
          color: '#475569',
          fontWeight: 500,
          fontStyle: 'italic',
        }}
      >
        {lead} {note}
      </p>
    </div>
  );
}

// ─── NextUpHeader / VenueCard / CourseFitChips ──────────────────────────────

function NextUpHeader() {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 900,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: '#0F172A',
        marginTop: 4,
        marginBottom: -6,
      }}
    >
      Next Up
    </div>
  );
}

function VenueCard({
  tournament,
  eyebrow = 'Coming Up Next Week',
}: {
  tournament: AIPredictionData['tournament'];
  eyebrow?: string;
}) {
  const venueLine = formatVenueLine(tournament);
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #E2E8F0',
        borderRadius: 14,
        padding: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      {/* Course image slot — gradient fallback for V1 */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 10,
          background: 'linear-gradient(135deg, #006747 0%, #15803d 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <MapPin size={20} color="#ffffff" strokeWidth={2.4} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: '#94A3B8',
            marginBottom: 4,
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: '#0F172A',
            lineHeight: 1.2,
            marginBottom: 3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {tournament.venueName || tournament.name}
        </div>
        {venueLine && (
          <div
            style={{
              fontSize: 11,
              color: '#64748B',
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {venueLine}
          </div>
        )}
      </div>
    </div>
  );
}

function CourseFitChips({ chips }: { chips: string[] }) {
  if (!chips.length) return null;
  return (
    <div
      style={{
        background: 'rgba(124, 58, 237, 0.04)',
        border: '1px solid rgba(124, 58, 237, 0.15)',
        borderRadius: 12,
        padding: '10px 12px',
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: '#7C3AED',
          marginBottom: 8,
        }}
      >
        Course Fit
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {chips.map((chip) => (
          <span
            key={chip}
            style={{
              background: '#ffffff',
              border: '1px solid #E2E8F0',
              borderRadius: 999,
              padding: '4px 10px',
              fontSize: 10,
              fontWeight: 700,
              color: '#0F172A',
              letterSpacing: '0.01em',
            }}
          >
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Picks list + Enriched pick row ─────────────────────────────────────────

function PicksList({
  picks,
  livePositions,
}: {
  picks: AITopContender[];
  /** rank → leaderboard position (1-indexed). When provided, mode is 'live'. */
  livePositions?: Map<number, { position: number; scoreDisplay: string }>;
}) {
  if (!picks.length) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {picks.map((pick) => (
        <EnrichedPickRow
          key={pick.playerId || `${pick.rank}-${pick.playerName}`}
          pick={pick}
          live={livePositions?.get(pick.rank) ?? null}
        />
      ))}
    </div>
  );
}

type ChipTone = 'positive' | 'amber' | 'default';

function buildStatChips(pick: AITopContender): Array<{ label: string; tone: ChipTone }> {
  const chips: Array<{ label: string; tone: ChipTone }> = [];

  if (typeof pick.worldRanking === 'number' && pick.worldRanking > 0) {
    chips.push({
      label: `World #${pick.worldRanking}`,
      tone: pick.worldRanking <= 10 ? 'amber' : 'default',
    });
  }
  if (typeof pick.courseFitScore === 'number' && pick.courseFitScore > 0) {
    chips.push({
      label: `Fit ${Math.round(pick.courseFitScore)}/100`,
      tone: pick.courseFitScore >= 75 ? 'positive' : 'default',
    });
  }
  if (typeof pick.winProbability === 'number' && pick.winProbability > 0) {
    const pct = pick.winProbability < 1
      ? Math.round(pick.winProbability * 100)
      : Math.round(pick.winProbability);
    chips.push({
      label: `${pct}% win prob`,
      tone: pct >= 8 ? 'positive' : 'default',
    });
  }

  return chips.slice(0, 3);
}

function chipStyle(tone: ChipTone): React.CSSProperties {
  switch (tone) {
    case 'positive':
      return {
        background: 'rgba(16, 185, 129, 0.08)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        color: '#047857',
      };
    case 'amber':
      return {
        background: 'rgba(247, 147, 30, 0.08)',
        border: '1px solid rgba(247, 147, 30, 0.3)',
        color: '#B45309',
      };
    default:
      return {
        background: '#F8FAFC',
        border: '1px solid #E2E8F0',
        color: '#475569',
      };
  }
}

function EnrichedPickRow({
  pick,
  live,
}: {
  pick: AITopContender;
  live: { position: number; scoreDisplay: string } | null;
}) {
  const isTopPick = pick.rank === 1;
  const tier = getTierLabel(pick.rank);
  const reasoning = pick.reasons?.[0]?.trim()
    ? pick.reasons[0]
    : 'Strong fit for this venue based on form and course history.';
  const chips = buildStatChips(pick);

  // "Reasoning playing out" heuristic: top-N pick currently in top-(N×5).
  const reasoningPlayingOut =
    live !== null && live.position > 0 && live.position <= pick.rank * 5;

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #E2E8F0',
        borderRadius: 12,
        padding: 12,
      }}
    >
      {/* Top row — rank + photo + name + tier OR live position */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <RankBadge rank={pick.rank} amber={isTopPick} />
        <PlayerAvatar
          playerId={pick.playerId}
          playerName={pick.playerName}
          tourCode="pga"
          size="sm"
        />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: '#0F172A',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {pick.playerName}
          </div>
          <div
            style={{
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: isTopPick ? '#F7931E' : '#64748B',
              marginTop: 2,
            }}
          >
            {tier}
          </div>
        </div>
        {live && (
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: '#0F172A',
                letterSpacing: '0.04em',
              }}
            >
              {live.position > 0 ? `T${live.position}`.replace(/^T1$/, 'T1') : '—'}
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 900,
                color: '#10B981',
                fontVariantNumeric: 'tabular-nums',
                marginTop: 1,
              }}
            >
              {live.scoreDisplay}
            </div>
          </div>
        )}
      </div>

      {/* Chips + reasoning */}
      {(chips.length > 0 || reasoning) && (
        <div style={{ marginTop: 10 }}>
          {chips.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
              {chips.map((chip) => (
                <span
                  key={chip.label}
                  style={{
                    ...chipStyle(chip.tone),
                    borderRadius: 999,
                    padding: '3px 8px',
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: '0.02em',
                  }}
                >
                  {chip.label}
                </span>
              ))}
            </div>
          )}
          <p
            style={{
              margin: 0,
              fontSize: 11.5,
              lineHeight: 1.45,
              fontStyle: 'italic',
              color: '#475569',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 5,
            }}
          >
            {reasoningPlayingOut && (
              <CheckCircle2
                size={11}
                color="#10B981"
                strokeWidth={2.5}
                style={{ flexShrink: 0, marginTop: 2 }}
              />
            )}
            <span>“{reasoning}”</span>
          </p>
        </div>
      )}
    </div>
  );
}

function RankBadge({ rank, amber }: { rank: number; amber?: boolean }) {
  return (
    <div
      style={{
        width: 22,
        height: 22,
        borderRadius: 7,
        background: amber ? '#F7931E' : '#F1F5F9',
        color: amber ? '#ffffff' : '#475569',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        fontWeight: 900,
        flexShrink: 0,
      }}
    >
      {rank}
    </div>
  );
}

// ─── RingedSquircleAvatar ───────────────────────────────────────────────────

/**
 * Squircle ring around a squircle PlayerAvatar. Per platform design language:
 * avatars stay squircle everywhere. Ring's job is highlighting, not shape.
 *
 * innerSize is the avatar inner content size in px. Outer wrapper adds 4px
 * (2px ring + 2px gap). PlayerAvatar's predefined sizes are leveraged via
 * the closest match.
 */
function RingedSquircleAvatar({
  playerId,
  playerName,
  innerSize,
  ringColor,
  tourCode = 'pga',
}: {
  playerId: string;
  playerName: string;
  innerSize: number;
  ringColor: string;
  tourCode?: string;
}) {
  // Map innerSize to closest PlayerAvatar size token.
  // sm=32, md=44, lg=64. Pick the closest <= innerSize.
  const avatarSize: 'sm' | 'md' | 'lg' =
    innerSize >= 60 ? 'lg' : innerSize >= 40 ? 'md' : 'sm';

  return (
    <div
      style={{
        width: innerSize + 4,
        height: innerSize + 4,
        borderRadius: '36%',
        padding: 2,
        background: ringColor,
        flexShrink: 0,
        boxShadow: '0 0 0 1px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: innerSize,
          height: innerSize,
          borderRadius: '34%',
          overflow: 'hidden',
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <PlayerAvatar
          playerId={playerId}
          playerName={playerName}
          tourCode={tourCode}
          size={avatarSize}
          className="!w-full !h-full"
        />
      </div>
    </div>
  );
}

// ─── Active state stub (Phase C will fill) ──────────────────────────────────

function ActiveStateStub() {
  // Phase C fills: LivePerformanceBand, ActiveHeadline, ActiveStandfirst,
  // VenueCard (in-progress eyebrow), CourseFitChips, PicksList (mode="live"),
  // WatchingNote.
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
