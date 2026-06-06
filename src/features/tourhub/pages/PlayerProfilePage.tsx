/**
 * PlayerProfilePage - Dispatch-style player profile.
 */

import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { TourHubShell } from '../components/TourHubShell';
import { ShellSlot } from '@/components/header/ShellSlot';
import { Kicker } from '@/components/watch/proshop/Kicker';
import {
  PlayerSeasonStats,
  PlayerTournamentHistory,
  PlayerInfoCard,
  FormSection,
} from '../components/player';
import { useTourPlayer, useSinglePlayerStatistics } from '../hooks/useTourHubData';
import { INK_TINT_06, SHELL_BG, SURFACE } from '../_shared/tokens';

const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

function getTourBadgeText(tourCode: string | null | undefined): string {
  switch ((tourCode || '').toLowerCase()) {
    case 'pga':   return 'PGA Tour';
    case 'euro':  return 'DP World Tour';
    case 'lpga':  return 'LPGA';
    case 'champ': return 'PGA Champions';
    case 'pgad':  return 'Korn Ferry';
    case 'liv':   return 'LIV Golf';
    default:      return 'Player';
  }
}

const SHELL_SLOT_BG: React.CSSProperties = {
  background: SHELL_BG,
  padding: '14px 16px 12px',
};

const SHELL_H1_STYLE: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 800,
  letterSpacing: '-0.025em',
  color: SURFACE,
  lineHeight: 1.15,
  margin: 0,
};

export function PlayerProfilePage() {
  const { playerId } = useParams<{ playerId: string }>();

  const { data: player, isLoading: playerLoading, refetch } = useTourPlayer(playerId || '');
  const { data: playerStats } = useSinglePlayerStatistics(playerId);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [playerId]);

  if (playerLoading) {
    return (
      <TourHubShell>
        <ShellSlot dark>
          <div style={SHELL_SLOT_BG}>
            <Kicker color="amber">Player</Kicker>
            <Skeleton className="h-5 w-40" style={{ background: INK_TINT_06 }} />
          </div>
        </ShellSlot>
        <div style={{ paddingTop: 'var(--chrome-total-h, 0px)' }}>
          <div style={{ background: SLATE_50, padding: '16px' }}>
            <Skeleton className="h-24 w-full rounded-xl" style={{ background: GOLD_TINT_10 }} />
          </div>
          <div style={{ padding: '16px', marginTop: 8 }}>
            <Skeleton className="h-48 rounded-lg" style={{ background: INK_TINT_06 }} />
            <Skeleton className="h-64 rounded-lg mt-4" style={{ background: INK_TINT_06 }} />
          </div>
        </div>
      </TourHubShell>
    );
  }

  if (!player) {
    return (
      <TourHubShell>
        <ShellSlot dark>
          <div style={SHELL_SLOT_BG}>
            <Kicker color="amber">Player</Kicker>
            <h1 style={SHELL_H1_STYLE}>Player Profile</h1>
          </div>
        </ShellSlot>
        <div style={{ paddingTop: 'var(--chrome-total-h, 0px)' }} className="px-5">
          <div className="text-center py-20 flex flex-col items-center gap-3">
            <AlertCircle className="w-10 h-10 text-muted-foreground" />
            <p className="text-muted-foreground text-lg font-medium">Couldn't load player data</p>
            <p className="text-sm text-muted-foreground">Tap to try again</p>
            <button
              onClick={() => refetch()}
              className="mt-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium active:opacity-70 transition-opacity"
            >
              Retry
            </button>
          </div>
        </div>
      </TourHubShell>
    );
  }

  const tourBadge = getTourBadgeText(player.tour_codes?.[0]);

  return (
    <TourHubShell>
      <ShellSlot dark>
        <div style={SHELL_SLOT_BG}>
          <Kicker color="light">{tourBadge}</Kicker>
          <h1 style={SHELL_H1_STYLE}>{player.full_name}</h1>
        </div>
      </ShellSlot>

      <div style={{ paddingTop: 'var(--chrome-total-h, 0px)', background: SLATE_50 }}>
        {/* Hero */}
        <PlayerHero player={player} playerStats={playerStats ?? null} />

        {/* Form section */}
        {playerId && <FormSection playerId={playerId} />}

        {/* Content sections */}
        <div style={{ paddingBottom: 'calc(var(--sab, env(safe-area-inset-bottom, 0px)) + 80px)' }}>
          <motion.div
            style={{ marginTop: 8 }}
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.4 }}
          >
            {playerStats ? (
              <PlayerSeasonStats playerStats={playerStats} />
            ) : (
              <div className="py-16 text-center">
                <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-7 h-7 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">Season Statistics Unavailable</p>
                <p className="text-sm text-muted-foreground mt-1">
                  No season statistics found for this player.
                </p>
              </div>
            )}
          </motion.div>

          {playerId && (
            <motion.div
              style={{ marginTop: 8 }}
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <PlayerTournamentHistory playerId={playerId} playerName={player.full_name} />
            </motion.div>
          )}

          <motion.div
            style={{ marginTop: 8 }}
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <PlayerInfoCard player={player} />
          </motion.div>

          <div style={{ marginTop: 8 }} />
        </div>
      </div>
    </TourHubShell>
  );
}
