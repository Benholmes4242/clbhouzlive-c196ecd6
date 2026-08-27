import { FIELD_PAINT_CLASS, FIELD_PLACEHOLDER_CLASS } from '@/lib/tokens/field';
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
import { formatTournamentDateRange } from '@/i18n/format';
import { Search, X } from 'lucide-react';
import { useLiveTournaments } from '../hooks/useLiveTournaments';
import { useTourLeaderboard, useTourTeeTimesEnriched } from '../hooks/useTourHubData';
import { useTournamentMeta } from './useTournamentMeta';
import { BoardTable, todayFromEntry, type BoardEntry, type CutState } from './BoardTable';
import { ScorecardSheet, type ScorecardSheetTarget } from './ScorecardSheet';
import { EditorialEmpty } from '../components/EditorialEmpty';
import { tourPriorityIndex } from '../_shared/tourOrder';
import { resolveCutDisplay } from '../_shared/cutDisplay';
import { Skeleton } from '@/components/ui/skeleton';
import { A, LABEL, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { INK as TOUR_INK, INK_SOFT as TOUR_INK_SOFT, INK_FAINT as TOUR_INK_FAINT, SLATE_50 as TOUR_SLATE_50 } from '../_shared/tokens';



const F = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
// Dark ramp, imported so the board follows the tour token file (was four pinned light literals).
const INK = TOUR_INK;
const SECONDARY = TOUR_INK_SOFT;
const MUTED = TOUR_INK_FAINT;
const HAIRLINE = 'rgba(255,255,255,0.12)';
const SURFACE = TOUR_SLATE_50;
const STATUS_LIVE_GREEN = '#22C55E';

function fmtDateRange(start: string | null, end: string | null): string | null {
  return formatTournamentDateRange(start, end);
}

/**
 * Pill label for the event switcher. The h1 is the statement; the pills are a
 * control, and the active pill must not restate the headline word for word or
 * clip off the right edge. Deterministic stripping only — a trailing
 * " Championship" and any " presented by ..." clause. There is NO short-name
 * field on sr_tournaments and this deliberately invents no abbreviations.
 */
function shortEventName(name: string): string {
  const original = (name || '').trim();
  // The "presented/driven/sponsored by" clause never produces a stub, so it is
  // stripped unconditionally.
  const base = original.replace(/\s+(presented|driven|sponsored)\s+by\s+.*$/i, '').trim();
  const stripped = base.replace(/\s+Championship$/i, '').trim();
  if (!stripped) return base || original;
  // S3.1 — THE FLOOR. Dropping " Championship" from "FM Championship" leaves
  // "FM", which reads as a rendering fault rather than an event. Reject the
  // strip and keep the fuller name when the result is a single token or under
  // six characters.
  const tokens = stripped.split(/\s+/);
  if (tokens.length < 2 || stripped.length < 6) return base || original;
  return stripped;
}



/**
 * Live state marker. A 7px green dot + halo is a broadcast convention and
 * cannot be read as a score; the old filled green capsule could, because
 * green means under par two columns to the right on this very board.
 */
function LiveMarker({
  status,
  currentRound,
}: {
  status: string | null | undefined;
  currentRound: number | null | undefined;
}) {
  const { t } = useTranslation('tourhub');
  const s = (status || '').toLowerCase();
  const live = s === 'inprogress';
  const final = s === 'closed' || s === 'completed' || s === 'complete';
  const text = live
    ? t('tour.roundShort', { n: currentRound ?? 1 })
    : final
    ? t('tour.final')
    : t('tour.roundUpcoming', { n: currentRound ?? 1 });

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      {live && (
        <span
          aria-hidden
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: STATUS_LIVE_GREEN,
            boxShadow: `0 0 0 3px rgba(34,197,94,0.18)`,
            flexShrink: 0,
          }}
        />
      )}
      <span style={{ ...LABEL, color: live ? A.INK : A.DIM }}>{text}</span>
    </span>
  );
}

/** Minimum completed rounds before a field average means anything. */
const FIELD_GATE = 20;

interface FieldAverage { avg: number; count: number }

/**
 * Average round-to-par across players who have COMPLETED the given round,
 * from the entries already loaded. No new query. Null below the gate.
 */
function fieldAverageToday(
  entries: BoardEntry[],
  round: number | null | undefined,
): FieldAverage | null {
  if (round == null || round < 1 || round > 4) return null;
  let sum = 0;
  let count = 0;
  for (const e of entries) {
    const v = [e.round_1, e.round_2, e.round_3, e.round_4][round - 1];
    if (v == null) continue;
    if (e.thru != null && e.thru < 18) continue;
    sum += v;
    count += 1;
  }
  if (count < FIELD_GATE) return null;
  return { avg: sum / count, count };
}

function fmtAvgToPar(v: number): string {
  const r = Math.round(v * 10) / 10;
  if (r > 0) return `+${r.toFixed(1)}`;
  if (r < 0) return `\u2212${Math.abs(r).toFixed(1)}`;
  return 'E';
}

function StatCell({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div style={{ textAlign: 'center', minWidth: 0 }}>
      <div style={{ ...LABEL }}>{label}</div>
      <div
        style={{
          marginTop: 7,
          fontFamily: F,
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: '-0.025em',
          color: A.INK,
          ...FIGS,
        }}
      >
        {value}
      </div>
      {sub && <div style={{ ...LABEL, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

/** Only mounted when a field average exists, so the effect is the evidence. */
function FieldTodayStat({
  label,
  field,
  subLabel,
  tournamentId,
  round,
}: {
  label: string;
  field: FieldAverage;
  subLabel: string;
  tournamentId: string;
  round: number | null;
}) {
  useEffect(() => {
    analyticsEvents.track('tour_field_average_shown', {
      tournament_id: tournamentId,
      round,
      completed_count: field.count,
    });
  }, [tournamentId, round, field.count]);

  return <StatCell label={label} value={fmtAvgToPar(field.avg)} sub={subLabel} />;
}



export function LeaderboardTab() {
  const { t } = useTranslation('tourhub');
  const [searchParams, setSearchParams] = useSearchParams();
  const eventParam = searchParams.get('event');

  const { data: rawLive = [], isLoading: liveLoading, isError: liveError, refetch: refetchLive } = useLiveTournaments();
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
  const { data: boardRaw, isLoading: boardLoading, isError: boardError, refetch: refetchBoard } = useTourLeaderboard(selected?.id ?? '');

  // PRE-TOURNAMENT ONLY: the board carries no tee time, so R1 tee times come
  // from the EXISTING enriched tee-times hook. Passing '' keeps the query
  // disabled the moment anyone has posted a score, so live boards are unchanged.
  const preTournament =
    (boardRaw ?? []).length > 0 &&
    (boardRaw ?? []).every(
      (e: BoardEntry) =>
        e.score == null &&
        e.position == null &&
        e.round_1 == null &&
        e.round_2 == null &&
        e.round_3 == null &&
        e.round_4 == null,
    );
  const { data: teeTimeRows } = useTourTeeTimesEnriched(preTournament ? selected?.id ?? '' : '', 1);
  const teeTimes = useMemo(() => {
    const map: Record<string, string> = {};
    for (const g of (teeTimeRows ?? []) as any[]) {
      const label = g.tee_time
        ? new Date(g.tee_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
        : '';
      for (const p of g.players ?? []) {
        const id = p.player?.id;
        if (id && label) map[id] = label;
      }
    }
    return map;
  }, [teeTimeRows]);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  if (liveLoading && liveTournaments.length === 0) {
    return <LeaderboardSkeleton variant="page" />;
  }

  if (!selected) {
    if (liveError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, paddingTop: 32 }}>
          <EditorialEmpty
            tint="slate"
            eyebrow={t('empty.leaderboard.error.eyebrow')}
            title={t('empty.leaderboard.error.title')}
            body={t('empty.leaderboard.error.body')}
          />
          <button
            type="button"
            onClick={() => refetchLive()}
            style={{ background: INK, color: TOUR_SLATE_50, border: 'none', borderRadius: 999, padding: '10px 20px', fontFamily: F, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}
          >
            {t('board.retry')}
          </button>
        </div>
      );
    }
    return (
      <EditorialEmpty
        tint="slate"
        eyebrow={t('empty.leaderboard.noLive.eyebrow')}
        title={t('empty.leaderboard.noLive.title')}
        body={t('empty.leaderboard.noLive.body')}
      />
    );
  }

  const boardEntries: BoardEntry[] = boardRaw ?? [];
  const filteredEntries = searchQuery.trim()
    ? boardEntries.filter((e) =>
        (e.player?.full_name ?? '')
          .toLowerCase()
          .includes(searchQuery.trim().toLowerCase()),
      )
    : boardEntries;

  const metaStatus = (meta?.status ?? selected.status ?? '').toLowerCase();
  const currentRound = meta?.current_round ?? selected.currentRound ?? null;
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

  // Shared guard: projected_cutline is never shown once current_round > cut_round.
  const cutDisplay = resolveCutDisplay({
    status: metaStatus,
    currentRound,
    cutRound,
    cutline,
    projectedCutline,
  });
  const cutState: CutState =
    cutDisplay.kind === 'actual'
      ? { kind: 'actual', cutline: cutDisplay.cutline as number, extraCount }
      : cutDisplay.kind === 'projected'
        ? { kind: 'projected', cutline: cutDisplay.cutline as number, extraCount: 0 }
        : { kind: 'none', cutline: null, extraCount: 0 };

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
  // Field average today — computed from the entries already loaded, gated at
  // FIELD_GATE completed rounds. Absent below the gate (no provisional figure).
  const fieldRound = isLive ? currentRound : cutHasHappened ? currentRound : null;
  const field = fieldAverageToday(boardEntries, fieldRound);

  // Column header is owned by BoardTable now (ONE grid definition).


  // Footnote: our thru column stores 0-18 integers only; no back-nine marker
  // is encoded. Render only the 'F Finished' clause.
  const footnote = t('board.footnote');


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
        {/* LINE ONE - title, live round, search. Broadcast strip: the round
            marker sits immediately right of the title. */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <h1
            style={{
              margin: 0,
              flex: 1,
              minWidth: 0,
              fontFamily: F,
              fontSize: 22,
              fontWeight: 700,
              color: A.INK,
              letterSpacing: '-0.02em',
              lineHeight: 1.12,
            }}
          >
            {meta?.name ?? selected.name}
          </h1>

          {(metaStatus || currentRound != null) && (
            <span style={{ flex: 'none' }}>
              <LiveMarker status={metaStatus} currentRound={currentRound} />
            </span>
          )}


          <button
            type="button"
            onClick={() => {
              if (searchOpen) {
                setSearchQuery('');
                setSearchOpen(false);
              } else {
                setSearchOpen(true);
              }
            }}
            aria-label={searchOpen ? t('board.search.closeAria') : t('board.search.openAria')}
            style={{
              flex: 'none',
              background: 'none',
              border: 'none',
              padding: 4,
              cursor: 'pointer',
              display: 'flex',
            }}

          >
            {searchOpen ? (
              <X size={16} color={INK} strokeWidth={2.5} />
            ) : (
              <Search size={16} color={INK} strokeWidth={2.5} />
            )}
          </button>
        </div>

        {/* META LINE - one broadcast line, dot separated, MUTE ink, tabular.
            ORDERING IS LOAD-BEARING: par and yards ALWAYS precede the field
            average. The deleted stat tile used a FIXED grid rather than
            space-around so PAR could not move horizontally between a
            two-stat and a three-stat event one pill-tap apart; the same
            hazard exists here because the field average appears and
            disappears through the day. Keeping the volatile segment LAST
            means nothing after it can shift.
            These figures are NOT scores: they take MUTE ink, never a score
            colour. */}
        {metaSegments.length > 0 && (
          <div
            style={{
              marginTop: 5,
              fontFamily: F,
              fontSize: 12.5,
              fontWeight: 500,
              color: A.MUTE,
              ...FIGS,
            }}
          >
            {metaSegments.join(' \u00B7 ')}
          </div>
        )}


        {/* SEARCH - its own full-width row; the masthead stays legible. */}
        {/* FIELD CANON paint + focus step. RADIUS EXCEPTION (8): compact
            masthead control row, sized off the chips beside it, not 14.
            HEIGHT EXCEPTION (~28px, padding-derived) for the same reason. */}
        {searchOpen && (
          <div
            className={FIELD_PAINT_CLASS}
            style={{
              marginTop: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              borderRadius: 8,
              padding: '5px 8px',
            }}
          >
            <Search size={13} color={MUTED} strokeWidth={2.5} />
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('board.search.placeholder')}
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
              className={FIELD_PLACEHOLDER_CLASS}
            />
          </div>
        )}

        {/* The bordered par/yards stat tile and the separate round/date meta
            row are deleted: the round moved onto line one and the figures
            onto the meta line above. Dates dropped from the masthead - a
            live board tells you it is live; they remain on the tournament
            page and the schedule. To restore, append `dates` to
            metaSegments. */}



      </div>

      {/* EVENT TABS — pill treatment, matching every other scope control. */}
      {showTabs && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            overflowX: 'auto',
            padding: '4px 16px 12px',
            background: SURFACE,
          }}
        >
          {liveTournaments.map((tt) => {
            const active = tt.id === selected.id;
            return (
              <button
                key={tt.id}
                type="button"
                onClick={() => onSelectEvent(tt.id)}
                style={{
                  flexShrink: 0,
                  background: active ? A.INK : A.PANEL,
                  border: active ? '1px solid transparent' : `1px solid ${A.BORDER}`,
                  borderRadius: 999,
                  padding: '9px 15px',
                  cursor: 'pointer',
                  fontFamily: F,
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: active ? A.CANVAS : A.MUTE,
                  // 2.9 — a pill never runs off screen. The full event name is
                  // the page title directly above, so one line + ellipsis here.
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: 190,
                }}
                aria-pressed={active}
                aria-label={tt.name}
              >
                {shortEventName(tt.name)}
              </button>
            );
          })}
        </div>
      )}


      {/* COLUMN HEADER — rendered by BoardTable itself, sticky under the
          TourPageShell header, so header and rows share ONE grid definition. */}



      {/* BOARD */}
      {boardLoading && filteredEntries.length === 0 ? (
        <LeaderboardSkeleton />
      ) : boardError ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '32px 16px' }}>
          <EditorialEmpty
            tint="slate"
            eyebrow={t('empty.leaderboard.error.eyebrow')}
            title={t('empty.leaderboard.error.title')}
            body={t('empty.leaderboard.error.body')}
          />
          <button
            type="button"
            onClick={() => refetchBoard()}
            style={{ background: INK, color: TOUR_SLATE_50, border: 'none', borderRadius: 999, padding: '10px 20px', fontFamily: F, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}
          >
            {t('board.retry')}
          </button>
        </div>
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
          headerTop={'var(--tour-header-h, 0px)'}
          surface={SURFACE}
          teeTimes={teeTimes}
          onRowClick={(row) => {
            if (!row.player?.id) return;
            setSheetTarget({
              playerId: row.player.id,
              playerName: row.player.full_name || t('board.unknownPlayer'),
              countryCode: row.player.country_code ?? row.player.country ?? null,
              position: row.position,
              positionTied: row.position_tied ?? false,
              total: row.score,
              today: todayFromEntry(row, currentRound),
              thru: row.thru,
              status: row.status ?? null,
              playerPhotoUrl: row.player?.photo_url ?? null,
            });
          }}
        />
      )}

      {/* MOVEMENT LEGEND — the triangles have no per-row label. */}
      <div
        style={{
          ...LABEL,
          color: A.INK,
          textAlign: 'center',
          padding: '14px 16px 0',
        }}
      >
        {t('tour.movementLegend')}
      </div>

      {/* FOOTNOTE */}
      <div
        style={{
          padding: '10px 16px 16px',
          fontFamily: F,
          // READ 11: the footnote is a sentence, not a coordinate.
          fontSize: 11,
          color: MUTED,
          textAlign: 'center',
          ...FIGS,
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

function LeaderboardSkeleton({ variant = 'board' }: { variant?: 'page' | 'board' }) {
  const rows = (
    <div style={{ padding: '4px 16px 12px' }}>
      {[...Array(8)].map((_, i) => (
        <Skeleton
          key={i}
          style={{
            height: 42,
            width: '100%',
            borderRadius: 0,
            marginBottom: 1,
          }}
        />
      ))}
    </div>
  );

  if (variant === 'board') return rows;

  // 'page': initial load before any event is selected — header block + column
  // strip above the rows. NO safe-area clearance: TourPageShell owns the inset
  // (TourPageShell.tsx:147 paddingTop, :149 minHeight) and its header is in
  // normal flow, so paying it here would double the band. The skeleton must not
  // reproduce it.
  return (
    <div style={{ background: SURFACE, minHeight: '100dvh' }}>
      <div style={{ padding: '12px 16px 8px' }}>
        <Skeleton style={{ height: 10, width: 80, marginBottom: 10 }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Skeleton style={{ height: 20, width: '55%' }} />
          <Skeleton style={{ height: 20, width: 68, borderRadius: 999 }} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderTop: `1px solid ${HAIRLINE}`, borderBottom: `1px solid ${HAIRLINE}` }}>
        <Skeleton style={{ height: 10, width: 30 }} />
        <Skeleton style={{ height: 10, flex: 1 }} />
        <Skeleton style={{ height: 10, width: 34 }} />
        <Skeleton style={{ height: 10, width: 34 }} />
        <Skeleton style={{ height: 10, width: 34 }} />
      </div>
      {rows}
    </div>
  );
}

export default LeaderboardTab;

