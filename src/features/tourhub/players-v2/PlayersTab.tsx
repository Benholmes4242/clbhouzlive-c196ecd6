/**
 * players-v2/PlayersTab - "The Field" - one shared ledger row, a two-figure
 * field band, a column header, and an honest sample-size caption.
 *
 * Wiring:
 *   - Tour: LOCAL lens (per-section by design; NOT TourSelectionContext).
 *     ?tour= honored once on mount; ?sort= honored for old inbound links.
 *   - Data: usePlayersRanking(tour) + useLivePlayerIds() + useLiveTournaments()
 *     + useWorldRankLookup(loaded ids).
 *   - Editorial line: derived from the live/next tournament for the tour;
 *     self-hides when nothing to say.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { TourHubEmptyState } from '../components/TourHubEmptyState';
import { SectionTourLens } from '../overview/sections/SectionTourLens';
import { TOUR_CONFIG, type TourId } from '../hooks/useOverviewData';
import { analyticsEvents } from '@/utils/analyticsEvents';

import { useLiveTournaments } from '../hooks/useLiveTournaments';
import {
  AMBER_DEEP,
  FONT,
  HAIRLINE_INK_10,
  INK,
  INK_MUTE,
  SLATE_50,
} from '../_shared/tokens';
import { getScoreColor } from '../_shared/scoreColor';
import { MovementFigure } from '../_shared/movement';
import { fmtScore } from '../utils/fmtScore';

import { usePlayersRanking, type RankedRow, type PlayersTourId } from './data/usePlayersRanking';
import { useLivePlayerIds } from './data/useLivePlayerIds';
import { useWorldRankLookup } from './data/useWorldRankLookup';
import { RankedPlayerRow, RankedPlayerHeader } from './RankedPlayerRow';
import { formatWeekdayLong, formatNumberMaxFrac } from '@/i18n/format';

type SortKey = 'ranking' | 'live';

const SEP = ' . ';

function useDebouncedValue<T>(v: T, ms: number): T {
  const [x, setX] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setX(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return x;
}

function formatDayShort(d: string | null | undefined): string | null {
  if (!d) return null;
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  return formatWeekdayLong(dt);
}

/** Field band figure - label above figure, centred. */
function FieldFigure({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string | null;
}) {
  return (
    <div style={{ textAlign: 'center', minWidth: 0 }}>
      <div
        style={{
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: '0.13em',
          textTransform: 'uppercase',
          color: 'rgba(15,23,42,0.45)',
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 3,
          fontSize: 22,
          fontWeight: 200,
          color: INK,
          fontVariantNumeric: 'tabular-nums lining',
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            marginTop: 2,
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '0.13em',
            textTransform: 'uppercase',
            color: INK_MUTE,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

export function PlayersTab() {
  const { t } = useTranslation('tourhub');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // -- Per-section tour lens (local state, NO All Tours, PGA default).
  // ?tour= is honored once on mount for deep-link parity.
  const inboundTour = searchParams.get('tour');
  const initialTour: PlayersTourId =
    inboundTour && inboundTour in TOUR_CONFIG && inboundTour !== 'champ'
      ? (inboundTour as PlayersTourId)
      : 'pga';
  const [activeTour, setActiveTour] = useState<PlayersTourId>(initialTour);

  // -- Sort (honor inbound ?sort=)
  const inboundSort = searchParams.get('sort');
  const [sort, setSortState] = useState<SortKey>(
    inboundSort === 'live' || inboundSort === 'playing-now' ? 'live' : 'ranking',
  );
  const sortRef = useRef<SortKey>(sort);
  sortRef.current = sort;
  const setSort = useCallback(
    (next: SortKey) => {
      const from = sortRef.current;
      setSortState(next);
      if (from !== next) {
        analyticsEvents.track('tour_players_sort_changed', { from, to: next, tour: activeTour });
      }
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          p.set('sort', next);
          p.set('tab', 'players');
          return p;
        },
        { replace: true },
      );
    },
    [setSearchParams, activeTour],
  );

  // -- Search
  const [search, setSearch] = useState('');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 200);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (searchExpanded) searchInputRef.current?.focus();
  }, [searchExpanded]);

  // -- Data
  const { data: ranking, isLoading: rankingLoading, isError: rankingError, refetch: refetchRanking } = usePlayersRanking(activeTour);
  const { data: liveMap } = useLivePlayerIds();
  const { data: liveTournaments } = useLiveTournaments();
  const loadedIds = useMemo(
    () => (ranking?.rows ?? []).map((r) => r.playerId).filter(Boolean),
    [ranking?.rows],
  );
  const { data: worldRanks } = useWorldRankLookup(loadedIds);

  // -- Editorial line (live leader -> then upcoming day)
  const editorial = useMemo<string | null>(() => {
    const tours = (liveTournaments ?? []).filter((t) => t.tourSlug === activeTour);
    if (!tours.length) return null;
    const live = tours.find((t) => t.status === 'inprogress');
    if (live) {
      // Find leader among liveMap rows belonging to this tournament.
      const leaders = Object.values(liveMap ?? {})
        .filter((info) => info.tournamentId === live.id && info.position === 1)
        .slice(0, 1);
      const leader = leaders[0];
      const leaderRow = leader
        ? (ranking?.rows ?? []).find(
            (r) => (liveMap ?? {})[r.playerId]?.tournamentId === live.id && (liveMap ?? {})[r.playerId]?.position === 1,
          )
        : null;
      if (leaderRow && leader?.score != null) {
        return t('players.editorial.leaderAt', {
          tournament: live.name.toUpperCase(),
          leader: leaderRow.name.toUpperCase(),
          score: fmtScore(leader.score),
        });
      }
      return live.name.toUpperCase();
    }
    const soon = tours[0];
    const day = formatDayShort(soon.start_date);
    return day
      ? t('players.editorial.startsOn', {
          tournament: soon.name.toUpperCase(),
          day: day.toUpperCase(),
        })
      : null;
  }, [liveTournaments, activeTour, liveMap, ranking?.rows, t]);

  // -- Rows: filter by search
  const filteredRows = useMemo<RankedRow[]>(() => {
    const rows = ranking?.rows ?? [];
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(q));
  }, [ranking?.rows, debouncedSearch]);

  // -- Live count from the current filtered view (tour + search)
  const liveCount = useMemo(
    () => filteredRows.filter((r) => (liveMap ?? {})[r.playerId]).length,
    [filteredRows, liveMap],
  );

  // -- Sort options: hide "Playing now" when nobody is live
  const sortOptions = useMemo<SortKey[]>(
    () => (liveCount > 0 ? ['ranking', 'live'] : ['ranking']),
    [liveCount],
  );

  // -- Safety: if live filter becomes empty, revert to ranking
  useEffect(() => {
    if (liveCount === 0 && sort === 'live') setSort('ranking');
  }, [liveCount, sort, setSort]);

  // -- Ordering when "Playing now" active
  const orderedRows = useMemo<RankedRow[]>(() => {
    if (sort !== 'live') return filteredRows;
    const live: RankedRow[] = [];
    const rest: RankedRow[] = [];
    filteredRows.forEach((r) => {
      if ((liveMap ?? {})[r.playerId]) live.push(r);
      else rest.push(r);
    });
    live.sort((a, b) => {
      const pa = (liveMap ?? {})[a.playerId]?.position ?? Infinity;
      const pb = (liveMap ?? {})[b.playerId]?.position ?? Infinity;
      return pa - pb;
    });
    return [...live, ...rest];
  }, [sort, filteredRows, liveMap]);

  const isSearching = debouncedSearch.trim().length > 0;
  const synced = !!ranking?.synced;
  const statLabel = ranking?.statLabel ?? null;
  const loadedCount = ranking?.rows?.length ?? 0;

  // -- Field band: LEAD = points margin of rank 1 over rank 2 (RANKING only)
  const leadMargin = useMemo<number | null>(() => {
    if (sort !== 'ranking') return null;
    const rows = ranking?.rows ?? [];
    if (rows.length < 2) return null;
    const a = rows[0]?.stat;
    const b = rows[1]?.stat;
    if (a == null || b == null) return null;
    return Math.abs(a - b);
  }, [sort, ranking?.rows]);

  const showBand = !rankingLoading && !rankingError && (liveCount > 0 || leadMargin != null);

  const goPlayer = useCallback(
    (r: RankedRow) => {
      if (!r.playerId) return;
      analyticsEvents.track('tour_players_row_tapped', {
        player_id: r.playerId,
        rank: r.rank,
        tour: activeTour,
        is_live: !!(liveMap ?? {})[r.playerId],
        sort,
      });
      navigate(`/tourhub/player/${r.playerId}`);
    },
    [navigate, activeTour, liveMap, sort],
  );

  // -- Analytics: viewed once per mount after the ranking resolves
  const viewedRef = useRef(false);
  useEffect(() => {
    if (viewedRef.current) return;
    if (rankingLoading || rankingError || !ranking) return;
    viewedRef.current = true;
    analyticsEvents.track('tour_players_viewed', {
      tour: activeTour,
      rows: ranking.rows.length,
      live_count: liveCount,
      synced: !!ranking.synced,
    });
  }, [ranking, rankingLoading, rankingError, activeTour, liveCount]);

  // -- Analytics: searched (debounced value only, never the query text)
  useEffect(() => {
    const q = debouncedSearch.trim();
    if (!q) return;
    analyticsEvents.track('tour_players_searched', {
      query_length: q.length,
      results: filteredRows.length,
      tour: activeTour,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, activeTour]);

  return (
    <div
      style={{
        background: SLATE_50,
        minHeight: '100vh',
        fontFamily: FONT,
        // Islands overlay the top band at rest; on scroll they ride away and
        // the chips row locks at the notch. Matches ScheduleTab.
        paddingTop: 'calc(var(--sat, 0px) + 69px)',
      }}
    >
      {/* Tour lens + search - single sticky row. Pills scroll under a pinned
          search button; expanding search hides the pills and fills the row. */}
      <div
        style={{
          position: 'sticky',
          top: 'var(--sat, 0px)',
          zIndex: 10,
          background: 'rgba(248,250,252,0.72)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(0,0,0,0.07)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            paddingRight: 16,
          }}
        >
          {!searchExpanded ? (
            <>
              <div style={{ flex: 1, minWidth: 0 }}>
                <SectionTourLens
                  value={activeTour}
                  onChange={(t) => t && t !== 'champ' && setActiveTour(t as PlayersTourId)}
                  showAllTours={false}
                  excludeTours={['champ']}
                />
              </div>
              <button
                type="button"
                aria-label={t('players.search.openAria')}
                onClick={() => setSearchExpanded(true)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  background: '#FFFFFF',
                  border: `0.5px solid ${HAIRLINE_INK_10}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <Search size={14} color={INK} />
              </button>
            </>
          ) : (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: '#FFFFFF',
                border: `0.5px solid ${HAIRLINE_INK_10}`,
                borderRadius: 18,
                padding: '6px 12px',
                minWidth: 0,
                margin: '8.5px 0 8.5px 16px',
              }}
            >
              <Search size={13} color={INK_MUTE} />
              <input
                ref={searchInputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('players.search.placeholder')}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: 13,
                  fontFamily: 'inherit',
                  color: INK,
                  background: 'transparent',
                  minWidth: 0,
                }}
              />
              <button
                type="button"
                aria-label={t('players.search.closeAria')}
                onClick={() => {
                  setSearch('');
                  setSearchExpanded(false);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 2,
                  cursor: 'pointer',
                  display: 'flex',
                }}
              >
                <X size={14} color={INK_MUTE} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '12px 16px 0' }}>
        {editorial && (
          <div
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              color: INK_MUTE,
              letterSpacing: '0.02em',
              marginBottom: 12,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {editorial}
          </div>
        )}
      </div>

      {/* FIELD BAND - renders nothing at all when neither figure qualifies. */}
      {showBand && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 40,
            padding: '4px 16px 14px',
          }}
        >
          {liveCount > 0 && (
            <FieldFigure label={t('players.field.playingNow')} value={formatNumberMaxFrac(liveCount, 0)} />
          )}
          {leadMargin != null && (
            <FieldFigure
              label={t('players.field.lead')}
              value={formatNumberMaxFrac(leadMargin, 0)}
              sub={statLabel}
            />
          )}
        </div>
      )}

      {/* THE FIELD. The kicker is the only amber on this page: there is no
          viewing member on a tour surface, so nothing else earns brand colour. */}
      <div style={{ padding: '4px 16px 4px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.16em',
            color: AMBER_DEEP,
            textTransform: 'uppercase',
          }}
        >
          {t('players.field.eyebrow')}
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          {sortOptions.map((k) => {
            const active = k === sort;
            return (
              <button
                key={k}
                type="button"
                aria-pressed={active}
                onClick={() => setSort(k)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 10,
                  border: active ? 'none' : `0.5px solid ${HAIRLINE_INK_10}`,
                  background: active ? INK : '#FFFFFF',
                  color: active ? '#FFFFFF' : INK_MUTE,
                  fontFamily: 'inherit',
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.10em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  lineHeight: 1,
                }}
              >
                {k === 'ranking' ? t('players.sort.ranking') : t('players.sort.playingNow')}
              </button>
            );
          })}
        </div>
      </div>

      {rankingLoading ? (
        <div style={{ padding: '0 16px' }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="w-full mb-1" style={{ height: 58, borderRadius: 6 }} />
          ))}
        </div>
      ) : rankingError ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '48px 16px', textAlign: 'center' }}>
          <div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 700, color: INK }}>
            {t('players.error.title', { defaultValue: "Couldn't load the ranking" })}
          </div>
          <div style={{ fontFamily: FONT, fontSize: 13, color: INK_MUTE, maxWidth: 280 }}>
            {t('players.error.body', { defaultValue: 'Check your connection and try again.' })}
          </div>
          <button
            type="button"
            onClick={() => refetchRanking()}
            style={{ background: INK, color: '#fff', border: 'none', borderRadius: 999, padding: '10px 20px', fontFamily: FONT, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}
          >
            {t('players.error.retry', { defaultValue: 'Retry' })}
          </button>
        </div>
      ) : orderedRows.length === 0 && isSearching ? (
        <div
          style={{
            padding: '40px 24px',
            textAlign: 'center',
            fontSize: 12,
            fontWeight: 500,
            color: INK_MUTE,
            letterSpacing: '0.01em',
          }}
        >
          {t('players.search.noneInField', { count: loadedCount })}
        </div>
      ) : orderedRows.length === 0 ? (
        <TourHubEmptyState variant="players" />
      ) : (
        <div style={{ background: '#FFFFFF' }}>
          <RankedPlayerHeader
            rankLabel={t('players.header.rank')}
            playerLabel={t('players.header.player')}
            statLabel={synced ? statLabel : null}
          />
          {orderedRows.map((r) => {
            const live = (liveMap ?? {})[r.playerId];
            const isLive = !!live;
            let sub: React.ReactNode = null;

            if (isLive && live) {
              const posStr =
                live.position != null ? `${live.positionTied ? 'T' : ''}${live.position}` : '';
              const segments: React.ReactNode[] = [];
              if (posStr) segments.push(<span key="pos">{posStr}</span>);
              if (live.score != null) {
                segments.push(
                  <span key="score" style={{ color: getScoreColor(live.score, 'light') }}>
                    {fmtScore(live.score)}
                  </span>,
                );
              }
              if (live.tournamentName) segments.push(<span key="tn">{live.tournamentName}</span>);
              sub = segments.length ? (
                <span style={{ color: INK_MUTE }}>
                  {segments.map((node, i) => (
                    <span key={i}>
                      {i > 0 ? SEP : ''}
                      {node}
                    </span>
                  ))}
                </span>
              ) : null;
            } else {
              const wr = (worldRanks ?? {})[r.playerId];
              const segments: React.ReactNode[] = [];
              if (wr) {
                segments.push(
                  <span key="wr" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {t('players.sub.worldRank', { rank: wr.rank })}
                    <MovementFigure movement={wr.movement} nullPlaceholder="none" />
                  </span>,
                );
              }
              if (synced && r.wins) {
                segments.push(<span key="w">{t('players.sub.wins', { count: r.wins })}</span>);
              }
              if (synced && r.top10s) {
                segments.push(<span key="t10">{t('players.sub.top10s', { count: r.top10s })}</span>);
              }
              sub = segments.length ? (
                <span style={{ color: INK_MUTE, display: 'inline-flex', alignItems: 'center' }}>
                  {segments.map((node, i) => (
                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center' }}>
                      {i > 0 ? SEP : ''}
                      {node}
                    </span>
                  ))}
                </span>
              ) : null;
            }

            return (
              <RankedPlayerRow
                key={`${r.playerId || 'none'}-${r.rank}-${r.name}`}
                rank={r.rank}
                player={{
                  playerId: r.playerId,
                  name: r.name,
                  country: r.country,
                  countryCode: r.countryCode,
                  photoUrl: r.photoUrl,
                  tourCode: r.tourCode,
                }}
                stat={synced ? r.stat : undefined}
                live={isLive}
                sub={sub}
                onClick={() => goPlayer(r)}
              />
            );
          })}
        </div>
      )}

      {/* Sample-size caption - always visible, always true. */}
      <div
        style={{
          padding: '16px 16px 0',
          fontSize: 10.5,
          fontWeight: 500,
          color: INK_MUTE,
          letterSpacing: '0.04em',
          textAlign: 'center',
        }}
      >
        {t('players.footer.sample', { count: loadedCount })}
      </div>
      <div style={{ height: 'calc(var(--bottom-nav-height, 88px) + 16px)' }} />
    </div>
  );
}

export default PlayersTab;
