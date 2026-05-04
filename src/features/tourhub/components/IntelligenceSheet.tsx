/**
 * IntelligenceSheet — merged About + Picks History sheet.
 *
 * Replaces the previous IntelligenceAboutSheet and IntelligenceAllPicksSheet.
 * Two-tab pill toggle ("How we pick" / "Picks history") below a shared header.
 *
 * Default tab is 'how'. Both the eyebrow tap and the receipts tail card open
 * this sheet on the How tab; users flip to History with one tap.
 */

import { memo, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Brain,
  TrendingUp,
  Database,
  Award,
  Cpu,
  Newspaper,
  Cloud,
  Trophy,
  ChevronRight,
} from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { PlayerAvatar } from './PlayerAvatar';
import {
  useIntelligenceHistoricalPicks,
  type IntelligenceHistoricalTournament,
  type IntelligenceOutcome,
} from '../hooks/useIntelligenceHistoricalPicks';

// ─── Tokens ─────────────────────────────────────────────────────────────────
const GREEN_DEEP = '#073D2A';
const GREEN_ACCENT = '#2DBB78';
const AMBER = '#F7931E';
const AMBER_DEEP = '#D97706';
const AMBER_SOFT = '#FEF3E7';
const SLATE_900 = '#0F172A';
const SLATE_600 = '#475569';
const SLATE_500 = '#64748B';
const SLATE_400 = '#94A3B8';
const SLATE_200 = '#E2E8F0';
const SLATE_50 = '#F8FAFC';
const HAIRLINE = 'rgba(15, 23, 42, 0.08)';

type Tab = 'how' | 'history';

export interface IntelligenceSheetProps {
  open: boolean;
  onClose: () => void;
  trackRecord: { wins: number; topFives: number };
  initialTab?: Tab;
}

export const IntelligenceSheet = memo(function IntelligenceSheet({
  open,
  onClose,
  trackRecord,
  initialTab = 'how',
}: IntelligenceSheetProps) {
  const [tab, setTab] = useState<Tab>(initialTab);
  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      style={{ maxHeight: '85vh', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column' }}
      ariaLabelledBy="intelligence-sheet-title"
    >
      <Header onClose={onClose} />
      <TabStrip tab={tab} onChange={setTab} />
      {tab === 'how' ? (
        <HowWePickBody trackRecord={trackRecord} />
      ) : (
        <PicksHistoryBody onClose={onClose} />
      )}
    </BottomSheet>
  );
});

// ─── Header ─────────────────────────────────────────────────────────────────

function Header({ onClose }: { onClose: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px 14px',
        gap: 12,
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: AMBER_SOFT,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Brain size={18} color={AMBER_DEEP} strokeWidth={2.5} />
        </div>
        <div style={{ minWidth: 0 }}>
          <h2
            id="intelligence-sheet-title"
            style={{
              margin: 0,
              fontSize: 17,
              fontWeight: 800,
              color: SLATE_900,
              letterSpacing: '-0.3px',
              lineHeight: 1.15,
            }}
          >
            Tournament Intelligence
          </h2>
          <p
            style={{
              margin: '2px 0 0',
              fontSize: 12,
              color: SLATE_600,
              letterSpacing: '-0.05px',
            }}
          >
            How we make our picks — and how they've played out.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: 'none',
          background: 'rgba(15, 23, 42, 0.05)',
          color: SLATE_900,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <X size={16} strokeWidth={2.4} />
      </button>
    </div>
  );
}

// ─── Tab strip ──────────────────────────────────────────────────────────────

function TabStrip({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <div
      style={{
        padding: '0 18px 14px',
        borderBottom: `1px solid ${SLATE_200}`,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          background: SLATE_50,
          borderRadius: 10,
          padding: 4,
          gap: 4,
        }}
      >
        {(
          [
            { key: 'how', label: 'How we pick' },
            { key: 'history', label: 'Picks history' },
          ] as Array<{ key: Tab; label: string }>
        ).map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onChange(t.key)}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 7,
                border: 'none',
                background: active ? '#fff' : 'transparent',
                color: active ? SLATE_900 : SLATE_500,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: active ? '0 1px 2px rgba(15,23,42,0.06)' : 'none',
                transition: 'all 150ms',
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── How-we-pick body ───────────────────────────────────────────────────────

interface AnalyseRow {
  icon: typeof TrendingUp;
  iconColor: string;
  iconBg: string;
  title: string;
  body: string;
}

const ANALYSE_ROWS: AnalyseRow[] = [
  { icon: TrendingUp, iconColor: AMBER, iconBg: AMBER_SOFT, title: 'Player form', body: 'Last 12 starts weighted by recency, finish quality, and field strength.' },
  { icon: Database, iconColor: GREEN_ACCENT, iconBg: 'rgba(16,185,129,0.10)', title: 'Course history', body: 'Past results at this venue and at courses with comparable profiles.' },
  { icon: Award, iconColor: AMBER, iconBg: AMBER_SOFT, title: 'Statistical fit', body: 'Strokes-gained categories matched to what the course actually rewards.' },
  { icon: Cpu, iconColor: GREEN_ACCENT, iconBg: 'rgba(16,185,129,0.10)', title: 'World ranking trajectory', body: 'Ranking direction over the past 12 weeks, not just the snapshot.' },
  { icon: Newspaper, iconColor: AMBER, iconBg: AMBER_SOFT, title: 'Real-time research', body: 'Late withdrawals, equipment changes, and reported injury status.' },
  { icon: Cloud, iconColor: GREEN_ACCENT, iconBg: 'rgba(16,185,129,0.10)', title: 'Course conditions', body: 'Wind, rain, and turf conditions that historically reshape the leaderboard.' },
];

function HowWePickBody({ trackRecord }: { trackRecord: { wins: number; topFives: number } }) {
  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '14px 16px 24px',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <LeadCard />
      <SectionLabel>What we analyse</SectionLabel>
      <div
        style={{
          background: '#ffffff',
          borderRadius: 14,
          border: `1px solid ${HAIRLINE}`,
          overflow: 'hidden',
        }}
      >
        {ANALYSE_ROWS.map((row, i) => (
          <AnalyseRowItem key={row.title} row={row} isLast={i === ANALYSE_ROWS.length - 1} />
        ))}
      </div>
      <SectionLabel>Receipts</SectionLabel>
      <BackedByResultsCard wins={trackRecord.wins} topFives={trackRecord.topFives} />
      <Footnote />
    </div>
  );
}

function LeadCard() {
  return (
    <div
      style={{
        background: SLATE_50,
        borderRadius: 14,
        padding: 14,
        border: `1px solid ${HAIRLINE}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span style={{ width: 6, height: 6, background: AMBER, borderRadius: '50%' }} />
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: AMBER }}>
          HOW IT WORKS
        </span>
      </div>
      <div style={{ fontSize: 13, color: SLATE_600, lineHeight: 1.55 }}>
        Each tournament we run a multi-model AI consensus across the field. The models
        weigh six independent factors, debate, and converge on three picks for the week.
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        margin: '20px 0 10px',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: SLATE_400,
      }}
    >
      {children}
    </div>
  );
}

function AnalyseRowItem({ row, isLast }: { row: AnalyseRow; isLast: boolean }) {
  const Icon = row.icon;
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        padding: '12px 14px',
        borderBottom: isLast ? 'none' : `1px solid ${HAIRLINE}`,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: row.iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={15} color={row.iconColor} strokeWidth={2.2} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: SLATE_900, letterSpacing: '-0.1px' }}>
          {row.title}
        </div>
        <div style={{ marginTop: 2, fontSize: 11.5, lineHeight: 1.45, color: SLATE_600 }}>
          {row.body}
        </div>
      </div>
    </div>
  );
}

function BackedByResultsCard({ wins, topFives }: { wins: number; topFives: number }) {
  const { data: tournaments = [] } = useIntelligenceHistoricalPicks();
  const totalResolved = tournaments.length;
  const hitRatePct = totalResolved > 0 ? Math.round((topFives / totalResolved) * 100) : 0;

  return (
    <div
      style={{
        background: AMBER_SOFT,
        borderRadius: 16,
        padding: '16px 16px 14px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <Award size={12} color={AMBER_DEEP} strokeWidth={2.5} />
        <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.14em', color: AMBER_DEEP }}>
          BACKED BY RESULTS
        </span>
      </div>
      <div
        style={{
          fontSize: 14,
          color: SLATE_900,
          fontWeight: 700,
          lineHeight: 1.3,
          letterSpacing: '-0.005em',
          marginBottom: 12,
        }}
      >
        We've called <span style={{ color: AMBER_DEEP }}>{wins} {wins === 1 ? 'winner' : 'winners'}</span> and{' '}
        <span style={{ color: AMBER_DEEP }}>{topFives} top-5{topFives === 1 ? '' : 's'}</span> this season.
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {[
          { value: wins, label: 'WINNERS\nCALLED' },
          { value: topFives, label: 'TOP-5\nFINISHES' },
          { value: `${hitRatePct}%`, label: 'TOP-5\nHIT RATE' },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              background: '#fff',
              borderRadius: 12,
              padding: '12px 6px',
              textAlign: 'center',
              boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
            }}
          >
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: AMBER_DEEP,
                letterSpacing: '-0.02em',
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {s.value}
            </div>
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: SLATE_500,
                marginTop: 6,
                lineHeight: 1.25,
                whiteSpace: 'pre-line',
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Footnote() {
  return (
    <p
      style={{
        margin: '20px 0 0',
        fontSize: 11,
        lineHeight: 1.5,
        color: SLATE_400,
        letterSpacing: '-0.02px',
        textAlign: 'center',
      }}
    >
      Picks are for entertainment and discussion. Past performance does not guarantee future results.
    </p>
  );
}

// ─── Picks history body ────────────────────────────────────────────────────

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type FilterKey = 'all' | 'wins' | 'top5' | 'misses';

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'wins', label: 'Wins' },
  { key: 'top5', label: 'Top-5s' },
  { key: 'misses', label: 'Misses' },
];

function formatDateRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const sameMonth = start.getMonth() === end.getMonth();
  if (sameMonth) {
    return `${MONTHS[start.getMonth()]} ${start.getDate()}–${end.getDate()}`;
  }
  return `${MONTHS[start.getMonth()]} ${start.getDate()}–${MONTHS[end.getMonth()]} ${end.getDate()}`;
}

function matchesFilter(outcome: IntelligenceOutcome, filter: FilterKey): boolean {
  if (filter === 'all') return true;
  if (filter === 'wins') return outcome === 'win';
  if (filter === 'top5') return outcome === 'win' || outcome === 'top5';
  if (filter === 'misses') return outcome === 'miss' || outcome === 'partial';
  return true;
}

function outcomeChipStyle(outcome: IntelligenceOutcome): { bg: string; fg: string; label: string; icon?: boolean } {
  switch (outcome) {
    case 'win':     return { bg: AMBER, fg: SLATE_900, label: 'WIN', icon: true };
    case 'top5':    return { bg: GREEN_ACCENT, fg: '#ffffff', label: 'TOP 5' };
    case 'partial': return { bg: 'rgba(16,185,129,0.85)', fg: '#ffffff', label: 'TOP 10' };
    case 'miss':    return { bg: 'rgba(15,23,42,0.55)', fg: '#ffffff', label: 'MISS' };
  }
}

function sortPicksByFinish<T extends { actualPosition: number | null }>(picks: T[]): T[] {
  return [...picks].sort((a, b) => {
    if (a.actualPosition === null && b.actualPosition === null) return 0;
    if (a.actualPosition === null) return 1;
    if (b.actualPosition === null) return -1;
    return a.actualPosition - b.actualPosition;
  });
}

function PicksHistoryBody({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterKey>('all');
  const { data: tournaments = [], isLoading } = useIntelligenceHistoricalPicks();

  const filtered = useMemo(
    () => tournaments.filter((t) => matchesFilter(t.outcome, filter)),
    [tournaments, filter],
  );

  const handleTournamentTap = (id: string) => {
    onClose();
    navigate(`/tourhub/tournament/${id}`);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Filter chips */}
      <div
        style={{
          padding: '12px 18px 10px',
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          flexShrink: 0,
        }}
      >
        {FILTERS.map((f) => {
          const active = f.key === filter;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              style={{
                padding: '6px 12px',
                borderRadius: 999,
                border: active ? `1px solid ${AMBER_DEEP}` : `1px solid ${SLATE_200}`,
                background: active ? 'rgba(184,95,0,0.08)' : '#ffffff',
                color: active ? AMBER_DEEP : SLATE_500,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '-0.05px',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '4px 18px 24px',
        }}
      >
        {isLoading ? (
          <SkeletonList />
        ) : tournaments.length === 0 ? (
          <EmptyState onClose={onClose} />
        ) : filtered.length === 0 ? (
          <NoMatchState />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map((t) => (
              <TournamentCard key={t.id} tournament={t} onTap={() => handleTournamentTap(t.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TournamentCard({
  tournament,
  onTap,
}: {
  tournament: IntelligenceHistoricalTournament;
  onTap: () => void;
}) {
  const chip = outcomeChipStyle(tournament.outcome);
  const dateRange = formatDateRange(tournament.startDate, tournament.endDate);
  const isWin = tournament.outcome === 'win';
  const isMajorTournament = tournament.isMajor;
  const sortedPicks = useMemo(() => sortPicksByFinish(tournament.picks), [tournament.picks]);

  const cardBorder = isMajorTournament
    ? '1.5px solid rgba(247,147,30,0.55)'
    : isWin
      ? '1.5px solid rgba(247,147,30,0.3)'
      : `1px solid ${SLATE_200}`;
  const cardShadow = isMajorTournament
    ? '0 4px 14px -6px rgba(247,147,30,0.18)'
    : isWin
      ? '0 4px 16px -4px rgba(247,147,30,0.15)'
      : '0 2px 8px -2px rgba(15,23,42,0.04)';

  return (
    <button
      type="button"
      onClick={onTap}
      style={{
        textAlign: 'left',
        width: '100%',
        padding: '14px 14px 12px',
        borderRadius: 14,
        border: cardBorder,
        background: '#ffffff',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        boxShadow: cardShadow,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: SLATE_900, letterSpacing: '-0.2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {tournament.name}
          </div>
          <div
            style={{
              marginTop: 2,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: SLATE_400,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {dateRange} · {tournament.tour}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 9.5,
              fontWeight: 800,
              letterSpacing: '0.1em',
              padding: '4px 9px',
              borderRadius: 6,
              background: chip.bg,
              color: chip.fg,
            }}
          >
            {chip.icon && <Trophy size={10} color={chip.fg} fill={chip.fg} />}
            {chip.label}
          </span>
          <ChevronRight size={16} color={SLATE_400} strokeWidth={2.2} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {sortedPicks.map((pick) => (
          <PickMiniRow
            key={pick.playerId || `${tournament.id}-${pick.rank}`}
            pick={pick}
          />
        ))}
      </div>
    </button>
  );
}

function PickMiniRow({
  pick,
}: {
  pick: {
    rank: 1 | 2 | 3;
    playerName: string;
    playerId: string;
    tourCode: string;
    finalPosition: string;
    actualPosition: number | null;
    status: string | null;
  };
}) {
  const isWinner = pick.actualPosition === 1;
  const isMissedCut = pick.status?.toLowerCase() === 'cut';
  const positionColor = isWinner ? AMBER : isMissedCut ? SLATE_500 : SLATE_900;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '6px 8px 6px 9px',
        borderRadius: 8,
        background: isWinner ? 'rgba(247,147,30,0.05)' : 'transparent',
        borderLeft: isWinner ? `3px solid ${AMBER}` : '3px solid transparent',
      }}
    >
      <PlayerAvatar
        playerId={pick.playerId}
        playerName={pick.playerName}
        tourCode={pick.tourCode}
        size="sm"
      />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: SLATE_900,
            letterSpacing: '-0.1px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {pick.playerName}
        </span>
        {isWinner && <Trophy size={13} color={AMBER} fill={AMBER} style={{ flexShrink: 0 }} />}
      </div>
      <span
        style={{
          flexShrink: 0,
          fontSize: 12,
          fontWeight: 800,
          color: positionColor,
          fontVariantNumeric: 'tabular-nums',
          minWidth: 28,
          textAlign: 'right',
        }}
      >
        {pick.finalPosition}
      </span>
    </div>
  );
}

function SkeletonList() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          style={{
            padding: 14,
            borderRadius: 14,
            border: `1px solid ${SLATE_200}`,
            background: '#ffffff',
          }}
        >
          <div style={{ height: 14, width: '60%', borderRadius: 4, background: SLATE_50 }} />
          <div style={{ marginTop: 6, height: 10, width: '35%', borderRadius: 4, background: SLATE_50 }} />
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from({ length: 3 }).map((__, j) => (
              <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '34%', background: SLATE_50, flexShrink: 0 }} />
                <div style={{ flex: 1, height: 12, borderRadius: 4, background: SLATE_50 }} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onClose }: { onClose: () => void }) {
  return (
    <div
      style={{
        padding: '40px 16px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'rgba(247,147,30,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Brain size={26} color={AMBER_DEEP} strokeWidth={2.8} style={{ display: 'block' }} />
      </div>
      <h3 style={{ margin: '16px 0 0', fontSize: 16, fontWeight: 800, color: SLATE_900, letterSpacing: '-0.2px' }}>
        No picks yet this season.
      </h3>
      <p style={{ margin: '6px 0 0', fontSize: 13, color: SLATE_500, maxWidth: 280, lineHeight: 1.4 }}>
        First picks drop with the next tournament.
      </p>
      <button
        type="button"
        onClick={onClose}
        style={{
          marginTop: 20,
          padding: '10px 18px',
          borderRadius: 10,
          border: `1px solid ${SLATE_200}`,
          background: '#ffffff',
          color: SLATE_900,
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Got it
      </button>
    </div>
  );
}

function NoMatchState() {
  return (
    <div
      style={{
        padding: '32px 16px',
        textAlign: 'center',
        color: SLATE_500,
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      No picks match this filter.
    </div>
  );
}
