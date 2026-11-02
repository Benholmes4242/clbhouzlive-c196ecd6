/**
 * players-v2/PlayersTab — the merged Players page (Players build 1 of 3).
 * Leaders is folded in: the FRONT PAGE (default) tells the season story, the
 * FULL FIELD (?view=all&lens=standings|form|stats&stat=<key>) lists everyone.
 *
 * Wiring:
 *   - Tour: LOCAL lens (per-section by design; NOT TourSelectionContext).
 *     ?tour= honoured once on mount; Champions excluded; island picker drives it.
 *   - Reads: usePlayersRanking, useTourRace, useStandingsMovement, useFieldForm,
 *     useScorecardStats, useTourPlayerFollows, useWorldRankLookup, useLivePlayerIds.
 *   - Opening the full field pushes history; Back pops it (falls back to a
 *     replace when the full field was the entry). Lens/stat changes replace.
 *   - Old ?sort=live / playing-now links open the full field and scroll to the
 *     first live row.
 *   - All copy and rules live in playersRules.ts.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useTourLensFromPicker } from '../hooks/useTourLensFromPicker';
import { readStoredTour } from '../hooks/useTourSelection';
import { TOUR_CONFIG } from '../hooks/useOverviewData';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { FONT, TOUR_CANVAS, INK, INK_MUTE } from '../_shared/tokens';
import { TourHubEmptyState } from '../components/TourHubEmptyState';
import { useTourPlayerFollows } from '../leaderboard/useTourPlayerFollows';

import { usePlayersRanking, type PlayersTourId } from './data/usePlayersRanking';
import { useLivePlayerIds } from './data/useLivePlayerIds';
import { useWorldRankLookup } from './data/useWorldRankLookup';
import { useTourRace } from './data/useTourRace';
import { useStandingsMovement } from './data/useStandingsMovement';
import { useFieldForm } from './data/useFieldForm';
import { useScorecardStats } from './data/useScorecardStats';
import { buildPlayers, type PlayerView } from './playersModel';
import { parseLens, rankByForm, type Lens } from './playersRules';
import { FrontPage, FrontSkeleton } from './front/FrontPage';
import { FullField } from './field/FullField';
import type { CardName, PageActions, PageData } from './pageModel';
import { P } from './playersTokens';

export function PlayersTab() {
  const { t } = useTranslation('tourhub');
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // -- Per-section tour lens (local state, NO All Tours, PGA default).
  const inboundTour = searchParams.get('tour');
  const storedTour = readStoredTour();
  const initialTour: PlayersTourId =
    inboundTour && inboundTour in TOUR_CONFIG && inboundTour !== 'champ'
      ? (inboundTour as PlayersTourId)
      : storedTour && storedTour in TOUR_CONFIG && storedTour !== 'champ'
        ? (storedTour as PlayersTourId)
        : 'pga';
  const [activeTour, setActiveTour] = useState<PlayersTourId>(initialTour);
  const changeTour = useCallback((next: PlayersTourId) => setActiveTour(next), []);
  useTourLensFromPicker<PlayersTourId>(
    (slug) => (slug !== 'champ' && slug in TOUR_CONFIG ? (slug as PlayersTourId) : undefined),
    changeTour,
    activeTour,
  );

  // -- View state lives in the URL.
  const view = searchParams.get('view') === 'all' ? 'all' : 'front';
  const lens = parseLens(searchParams.get('lens'));
  const stat = searchParams.get('stat') ?? '';

  // Old ?sort=live / playing-now links → the full field, scrolled to the first live row.
  const scrollLiveRef = useRef(false);
  useEffect(() => {
    const sort = searchParams.get('sort');
    if (sort !== 'live' && sort !== 'playing-now') return;
    scrollLiveRef.current = true;
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.delete('sort');
      p.set('tab', 'players');
      p.set('view', 'all');
      p.set('lens', 'standings');
      return p;
    }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -- Search
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 200);
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (searchOpen && view === 'all') searchRef.current?.focus();
  }, [searchOpen, view]);
  const query = debouncedSearch.trim().toLowerCase();

  // -- Reads
  const { data: race, isError: raceError } = useTourRace(activeTour);
  // Standings read the race's season so they never disagree with the line cards.
  const raceYear = race ? (race.race ? race.race.season_year : null) : raceError ? null : undefined;
  const { data: ranking, isLoading: rankingFetching, isError: rankingError, refetch: refetchRanking } = usePlayersRanking(activeTour, raceYear);
  const rankingLoading = rankingFetching || raceYear === undefined;
  const { data: liveMap } = useLivePlayerIds();
  const { data: movement } = useStandingsMovement(activeTour, race?.seasonYear);
  const { data: formMap } = useFieldForm(activeTour, race?.seasonYear);
  const { data: scorecard } = useScorecardStats(activeTour, race?.seasonYear);
  const { followed } = useTourPlayerFollowsSet();
  const loadedIds = useMemo(() => (ranking?.rows ?? []).map((r) => r.playerId).filter(Boolean), [ranking?.rows]);
  const { data: worldRanks } = useWorldRankLookup(loadedIds);

  const players = useMemo<PlayerView[]>(
    () => buildPlayers({ rows: ranking?.rows ?? [], follows: followed, movement, form: formMap, world: worldRanks }),
    [ranking?.rows, followed, movement, formMap, worldRanks],
  );
  const form = useMemo(() => rankByForm(players, (p) => p.form), [players]);
  const updatedAt = useMemo(() => {
    let best: string | null = null;
    for (const r of ranking?.rows ?? []) if (r.updatedAt && (!best || r.updatedAt > best)) best = r.updatedAt;
    return best;
  }, [ranking?.rows]);

  const data: PageData = useMemo(() => ({
    tour: activeTour,
    isPga: activeTour === 'pga',
    title: race?.race?.title ?? TOUR_CONFIG[activeTour].name,
    players,
    race: race?.race ?? null,
    stakes: race?.stakes ?? [],
    events: race?.events ?? [],
    scorecard,
    form,
    live: liveMap ?? {},
    updatedAt,
  }), [activeTour, race, players, scorecard, form, liveMap, updatedAt]);

  // -- Navigation
  const openAll = useCallback<PageActions['openAll']>(({ from, lens: l, stat: s, search: withSearch }) => {
    analyticsEvents.track('tour_players_view_all_opened', { from, tour: activeTour });
    const p = new URLSearchParams(searchParams);
    p.set('tab', 'players');
    p.set('view', 'all');
    p.set('lens', l ?? 'standings');
    if (s) p.set('stat', s); else p.delete('stat');
    if (withSearch) setSearchOpen(true);
    navigate({ pathname: location.pathname, search: `?${p.toString()}` }, { state: { playersFrontBack: true } });
  }, [activeTour, searchParams, navigate, location.pathname]);

  const onBack = useCallback(() => {
    setSearch('');
    setSearchOpen(false);
    if ((location.state as { playersFrontBack?: boolean } | null)?.playersFrontBack) {
      navigate(-1);
      return;
    }
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.delete('view'); p.delete('lens'); p.delete('stat');
      return p;
    }, { replace: true });
  }, [location.state, navigate, setSearchParams]);

  const onLens = useCallback((next: Lens) => {
    if (next === lens) return;
    analyticsEvents.track('tour_players_lens_changed', { lens: next, tour: activeTour });
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('lens', next);
      if (next !== 'stats') p.delete('stat');
      return p;
    }, { replace: true });
  }, [lens, activeTour, setSearchParams]);

  const onStat = useCallback((next: string) => {
    analyticsEvents.track('tour_players_stat_changed', { stat: next, tour: activeTour });
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('stat', next);
      return p;
    }, { replace: true });
  }, [activeTour, setSearchParams]);

  const goPlayer = useCallback((p: PlayerView, card?: CardName) => {
    if (!p.playerId) return;
    if (card) analyticsEvents.track('tour_players_card_tapped', { card, tour: activeTour });
    analyticsEvents.track('tour_players_row_tapped', {
      player_id: p.playerId,
      rank: p.rank,
      tour: activeTour,
      is_live: !!(liveMap ?? {})[p.playerId],
      view,
      lens: view === 'all' ? lens : null,
    });
    navigate(`/tourhub/player/${p.playerId}`);
  }, [activeTour, liveMap, navigate, view, lens]);

  const actions: PageActions = useMemo(() => ({ openAll, goPlayer }), [openAll, goPlayer]);

  // -- Analytics: viewed once per mount after the ranking resolves
  const viewedRef = useRef(false);
  useEffect(() => {
    if (viewedRef.current || rankingLoading || rankingError || !ranking) return;
    viewedRef.current = true;
    analyticsEvents.track('tour_players_viewed', {
      tour: activeTour,
      rows: ranking.rows.length,
      live_count: players.filter((p) => p.playerId && (liveMap ?? {})[p.playerId]).length,
      synced: !!ranking.synced,
    });
  }, [ranking, rankingLoading, rankingError, activeTour, players, liveMap]);

  // -- Analytics: searched (debounced value only, never the query text)
  useEffect(() => {
    if (!query) return;
    analyticsEvents.track('tour_players_searched', {
      query_length: query.length,
      results: players.filter((p) => p.name.toLowerCase().includes(query)).length,
      tour: activeTour,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, activeTour]);

  // -- Scroll to the first live row for old sort=live links, once rows land.
  useEffect(() => {
    if (!scrollLiveRef.current || view !== 'all' || !players.length || !liveMap) return;
    const el = document.querySelector('[data-field-row][data-live]');
    if (el) {
      scrollLiveRef.current = false;
      (el as HTMLElement).scrollIntoView({ block: 'start' });
    }
  }, [view, players.length, liveMap]);

  return (
    <div data-players-page={view} style={{ background: TOUR_CANVAS, minHeight: '100vh', fontFamily: FONT, color: P.INK }}>
      {rankingLoading ? (
        <FrontSkeleton />
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
            style={{ background: INK, color: TOUR_CANVAS, border: 'none', borderRadius: 999, padding: '10px 20px', fontFamily: FONT, fontSize: 11.5, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', cursor: 'pointer' }}
          >
            {t('players.error.retry', { defaultValue: 'Retry' })}
          </button>
        </div>
      ) : players.length === 0 ? (
        <TourHubEmptyState variant="players" />
      ) : view === 'all' ? (
        <FullField
          data={data}
          actions={actions}
          lens={lens}
          stat={stat}
          onLens={onLens}
          onStat={onStat}
          onBack={onBack}
          search={search}
          onSearch={setSearch}
          searchOpen={searchOpen}
          onSearchOpen={setSearchOpen}
          searchRef={searchRef}
          query={query}
        />
      ) : (
        <FrontPage data={data} actions={actions} />
      )}
      <div style={{ height: 'calc(var(--bottom-nav-height, 96px) + 16px)' }} />
    </div>
  );
}

/** Followed tour players as a Set that is stable while the follow list is. */
function useTourPlayerFollowsSet(): { followed: Set<string> } {
  const { ids } = useTourPlayerFollows();
  const key = [...ids].sort().join('|');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => ({ followed: new Set(key ? key.split('|') : []) }), [key]);
}

export default PlayersTab;

