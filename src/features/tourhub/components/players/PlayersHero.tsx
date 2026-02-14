/**
 * PlayersHero - Immersive full-bleed #1 player hero.
 * Shows the #1 ranked player with dark glass runner strip.
 */

import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { resolvePhotoUrl } from '../../utils/resolvePhotoUrl';
import { countryCodeToFlag, titleCaseCountry } from '../../utils/countryFlags';
import type { ElitePlayer } from '../../hooks/useElitePlayers';
import type { PlayerTourCode } from './PlayersTourFilter';
import { TOUR_LABELS } from './PlayersTourFilter';

interface PlayersHeroProps {
  players: ElitePlayer[];
  activeTour: PlayerTourCode;
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

function StatPill({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col items-center px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm">
      <span className={cn(
        "font-mono text-base font-bold leading-tight",
        highlight ? "text-amber-400" : "text-white"
      )}>
        {value}
      </span>
      <span className="text-[10px] text-white/60 uppercase tracking-wider font-medium mt-0.5">
        {label}
      </span>
    </div>
  );
}

/** Runner pill card with dark glass background for readability */
function RunnerPill({ player, rank }: { player: ElitePlayer; rank: number }) {
  const photoUrl = resolvePhotoUrl(player.photoUrl, player.pgaTourId);
  const flag = countryCodeToFlag(player.countryCode);
  const initials = getInitials(player.playerName);

  return (
    <Link
      to={`/tourhub/player/${player.playerId}`}
      className="flex-shrink-0 flex items-center gap-2.5 px-3 py-2 rounded-xl active:scale-[0.97] transition-transform"
      style={{
        scrollSnapAlign: 'start',
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
      }}
    >
      <span className={cn(
        "w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0",
        rank === 2 ? "bg-white/20 text-white" : "bg-white/10 text-white/70"
      )}>
        {rank}
      </span>

      <SquircleAvatar
        src={photoUrl}
        alt={player.playerName}
        fallback={initials}
        size="sm"
        hideRing
      />

      <div className="min-w-0">
        <p className="text-sm font-semibold text-white truncate max-w-[120px]">
          {player.playerName}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          {flag && <span className="text-xs">{flag}</span>}
          {player.avgPoints != null && (
            <span className="font-mono text-xs text-white/60">
              {player.avgPoints.toFixed(1)} pts
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function PlayersHero({ players, activeTour }: PlayersHeroProps) {
  if (players.length === 0) return null;

  const champion = players[0];
  const runners = players.slice(1, 5);
  const photoUrl = resolvePhotoUrl(champion.photoUrl, champion.pgaTourId, 'hero');
  const flag = countryCodeToFlag(champion.countryCode);
  const country = titleCaseCountry(champion.country);
  const initials = getInitials(champion.playerName);

  const heroLabel = activeTour === 'all'
    ? '#1 · World'
    : `#1 · ${TOUR_LABELS[activeTour]}`;

  return (
    <div className="space-y-0">
      <AnimatePresence mode="wait">
        <motion.div
          key={champion.playerId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Link
            to={`/tourhub/player/${champion.playerId}`}
            className="block active:scale-[0.995] transition-transform"
          >
            <div className="relative w-full overflow-hidden rounded-2xl" style={{ minHeight: '340px' }}>
              {photoUrl ? (
                <motion.img
                  src={photoUrl}
                  alt={champion.playerName}
                  className="absolute inset-0 w-full h-full object-cover object-top"
                  loading="eager"
                  initial={{ scale: 1.06 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 12, ease: 'linear' }}
                />
              ) : (
                <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-foreground/70 to-foreground flex items-center justify-center">
                  <span className="text-7xl font-bold text-background/30">{initials}</span>
                </div>
              )}

              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to bottom, transparent 20%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.8) 85%, rgba(0,0,0,0.95) 100%)',
                }}
              />

              <div className="absolute bottom-0 left-0 right-0 p-5 pb-6 space-y-2">
                <motion.span
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.4 }}
                  className="inline-block text-sm font-semibold text-amber-400"
                >
                  {heroLabel}
                </motion.span>

                <motion.h2
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="text-3xl font-bold text-white leading-tight"
                >
                  {champion.playerName}
                </motion.h2>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.4 }}
                  className="flex items-center gap-2"
                >
                  {flag && <span className="text-lg">{flag}</span>}
                  <span className="text-sm text-white/80">{country}</span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="flex gap-2 pt-1"
                >
                  {champion.avgPoints != null && (
                    <StatPill label="AVG PTS" value={champion.avgPoints.toFixed(2)} highlight />
                  )}
                  {champion.rankChange != null && champion.rankChange !== 0 && (
                    <StatPill
                      label="RANK Δ"
                      value={champion.rankChange > 0 ? `+${champion.rankChange}` : String(champion.rankChange)}
                    />
                  )}
                </motion.div>
              </div>
            </div>
          </Link>

          {runners.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.35 }}
              className="-mt-4 mx-1"
            >
              <div
                className="flex gap-2.5 overflow-x-auto pb-2 px-1 scrollbar-hide"
                style={{
                  scrollSnapType: 'x mandatory',
                  WebkitOverflowScrolling: 'touch',
                  scrollbarWidth: 'none',
                  maskImage: 'linear-gradient(to right, transparent, black 8px, black calc(100% - 8px), transparent)',
                  WebkitMaskImage: 'linear-gradient(to right, transparent, black 8px, black calc(100% - 8px), transparent)',
                }}
              >
                {runners.map((player) => (
                  <RunnerPill key={player.playerId} player={player} rank={player.worldRank} />
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
