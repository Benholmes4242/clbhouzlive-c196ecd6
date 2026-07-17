/**
 * LeaderboardTab — Tour Book design (v1).
 *
 * Ports selection model / ?event= param / search behavior from the
 * legacy LiveLeaderboardTab, but rebuilds the visual shell against
 * the approved Tour Book mockup. Not yet registered — L3 does the
 * cutover.
 *
/**
 * Score colours resolved via the canonical getScoreColor (red under par,
 * ink over par, muted-gray even). See BoardTable for the movement column.
 */


import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { formatMonthDay, formatTournamentDateRange } from '@/i18n/format';
import { Search, X } from 'lucide-react';
import { useLiveTournaments } from '../hooks/useLiveTournaments';
import { useTourLeaderboard } from '../hooks/useTourHubData';
import { useTournamentMeta } from './useTournamentMeta';
import { BoardTable, type BoardEntry, type CutState } from './BoardTable';
import { ScorecardSheet, type ScorecardSheetTarget } from './ScorecardSheet';
import { EditorialEmpty } from '../components/EditorialEmpty';
import { tourPriorityIndex } from '../_shared/tourOrder';

const F = 'Geist, system-ui, sans-serif';
const INK = '#0F172A';
const SECONDARY = '#4B5563';
const MUTED = '#94A3B8';
const HAIRLINE = 'rgba(0,0,0,0.08)';
const SURFACE = '#F8FAFC';
const STATUS_LIVE_GREEN = '#22C55E';

function fmtDateRange(start: string | null, end: string | null): string | null {
  return formatTournamentDateRange(start, end);
}


function StatusChip({
  status,
  currentRound,
  startDate,
}: {
  status: string | null | undefined;
  currentRound: number | null | undefined;
  startDate: string | null | undefined;
}) {
  const { t } = useTranslation('tourhub');
  const s = (status || '').toLowerCase();
  if (s === 'inprogress') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: STATUS_LIVE_GREEN,
          color: '#fff',
          fontFamily: F,
          fontSize: 9.5,
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          padding: '4px 8px',
          borderRadius: 4,
        }}
      >
        <span
          aria-hidden
          style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }}
        />
        {t('board.status.inProgress', { round: currentRound ?? 1 })}
      </span>
    );
  }
  if (s === 'closed' || s === 'completed' || s === 'complete') {
    return (
      <span
        style={{
          background: INK,
          color: '#fff',
          fontFamily: F,
          fontSize: 9.5,
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          padding: '4px 8px',
          borderRadius: 4,
        }}
      >
        {t('board.status.final')}
      </span>
    );
  }
  const startTxt = startDate ? formatMonthDay(new Date(startDate)).toUpperCase() : '';
  return (
    <span
      style={{
        background: '#E5E7EB',
        color: INK,
        fontFamily: F,
        fontSize: 9.5,
        fontWeight: 800,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        padding: '4px 8px',
        borderRadius: 4,
      }}
    >
      {startTxt ? t('board.status.startsOn', { date: startTxt }) : t('board.status.upcoming')}
    </span>
  );
}


export function LeaderboardTab() {
  const { t } = useTranslation('tourhub');
  const [searchParams, setSearchParams] = useSearchParams();
  const eventParam = searchParams.get('event');

  const { data: rawLive = [], isLoading: liveLoading } = useLiveTournaments();
  const [selectedId, setSelectedId] = useState<string | null>(eventParam);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [sheetTarget, setSheetTarget] = useState<ScorecardSheetTarget | null>(null);

  const liveTournaments = useMemo(() => {
    return [...rawLive].sort((a, b) => {
      const ai = tourPriorityIndex(a.tourSlug);
      const bi = tourPriorityIndex(b.tourSlug);
      if (ai !== bi) return ai - bi;
      return (b.purse ?? 0) - (a.purse ?? 0);
    });
  }, [rawLive]);

  useEffect(() => {
    if (liveTournaments.length === 0) return;
    if (eventParam && liveTournaments.find((t) => t.id === eventParam)) {
      setSelectedId(eventParam);
      return;
    }
    if (!selectedId || !liveTournaments.find((t) => t.id === selectedId)) {
      setSelectedId(liveTournaments[0].id);
    }
  }, [liveTournaments, eventParam]); // eslint-disable-line react-hooks/exhaustive-deps

  const selected = useMemo(
    () => liveTournaments.find((t) => t.id === selectedId) ?? liveTournaments[0] ?? null,
    [liveTournaments, selectedId],
  );

  const { data: meta } = useTournamentMeta(selected?.id ?? null);
  const { data: boardRaw, isLoading: boardLoading } = useTourLeaderboard(selected?.id ?? '');

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  if (liveLoading && liveTournaments.length === 0) {
    return <LeaderboardSkeleton />;
  }
  if (!selected) {
    return (
      <EditorialEmpty
        tint="slate"
        eyebrow={t('empty.leaderboard.noLive.eyebrow')}
        title={t('empty.leaderboard.noLive.title')}
        body={t('empty.leaderboard.noLive.body')}
      />
    );
  }

  const boardEntries: BoardEntry[] = (boardRaw as any[] | undefined) ?? [];
  const filteredEntries = searchQuery.trim()
    ? boardEntries.filter((e) =>
        (e.player?.full_name ?? '')
          .toLowerCase()
          .includes(searchQuery.trim().toLowerCase()),
      )
    : boardEntries;

  const metaStatus = (meta?.status ?? selected.status ?? '').toLowerCase();
  const currentRound = meta?.current_round ?? (selected as any).current_round ?? null;
  const cutRound = meta?.cut_round ?? null;
  const cutline = meta?.cutline ?? null;
  const projectedCutline = meta?.projected_cutline ?? null;
  const isLive = metaStatus === 'inprogress';

  const cutHasHappened =
    (cutRound != null && currentRound != null && currentRound > cutRound) ||
    metaStatus === 'closed' ||
    metaStatus === 'completed' ||
    metaStatus === 'complete';

  const extraCount = (() => {
    // Count of demoted rows (CUT/MC/WD/DQ) — used for "+N" in the sentence.
    const s = (x?: string | null) => (x || '').toUpperCase();
    return boardEntries.filter((e) => {
      const u = s(e.status);
      return u === 'CUT' || u === 'MC' || u === 'MDF';
    }).length;
  })();

  let cutState: CutState = { kind: 'none', cutline: null, extraCount: 0 };
  if (cutHasHappened && cutline != null) {
    cutState = { kind: 'actual', cutline, extraCount };
  } else if (isLive && projectedCutline != null) {
    cutState = { kind: 'projected', cutline: projectedCutline, extraCount: 0 };
  }

  const venueLine = [
    meta?.venue_name ?? selected.venue_name,
    [meta?.venue_city ?? selected.venue_city, meta?.venue_country ?? selected.venue_country]
      .filter(Boolean)
      .join(', ') || null,
  ]
    .filter(Boolean)
    .join(' \u00B7 ');

  const par = meta?.venue_par ?? selected.venue_par;
  const yardage = meta?.venue_yardage ?? selected.venue_yardage;
  const dates = fmtDateRange(
    meta?.start_date ?? selected.start_date,
    meta?.end_date ?? selected.end_date,
  );
  const metaBits = [par != null ? `Par ${par}` : null, yardage != null ? `${yardage} yards` : null, dates]
    .filter(Boolean)
    .join(' \u00B7 ');

  // Footnote: our thru column stores 0-18 integers only; no back-nine marker
  // is encoded. Render only the 'F Finished' clause.
  const footnote = 'F Finished';

  const showTabs = liveTournaments.length > 1;

  const onSelectEvent = (id: string) => {
    setSelectedId(id);
    const params = new URLSearchParams(searchParams);
    params.set('event', id);
    setSearchParams(params, { replace: true });
  };

  return (
    <div style={{ background: SURFACE, minHeight: '60vh', fontFamily: F }}>
      {/* MASTHEAD */}
      <div style={{ padding: '16px 16px 12px', background: SURFACE }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <StatusChip
            status={metaStatus}
            currentRound={currentRound}
            startDate={meta?.start_date ?? selected.start_date}
          />
          {searchOpen ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                flex: 1,
                marginLeft: 10,
                background: '#F1F5F9',
                border: `1px solid ${HAIRLINE}`,
                borderRadius: 8,
                padding: '5px 8px',
              }}
            >
              <Search size={13} color={MUTED} strokeWidth={2.5} />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search players"
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontFamily: F,
                  fontSize: 12.5,
                  color: INK,
                  minWidth: 0,
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchOpen(false);
                }}
                aria-label="Close search"
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}
              >
                <X size={13} color={MUTED} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search players"
              style={{
                background: 'none',
                border: 'none',
                padding: 4,
                cursor: 'pointer',
                display: 'flex',
              }}
            >
              <Search size={16} color={INK} strokeWidth={2.5} />
            </button>
          )}
        </div>

        <h1
          style={{
            margin: '12px 0 0',
            fontFamily: F,
            fontSize: 17,
            fontWeight: 800,
            color: INK,
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
          }}
        >
          {meta?.name ?? selected.name}
        </h1>
        {venueLine && (
          <div
            style={{
              marginTop: 4,
              fontFamily: F,
              fontSize: 11,
              fontWeight: 500,
              color: SECONDARY,
            }}
          >
            {venueLine}
          </div>
        )}
        {metaBits && (
          <div
            style={{
              marginTop: 2,
              fontFamily: F,
              fontSize: 10.5,
              color: MUTED,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {metaBits}
          </div>
        )}
      </div>

      {/* EVENT TABS */}
      {showTabs && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            overflowX: 'auto',
            padding: '2px 16px 0',
            borderBottom: `1px solid ${HAIRLINE}`,
            background: SURFACE,
          }}
        >
          {liveTournaments.map((t, i) => {
            const active = t.id === selected.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelectEvent(t.id)}
                style={{
                  position: 'relative',
                  background: 'none',
                  border: 'none',
                  padding: '10px 0',
                  cursor: 'pointer',
                  fontFamily: F,
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: active ? INK : MUTED,
                  borderBottom: active ? `2px solid ${INK}` : '2px solid transparent',
                  whiteSpace: 'nowrap',
                }}
                aria-pressed={active}
              >
                {t.name}
              </button>
            );
          })}
        </div>
      )}

      {/* COLUMN HEADER (sticky) */}
      <div
        style={{
          position: 'sticky',
          top: 'var(--sat, 0px)',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          padding: '8px 16px',
          background: SURFACE,
          borderBottom: `1px solid ${HAIRLINE}`,
          borderTop: showTabs ? 'none' : `1px solid ${HAIRLINE}`,
          fontFamily: F,
          fontSize: 8,
          fontWeight: 800,
          letterSpacing: '0.08em',
          color: SECONDARY,
          textTransform: 'uppercase',
        }}
      >
        <div style={{ width: 52, flexShrink: 0 }}>POS</div>
        <div style={{ flex: 1, minWidth: 0 }}>PLAYER</div>
        <div style={{ width: 44, flexShrink: 0, textAlign: 'center' }}>TOT</div>
        <div style={{ width: 44, flexShrink: 0, textAlign: 'center' }}>THRU</div>
        <div style={{ width: 44, flexShrink: 0, textAlign: 'center' }}>TODAY</div>
      </div>

      {/* BOARD */}
      {boardLoading && filteredEntries.length === 0 ? (
        <LeaderboardSkeleton />
      ) : filteredEntries.length === 0 ? (
        <EditorialEmpty
          tint="slate"
          eyebrow={t('empty.leaderboard.noPlayersMatch.eyebrow')}
          title={searchQuery.trim() ? t('empty.leaderboard.noPlayersMatch.title') : t('empty.leaderboard.notPosted.title')}
          body={
            searchQuery.trim()
              ? t('empty.leaderboard.noPlayersMatch.body')
              : t('empty.leaderboard.notPosted.body')
          }
        />

      ) : (
        <BoardTable
          entries={filteredEntries}
          cutState={cutState}
          currentRound={currentRound}
          onRowClick={(row) => {
            if (!row.player?.id) return;
            setSheetTarget({
              playerId: row.player.id,
              playerName: row.player.full_name || 'Unknown',
              countryCode: row.player.country_code ?? row.player.country ?? null,
              position: row.position,
              positionTied: row.position_tied ?? false,
              total: row.score,
              today:
                row.today != null
                  ? row.today
                  : (() => {
                      const rs = [row.round_1, row.round_2, row.round_3, row.round_4].filter(
                        (r) => r != null,
                      );
                      return rs.length ? (rs[rs.length - 1] as number) : null;
                    })(),
              thru: row.thru,
              status: row.status ?? null,
            });
          }}
        />
      )}

      {/* FOOTNOTE */}
      <div
        style={{
          padding: '12px 16px 16px',
          fontFamily: F,
          fontSize: 8.5,
          color: MUTED,
        }}
      >
        {footnote}
      </div>

      <ScorecardSheet
        open={sheetTarget != null}
        onClose={() => setSheetTarget(null)}
        tournamentId={selected?.id ?? null}
        target={sheetTarget}
      />
    </div>
  );
}

function LeaderboardSkeleton() {
  return (
    <div style={{ padding: '12px 16px' }}>
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="animate-pulse"
          style={{
            height: 42,
            background: '#F1F5F9',
            borderBottom: `1px solid ${HAIRLINE}`,
            marginBottom: 1,
          }}
        />
      ))}
    </div>
  );
}

export default LeaderboardTab;
