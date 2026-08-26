/**
 * PlayerPage (v2) — "The Feature".
 *
 * Cinematic dark hero + one continuous light scroll of Overview-grammar
 * sections. No ShellSlot identity chrome, no tabs, no framer-motion
 * except the LiveNowStrip insertion.
 *
 * Route repoints at P2. Currently reachable directly via the section
 * hooks so it can be verified in isolation.
 */

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TourHubShell } from '../components/TourHubShell';
import { TourPageShell } from '@/features/tourhub/components/TourPageShell';
import { useTourPlayer, useSinglePlayerStatistics } from '../hooks/useTourHubData';
import { usePlayerResults } from '../hooks/usePlayerResults';
import { usePlayerState } from '../hooks/usePlayerState';
import { HeroSection } from './sections/HeroSection';
import { LiveNowStrip } from './sections/LiveNowStrip';
import { SeasonCards } from './sections/SeasonCards';
import { FormSection } from './sections/FormSection';
import { TournamentsSection } from './sections/TournamentsSection';
import { AboutSection } from './sections/AboutSection';
import { PlayerPageSkeleton } from '@/components/skeletons/PlayerPageSkeleton';
import { SLATE_50 } from '../_shared/tokens';
import { scrollPageToTop } from '@/lib/getScrollParent';

export function PlayerPage() {
  const { t } = useTranslation('tourhub');
  const { playerId } = useParams<{ playerId: string }>();

  const { data: player, isLoading: playerLoading, isError: playerError, refetch } = useTourPlayer(playerId || '');
  const { data: playerStats, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = useSinglePlayerStatistics(playerId);
  const { data: results, isLoading: resultsLoading, isError: resultsError, refetch: refetchResults } = usePlayerResults(playerId, 30);
  const playerState = usePlayerState(playerId);

  // Scroll-to-top on player switch (ported from PlayerProfilePage).
  useEffect(() => {
    scrollPageToTop('auto');
  }, [playerId]);

  if (playerLoading || statsLoading || resultsLoading) {
    return (
      <TourHubShell>
        <PlayerPageSkeleton />
      </TourHubShell>
    );
  }

  if (playerError || !player) {
    return (
      <TourHubShell>
        <div
          style={{
            paddingTop: 'var(--chrome-total-h, 0px)',
            background: SLATE_50,
            minHeight: '60vh',
          }}
          className="px-5"
        >
          <div className="text-center py-20 flex flex-col items-center gap-3">
            <AlertCircle className="w-10 h-10 text-muted-foreground" />
            <p className="text-muted-foreground text-lg font-medium">{t('player.error.loadFailed')}</p>
            <button
              onClick={() => refetch()}
              className="mt-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium active:opacity-70 transition-opacity"
            >
              {t('player.error.retry')}
            </button>
          </div>
        </div>
      </TourHubShell>
    );
  }

  const liveTournamentId =
    playerState.state === 'live' ? playerState.liveData?.tournamentId ?? null : null;

  return (
    <TourHubShell>
      <TourPageShell
        immersive
        background={SLATE_50}
        title={player.full_name}
        backFallback="/tourhub?tab=players"
      >
      <div style={{ background: SLATE_50, minHeight: '100vh' }}>
        <HeroSection player={player} playerStats={playerStats ?? null} />

        {(statsError || resultsError) && (
          <div
            style={{
              margin: '12px 16px 0',
              padding: '10px 14px',
              borderRadius: 12,
              background: 'rgba(220,38,38,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#B91C1C' }}>
              {t('player.error.partial', { defaultValue: "Some sections couldn't load" })}
            </span>
            <button
              type="button"
              onClick={() => {
                if (statsError) refetchStats();
                if (resultsError) refetchResults();
              }}
              style={{ background: 'transparent', border: 'none', padding: 0, fontSize: 12.5, fontWeight: 700, color: '#B91C1C', cursor: 'pointer', textDecoration: 'underline' }}
            >
              {t('player.error.retry')}
            </button>
          </div>
        )}

        <AnimatePresence initial={false}>
          {playerState.state === 'live' && playerState.liveData && (
            <motion.div
              key="live-now"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{ overflow: 'hidden' }}
            >
              <LiveNowStrip liveData={playerState.liveData} playerName={player.full_name} />
            </motion.div>
          )}
        </AnimatePresence>

        <SeasonCards
          playerStats={playerStats ?? null}
          results={results ?? []}
          player={player}
        />

        <FormSection results={results ?? []} />

        <TournamentsSection
          results={results ?? []}
          playerId={player.id}
          playerName={player.full_name}
          liveTournamentId={liveTournamentId}
        />

        <AboutSection player={player} />

        <div
          style={{
            paddingBottom: 88,
          }}
        />
      </div>
      </TourPageShell>
    </TourHubShell>
  );
}
