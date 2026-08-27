/**
 * players-v2/PlayersTab - "The Field" - one shared ledger row, a column
 * header, and an honest sample-size caption.
 *
 * Wiring:
 *   - Tour: LOCAL lens (per-section by design; NOT TourSelectionContext).
 *     ?tour= honored once on mount; ?sort= honored for old inbound links.
 *   - Data: usePlayersRanking(tour) + useLivePlayerIds()
 *     + useWorldRankLookup(loaded ids).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { TourHubEmptyState } from '../components/TourHubEmptyState';
import { useTourLensFromPicker } from '../hooks/useTourLensFromPicker';
import { TOUR_CONFIG, type TourId } from '../hooks/useOverviewData';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

import {
  FONT,
  HAIRLINE_INK_10,
  INK,
  INK_MUTE,
  SLATE_50,
  SURFACE,
} from '../_shared/tokens';
import { getScoreColor } from '../_shared/scoreColor';
import { MovementFigure } from '../_shared/movement';
import { fmtScore } from '../utils/fmtScore';

import { usePlayersRanking, type RankedRow, type PlayersTourId } from './data/usePlayersRanking';
import { useLivePlayerIds } from './data/useLivePlayerIds';
import { useWorldRankLookup } from './data/useWorldRankLookup';
import { RankedPlayerRow, RankedPlayerHeader } from './RankedPlayerRow';
import { FIGS } from '@/lib/tokens/type';


type SortKey = 'ranking' | 'live';

const SEP = ' . ';

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

  const changeTour = useCallback((next: PlayersTourId) => {
    setActiveTour(next);
  }, []);

  /* The island's TourPickerSheet replaces the deleted pills row
     (BRIEF_TOUR_HEADER_ONE_ROW). This page's lens had showAllTours={false} and
     excluded 'champ', so the sheet's All-tours row ('all'), 'major' and
     'champ' have no expression here and are ignored rather than substituted. */
  useTourLensFromPicker<PlayersTourId>(
    (slug) =>
      slug !== 'champ' && slug in TOUR_CONFIG ? (slug as PlayersTourId) : undefined,
    changeTour,
  );


  // -- Search
  const [search, setSearch] = useState('');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 200);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (searchExpanded) searchInputRef.current?.focus();
  }, [searchExpanded]);

  // -- Data
  const { data: ranking, isLoading: rankingLoading, isError: rankingError, refetch: refetchRanking } = usePlayersRanking(activeTour);
  const { data: liveMap } = useLivePlayerIds();
  
  const loadedIds = useMemo(
    () => (ranking?.rows ?? []).map((r) => r.playerId).filter(Boolean),
    [ranking?.rows],
  );
  const { data: worldRanks } = useWorldRankLookup(loadedIds);

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

  // -- Sort options: "Playing now" only when somebody is live.
  const sortOptions = useMemo<SortKey[]>(
    () => (liveCount > 0 ? ['ranking', 'live'] : ['ranking']),
    [liveCount],
  );

  // -- Safety: if live filter becomes empty, revert to ranking
  useEffect(() => {
    if (liveCount === 0 && sort === 'live') setSort('ranking');
  }, [liveCount, sort, setSort]);

  // -- Ordering: "Playing now" floats live players to the top.
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
      }}
    >
      {/* Tour lens + search - single sticky row. Pills scroll under a pinned
          search button; expanding search hides the pills and fills the row. */}
      <div
        style={{
          position: 'sticky',
          top: 'var(--tour-header-h, 0px)',
          zIndex: 10,
          background: '#15171F',
          borderBottom: '1px solid rgba(255,255,255,0.10)',
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
              {/* Tour pills deleted (BRIEF_TOUR_HEADER_ONE_ROW): the island's
                  left capsule owns the tour control. The search affordance
                  STAYS - it is a within-page filter over the ranking rows,
                  not the island's global search. */}
              <div style={{ flex: 1, minWidth: 0 }} />
              {/* RADIUS/HEIGHT EXCEPTION (recorded — do not "correct" to 44).
                  The canon puts search bars at radius 14 / height 44. This
                  control sits in a 36px control row beside the SectionTourLens
                  chip row and a 36px circular button: forcing 44 makes the row
                  jump on expand and orphans the button. Radius unifies at 14;
                  the height stays 36 because it is constrained by neighbours.
                  Third such exception, after the OTP digit boxes and the
                  Reviews tab control row. If the row ever goes to 44, it moves
                  as one change across chip row + button + field. */}
              <button
                type="button"
                aria-label={t('players.search.openAria')}
                onClick={() => setSearchExpanded(true)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 14,
                background: SURFACE,
                border: `1px solid ${HAIRLINE_INK_10}`,
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
                height: 36,
                background: SURFACE,
                border: `1px solid ${searchFocused ? INK_MUTE : HAIRLINE_INK_10}`,
                borderRadius: 14,
                padding: '0 12px',
                transition: 'background 140ms ease, border-color 140ms ease',
                minWidth: 0,
                margin: '8.5px 0 8.5px 16px',
              }}
            >
              <Search size={13} color={INK_MUTE} />
              <input
                ref={searchInputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder={t('players.search.placeholder')}
                className="placeholder:text-[rgba(255,255,255,0.38)]"
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


      {/* THE FIELD. The kicker is the only amber on this page: there is no
          viewing member on a tour surface, so nothing else earns brand colour.
          With the stat lens present the pills need a full scrollable row of
          their own; with two pills they stay inline beside the kicker. */}
      <div
        style={{
          padding: '12px 16px 4px',
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            // AXIS 10: THE FIELD / RANKING header row - a column header, same
            // call as the hero's TODAY/TOTAL/THRU.
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.16em',
            color: INK,
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
                  background: active ? INK : SURFACE,
                  color: active ? SLATE_50 : INK_MUTE,
                  fontFamily: 'inherit',
                  // CAPS BUTTON: two points down from the 13 button base, 0.10em.
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.10em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  lineHeight: 1,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
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
            style={{ background: INK, color: SLATE_50, border: 'none', borderRadius: 999, padding: '10px 20px', fontFamily: FONT, fontSize: 11.5, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', cursor: 'pointer' }}
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
            ...FIGS,
          }}
        >
          {t('players.search.noneInField', { count: loadedCount })}
        </div>
      ) : orderedRows.length === 0 ? (
        <TourHubEmptyState variant="players" />
      ) : (
        <div style={{ background: SLATE_50 }}>
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
                  <span key="score" style={{ color: getScoreColor(live.score, 'dark') }}>
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
                  <span key="wr">
                    {t('players.sub.worldRank', { rank: wr.rank })}{' '}
                    <MovementFigure
                      movement={wr.movement}
                      nullPlaceholder="none"
                      variant="inline"
                    />
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
                <span style={{ color: INK_MUTE }}>
                  {segments.map((node, i) => (
                    <span key={i}>
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
                interactive={!!r.playerId}
                onClick={() => goPlayer(r)}
              />
            );
          })}
        </div>
      )}

      {/* Sample-size caption - shown only when there IS a ranking, so the
          page can never print "Top 0 by season ranking" over an empty state. */}
      {loadedCount > 0 && (
      <div
        style={{
          padding: '16px 16px 0',
          fontSize: 11,
          fontWeight: 500,
          color: INK_MUTE,
          letterSpacing: '0.04em',
          textAlign: 'center',
          ...FIGS,
        }}
      >
        {t('players.footer.sample', { count: loadedCount })}
      </div>
      )}

      <div style={{ height: 'calc(var(--bottom-nav-height, 88px) + 16px)' }} />
    </div>
  );
}

export default PlayersTab;
