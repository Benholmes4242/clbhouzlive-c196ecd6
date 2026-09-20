import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { NAV_CLEARANCE } from '@/lib/navClearance';
import { TourHubEmptyState } from '../components/TourHubEmptyState';
import { useTourLensFromPicker } from '../hooks/useTourLensFromPicker';
import { readStoredTour } from '../hooks/useTourSelection';
import { TOUR_CONFIG, type TourId } from '../hooks/useOverviewData';
import { FONT, INK, INK_MUTE, SLATE_50 } from '../_shared/tokens';
import { useLeaderCategories, type LeaderRow } from './data/useLeaderCategories';
import { selectSeasonMagazine } from './seasonMagazine';
import { DuelModule, LeadModule, MovementModule, NumberModule, RaceStandingsModule, SeasonIndexLink, TiedListModule } from './boards/AlmanacBoards';
import { FullListSheet } from './FullListSheet';

const CHIP_LABEL_KEY: Record<TourId, string> = {
  pga: 'leaders.tourChip.pga', lpga: 'leaders.tourChip.lpga', euro: 'leaders.tourChip.euro',
  pgad: 'leaders.tourChip.pgad', champ: 'leaders.tourChip.champ', liv: 'leaders.tourChip.liv',
};

export function LeadersTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation('tourhub');
  const inboundTour = searchParams.get('tour');
  const storedTour = readStoredTour();
  const initialTour: TourId = inboundTour && inboundTour in TOUR_CONFIG && inboundTour !== 'champ'
    ? inboundTour as TourId
    : storedTour && storedTour in TOUR_CONFIG && storedTour !== 'champ' ? storedTour as TourId : 'pga';
  const [activeTour, setActiveTour] = useState<TourId>(initialTour);
  const { data: result, isLoading, isError, refetch } = useLeaderCategories(activeTour);
  const categories = result?.categories ?? [];
  const magazine = useMemo(() => selectSeasonMagazine(categories), [categories]);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const inboundCatRef = useRef(false);

  useEffect(() => {
    if (inboundCatRef.current || !categories.length) return;
    inboundCatRef.current = true;
    const inbound = searchParams.get('category');
    if (inbound && categories.some((category) => category.key === inbound)) setOpenKey(inbound);
  }, [categories, searchParams]);

  useTourLensFromPicker<TourId>((slug) => slug !== 'champ' && slug in TOUR_CONFIG ? slug as TourId : undefined, setActiveTour, activeTour);

  const openCategory = useCallback((key: string) => {
    analyticsEvents.track('tour_leaders_full_list_opened', { tour: activeTour, category: key });
    setOpenKey(key);
    setSearchParams((previous) => { const next = new URLSearchParams(previous); next.set('tab', 'leaderboards'); next.set('category', key); return next; }, { replace: true });
  }, [activeTour, setSearchParams]);

  const closeCategory = useCallback(() => {
    setOpenKey(null);
    setSearchParams((previous) => { const next = new URLSearchParams(previous); next.delete('category'); return next; }, { replace: true });
  }, [setSearchParams]);

  const onPlayerClick = useCallback((category: string, row: LeaderRow) => {
    if (!row.playerId) return;
    analyticsEvents.track('tour_leaders_player_tapped', { tour: activeTour, category, player_id: row.playerId, rank: row.rank });
    navigate(`/tourhub/player/${row.playerId}`);
  }, [activeTour, navigate]);

  const viewedRef = useRef(false);
  useEffect(() => {
    if (viewedRef.current || isLoading || isError || !categories.length) return;
    viewedRef.current = true;
    analyticsEvents.track('tour_leaders_viewed', { tour: activeTour, category_count: categories.length, pool_size: categories.reduce((sum, category) => sum + category.poolSize, 0) });
  }, [activeTour, categories, isError, isLoading]);

  const activeCategory = categories.find((category) => category.key === openKey) ?? null;
  const loading = <div style={{ padding: '24px', display: 'grid', gap: 16 }}>{[190, 250, 160].map((height) => <Skeleton key={height} style={{ height }} />)}</div>;

  return <div style={{ minHeight: '100vh', background: SLATE_50, fontFamily: FONT }}>
    {isLoading ? loading : isError ? <div style={{ padding: '56px 24px', textAlign: 'center' }}><p style={{ color: INK, fontSize: 15, fontWeight: 800 }}>{t('leaders.error.title')}</p><p style={{ color: INK_MUTE, fontSize: 13 }}>{t('leaders.error.body')}</p><button type="button" onClick={() => refetch()} style={{ marginTop: 12, border: 0, padding: '10px 20px', background: INK, color: SLATE_50, fontWeight: 750 }}>{t('leaders.error.retry')}</button></div> : !magazine ? <TourHubEmptyState variant="leaderboard" /> : <main style={{ paddingBottom: NAV_CLEARANCE }}>
      <LeadModule category={magazine.race} subject={magazine.subject} categories={categories} />
      {magazine.showMovement ? <MovementModule category={magazine.race} onPlayerClick={(row) => onPlayerClick(magazine.race.key, row)} /> : null}
      {magazine.showRaceStandings ? <RaceStandingsModule category={magazine.race} onPlayerClick={(row) => onPlayerClick(magazine.race.key, row)} /> : null}
      {magazine.oneNumber ? <NumberModule category={magazine.oneNumber} onPlayerClick={(row) => onPlayerClick(magazine.oneNumber?.key ?? '', row)} /> : null}
      {magazine.duel ? <DuelModule category={magazine.duel} onPlayerClick={(row) => onPlayerClick(magazine.duel?.key ?? '', row)} /> : null}
      {magazine.tiedList ? <TiedListModule category={magazine.tiedList} onPlayerClick={(row) => onPlayerClick(magazine.tiedList?.key ?? '', row)} /> : null}
      <SeasonIndexLink onClick={() => navigate(`/tourhub/season-stats?tour=${activeTour}`)} />
    </main>}
    <FullListSheet open={Boolean(activeCategory)} onClose={closeCategory} category={activeCategory} liveMap={{}} tourLabel={t(CHIP_LABEL_KEY[activeTour])} year={result?.year ?? new Date().getFullYear()} />
  </div>;
}

export default LeadersTab;