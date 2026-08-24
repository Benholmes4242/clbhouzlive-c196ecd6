/**
 * leaders-v2/LeadersTab - "The Boards" - category cards + deep sheets.
 * Overview grammar; no framer-motion; no shell-row dependency.
 *
 * Wiring:
 *   - Tour: TourSelectionContext (selectTour); ?tour= honored once on mount.
 *   - ?category= auto-opens the FullListSheet for that key (Overview deep-links).
 *   - Data: useLeaderCategories(tour) + useLivePlayerIds().
 *   - Sheet nav: closes first, then navigates - no stuck overlay.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { analyticsEvents } from '@/utils/analyticsEvents';

import { Skeleton } from '@/components/ui/skeleton';
import { TourHubEmptyState } from '../components/TourHubEmptyState';
import { SectionTourLens } from '../overview/sections/SectionTourLens';
import { TOUR_CONFIG, type TourId } from '../hooks/useOverviewData';

import { useLivePlayerIds } from '../players-v2/data/useLivePlayerIds';
import {
  FONT,
  INK,
  INK_MUTE,
  SLATE_50,
} from '../_shared/tokens';

import { useLeaderCategories } from './data/useLeaderCategories';
import {
  StatBoardRows,
  WinnersCircle,
  ANATOMY_BY_KEY,
  type Anatomy,
} from './boards/AlmanacBoards';
import { FullListSheet } from './FullListSheet';
import { FIGS } from '@/lib/tokens/type';

// Compact tour-eyebrow chip labels resolved via i18n. Keys are the stable
// TourId enum; the values live under leaders.tourChip.<tour>.
const CHIP_LABEL_KEY: Record<TourId, string> = {
  pga:   'leaders.tourChip.pga',
  lpga:  'leaders.tourChip.lpga',
  euro:  'leaders.tourChip.euro',
  pgad:  'leaders.tourChip.pgad',
  champ: 'leaders.tourChip.champ',
  liv:   'leaders.tourChip.liv',
};


export function LeadersTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation('tourhub');

  // Per-section tour lens (local state, NO All Tours, PGA default).
  // Champions is intentionally omitted here (insufficient stat coverage);
  // if the URL passes ?tour=champ we fall through to PGA.
  const inboundTour = searchParams.get('tour');
  const initialTour: TourId =
    inboundTour && inboundTour in TOUR_CONFIG && inboundTour !== 'champ'
      ? (inboundTour as TourId)
      : 'pga';
  const [activeTour, setActiveTour] = useState<TourId>(initialTour);


  const { data: result, isLoading, isError, refetch } = useLeaderCategories(activeTour);
  const { data: liveMap } = useLivePlayerIds();

  const categories = result?.categories ?? [];
  const year = result?.year ?? new Date().getFullYear();

  // Deep-link ?category=
  const [openKey, setOpenKey] = useState<string | null>(null);
  const inboundCatRef = useRef(false);
  useEffect(() => {
    if (inboundCatRef.current) return;
    if (!categories.length) return;
    inboundCatRef.current = true;
    const inbound = searchParams.get('category');
    if (inbound && categories.some((c) => c.key === inbound)) {
      setOpenKey(inbound);
    }
  }, [categories, searchParams]);

  // If tour changes and the currently open sheet is not in the new tour, close it.
  useEffect(() => {
    if (!openKey) return;
    if (!categories.length) return;
    if (!categories.some((c) => c.key === openKey)) setOpenKey(null);
  }, [openKey, categories]);

  const openCategory = useCallback(
    (key: string) => {
      analyticsEvents.track('tour_leaders_full_list_opened', { tour: activeTour, category: key });
      setOpenKey(key);
      const p = new URLSearchParams(searchParams);
      p.set('tab', 'leaderboards');
      p.set('category', key);
      setSearchParams(p, { replace: true });
    },
    [searchParams, setSearchParams, activeTour],
  );

  // Shared board tap handler: track, then navigate.
  const onPlayerTap = useCallback(
    (category: string, playerId: string, rank: number) => {
      if (!playerId) return;
      analyticsEvents.track('tour_leaders_player_tapped', {
        tour: activeTour,
        category,
        player_id: playerId,
        rank,
      });
      navigate(`/tourhub/player/${playerId}`);
    },
    [navigate, activeTour],
  );

  // Analytics: viewed once per mount, after the categories resolve.
  const viewedRef = useRef(false);
  useEffect(() => {
    if (viewedRef.current) return;
    if (isLoading || isError || !categories.length) return;
    viewedRef.current = true;
    analyticsEvents.track('tour_leaders_viewed', {
      tour: activeTour,
      category_count: categories.length,
      pool_size: categories.reduce((n, c) => n + (c.poolSize ?? 0), 0),
    });
  }, [categories, isLoading, isError, activeTour]);

  const closeCategory = useCallback(() => {
    setOpenKey(null);
    const p = new URLSearchParams(searchParams);
    if (p.get('category')) {
      p.delete('category');
      setSearchParams(p, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const activeCategory = useMemo(
    () => categories.find((c) => c.key === openKey) ?? null,
    [categories, openKey],
  );

  const tourLabel = t(CHIP_LABEL_KEY[activeTour]);

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

      {/* Tour lens - sticky glass wrapper; chips from SectionTourLens
          (no All Tours; PGA default). CHAMP taps are ignored - no board
          coverage for that tour. */}
      <div
        style={{
          position: 'sticky',
          top: 'var(--sat, 0px)',
          zIndex: 10,
          background: 'rgba(248,250,252,0.72)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(255,255,255,0.10)',
        }}
      >
        <SectionTourLens
          value={activeTour}
          onChange={(t) => {
            if (!t || t === 'champ') return;
            setActiveTour(t);
          }}
          showAllTours={false}
        />
      </div>


      {/* Boards feed */}
      {isLoading ? (
        <div style={{ padding: '16px 0 88px', display: 'flex', flexDirection: 'column', gap: 22 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton
              key={i}
              style={{ height: i === 0 ? 320 : 168, borderRadius: 16, margin: '0 16px' }}
            />
          ))}
        </div>

      ) : isError ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '48px 16px', textAlign: 'center' }}>
          <div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 700, color: INK }}>
            {t('leaders.error.title', { defaultValue: "Couldn't load the boards" })}
          </div>
          <div style={{ fontFamily: FONT, fontSize: 13, color: INK_MUTE, maxWidth: 280 }}>
            {t('leaders.error.body', { defaultValue: 'Check your connection and try again.' })}
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            style={{ background: INK, color: SLATE_50, border: 'none', borderRadius: 999, padding: '10px 20px', fontFamily: FONT, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}
          >
            {t('leaders.error.retry', { defaultValue: 'Retry' })}
          </button>
        </div>
      ) : categories.length === 0 ? (
        <TourHubEmptyState variant="leaderboard" />
      ) : (
        <div style={{ padding: '16px 0 88px', display: 'flex', flexDirection: 'column', gap: 22 }}>
          {categories.map((cat) => {
            // No marquee: every board uses the anatomy its key maps to. The
            // first board is first because it is the most important stat.
            const anatomy: Anatomy = ANATOMY_BY_KEY[cat.key] ?? 'stat';
            const onOpen = () => openCategory(cat.key);
            const key = cat.key;

            if (anatomy === 'winners') {
              return (
                <WinnersCircle
                  key={key}
                  category={cat}
                  liveMap={liveMap ?? {}}
                  onOpen={onOpen}
                  onPlayerTap={(pid, rank) => onPlayerTap(cat.key, pid, rank)}
                />
              );
            }
            const overline =
              cat.key === 'world_rank'
                ? t('leaders.almanac.world.overline')
                : t(cat.shortKey);
            return (
              <StatBoardRows
                key={key}
                category={cat}
                liveMap={liveMap ?? {}}
                onOpen={onOpen}
                onPlayerTap={(pid, rank) => onPlayerTap(cat.key, pid, rank)}
                overline={overline}
                showMovement={cat.key === 'world_rank'}
              />
            );
          })}
          <div
            style={{
              padding: '4px 16px 0',
              fontSize: 10.5,
              fontWeight: 500,
              color: INK_MUTE,
              letterSpacing: '0.04em',
              textAlign: 'center',
              ...FIGS,
            }}
          >
            {t('leaders.footer')}
          </div>
        </div>
      )}

      <FullListSheet
        open={!!activeCategory}
        onClose={closeCategory}
        category={activeCategory}
        liveMap={liveMap ?? {}}
        tourLabel={tourLabel}
        year={year}
      />
    </div>
  );
}

export default LeadersTab;
