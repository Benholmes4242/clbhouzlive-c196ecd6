/**
 * IntelligenceAllPicksSheet — Phase C
 *
 * Bottom sheet listing every PGA tournament where Intelligence had picks
 * this season, with all 3 picks per tournament + a final-outcome chip.
 * Filter chips (All / Wins / Top-5s / Misses) are client-side over the
 * loaded list. Tapping a tournament card closes the sheet then navigates
 * to the tournament detail page.
 *
 * Design contract:
 *   - Reuses canonical `BottomSheet` primitive (do not roll a new modal).
 *   - Sheet content renders against the platform's light surface
 *     (`bg-background`); no deep-purple inside the sheet.
 *   - Violet brain mark is the only purple accent (mirrors IntelligenceHero
 *     masthead). Outcome chips use semantic colours (amber win, slate misc).
 *
 * Empty state: pre-season (no picks yet) — intentional, friendly copy.
 * Loading state: 5 skeleton tournament cards.
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, X, ChevronRight, Trophy } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { PlayerAvatar } from './PlayerAvatar';
import {
  useIntelligenceHistoricalPicks,
  type IntelligenceHistoricalTournament,
  type IntelligenceOutcome,
} from '../hooks/useIntelligenceHistoricalPicks';

const AMBER_DEEP = '#B85F00';
const GREEN_ACCENT = '#2DBB78';
const AMBER = '#F7931E';
const SLATE_900 = '#0F172A';
const SLATE_500 = '#64748B';
const SLATE_400 = '#94A3B8';
const SLATE_200 = '#E2E8F0';
const SLATE_50 = '#F8FAFC';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

type FilterKey = 'all' | 'wins' | 'top5' | 'misses';

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: 'all',    label: 'All'      },
  { key: 'wins',   label: 'Wins'     },
  { key: 'top5',   label: 'Top-5s'   },
  { key: 'misses', label: 'Misses'   },
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

function outcomeChipStyle(outcome: IntelligenceOutcome): { bg: string; fg: string; label: string } {
  switch (outcome) {
    case 'win':     return { bg: 'rgba(247,147,30,0.12)', fg: AMBER,    label: 'WIN'    };
    case 'top5':    return { bg: 'rgba(15,23,42,0.06)',   fg: SLATE_900, label: 'TOP-5'  };
    case 'partial': return { bg: 'rgba(15,23,42,0.04)',   fg: SLATE_500, label: 'PARTIAL'};
    case 'miss':    return { bg: 'rgba(15,23,42,0.04)',   fg: SLATE_500, label: 'MISS'   };
  }
}

// Sort picks so the best actual finisher renders first; MC/WD/null sink to bottom.
function sortPicksByFinish<T extends { actualPosition: number | null }>(picks: T[]): T[] {
  return [...picks].sort((a, b) => {
    if (a.actualPosition === null && b.actualPosition === null) return 0;
    if (a.actualPosition === null) return 1;
    if (b.actualPosition === null) return -1;
    return a.actualPosition - b.actualPosition;
  });
}

export interface IntelligenceAllPicksSheetProps {
  open: boolean;
  onClose: () => void;
}

export function IntelligenceAllPicksSheet({ open, onClose }: IntelligenceAllPicksSheetProps) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterKey>('all');
  const { data: tournaments = [], isLoading } = useIntelligenceHistoricalPicks();

  const filtered = useMemo(
    () => tournaments.filter(t => matchesFilter(t.outcome, filter)),
    [tournaments, filter],
  );

  const handleTournamentTap = (id: string) => {
    // Snappy: navigate immediately, let the sheet animate close in the background.
    onClose();
    navigate(`/tourhub/tournament/${id}`);
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
      ariaLabelledBy="intelligence-all-picks-title"
    >
      {/* Header */}
      <div
        style={{
          padding: '4px 18px 14px',
          borderBottom: `1px solid ${SLATE_200}`,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'rgba(247,147,30,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Brain size={15} color={AMBER_DEEP} strokeWidth={2.8} style={{ display: 'block' }} />
            </div>
            <h2
              id="intelligence-all-picks-title"
              style={{
                margin: 0,
                fontSize: 17,
                fontWeight: 800,
                letterSpacing: '-0.3px',
                color: SLATE_900,
              }}
            >
              All Intelligence Picks
            </h2>
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
              background: SLATE_50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <X size={16} color={SLATE_500} strokeWidth={2.2} />
          </button>
        </div>
        <p
          style={{
            margin: '8px 0 0',
            fontSize: 12,
            color: SLATE_500,
            letterSpacing: '-0.05px',
          }}
        >
          Every Intelligence pick this season — wins, top-5s, and the misses too.
        </p>

        {/* Filter chips */}
        <div
          style={{
            marginTop: 14,
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            paddingBottom: 2,
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {FILTERS.map(f => {
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
      </div>

      {/* Scrollable body */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '14px 18px 24px',
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
            {filtered.map(t => (
              <TournamentCard key={t.id} tournament={t} onTap={() => handleTournamentTap(t.id)} />
            ))}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}

// ─── Tournament card ────────────────────────────────────────────────────────

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

  // Border + shadow precedence: MAJOR > WIN > default. Both major + win use
  // amber so no colour conflict — majors just look slightly more prominent.
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
      {/* Header row */}
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
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.1em',
              padding: '4px 8px',
              borderRadius: 6,
              background: chip.bg,
              color: chip.fg,
            }}
          >
            {chip.label}
          </span>
          <ChevronRight size={16} color={SLATE_400} strokeWidth={2.2} />
        </div>
      </div>

      {/* Picks rail (sorted by actual finish; MC/WD sink to bottom) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {sortedPicks.map(pick => (
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
  // Cut players have non-null positions in sr_leaderboards (status = 'CUT'),
  // so derive MC display from status — not from actualPosition === null.
  const isMissedCut = pick.status?.toLowerCase() === 'cut';

  // Layer 3: position colour coding — amber for winner, slate for MC/WD, ink otherwise.
  const positionColor = isWinner ? AMBER : isMissedCut ? SLATE_500 : SLATE_900;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '6px 8px 6px 9px',
        borderRadius: 8,
        // Layer 1: amber tint + 3px amber left border on winning row.
        // Transparent border on non-winners keeps row heights identical.
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
        {isWinner && (
          <Trophy size={13} color={AMBER} fill={AMBER} style={{ flexShrink: 0 }} />
        )}
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

// ─── States ─────────────────────────────────────────────────────────────────

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
          background: AMBER,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 18px rgba(247,147,30,0.35)',
        }}
      >
        <Brain size={26} color={AMBER_DEEP} strokeWidth={2.8} />
      </div>
      <h3
        style={{
          margin: '16px 0 0',
          fontSize: 16,
          fontWeight: 800,
          color: SLATE_900,
          letterSpacing: '-0.2px',
        }}
      >
        No picks yet this season.
      </h3>
      <p
        style={{
          margin: '6px 0 0',
          fontSize: 13,
          color: SLATE_500,
          maxWidth: 280,
          lineHeight: 1.4,
        }}
      >
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
