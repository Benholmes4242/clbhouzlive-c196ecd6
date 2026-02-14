/**
 * PlayersHero - Immersive full-bleed #1 player hero.
 * Runner row matches WorldRankingsShowcase style (photo-first horizontal scroll).
 */

import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { resolvePhotoUrl } from '../../utils/resolvePhotoUrl';
import { countryCodeToFlag, titleCaseCountry } from '../../utils/countryFlags';
import CountryFlag from '@/components/ui/country-flag';
import type { ElitePlayer } from '../../hooks/useElitePlayers';
import type { PlayerTourCode } from './PlayersTourFilter';
import { TOUR_LABELS } from './PlayersTourFilter';

interface PlayersHeroProps {
  players: ElitePlayer[];
  activeTour: PlayerTourCode;
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

/** Runner item — matches WorldRankingsShowcase style (photo-first, minimal text) */
function RunnerItem({ player, rank }: { player: ElitePlayer; rank: number }) {
  const photoUrl = resolvePhotoUrl(player.photoUrl, player.pgaTourId);

  return (
    <Link
      to={`/tourhub/player/${player.playerId}`}
      className="flex-shrink-0 w-[72px] text-center snap-start active:scale-[0.97] transition-transform"
    >
      {/* Photo */}
      <div className="w-[72px] h-[72px] rounded-2xl overflow-hidden mb-2 mx-auto bg-gradient-to-br from-slate-200 to-slate-300">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={player.playerName}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-muted" />
        )}
      </div>

      {/* Rank */}
      <div className="flex items-center justify-center gap-1 mb-0.5">
        <span className={cn(
          "text-xs font-bold",
          rank === 1 ? "text-amber-500" :
          rank === 2 ? "text-slate-400" :
          rank === 3 ? "text-amber-600" : "text-slate-400"
        )}>
          #{rank}
        </span>
      </div>

      <p className="text-sm font-semibold text-foreground truncate px-1">
        {player.playerName.split(' ').pop()}
      </p>

      {/* Country flag */}
      <div className="flex items-center justify-center mt-0.5">
        <CountryFlag country={player.country} size="sm" />
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

  const heroLabel = activeTour === 'all'
    ? '#1 · World'
    : `#1 · ${TOUR_LABELS[activeTour]}`;

  return (
    <div className="space-y-4">
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
            <div className="relative w-full overflow-hidden rounded-2xl" style={{ height: 'clamp(256px, 48vh, 384px)' }}>
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
                <div className="absolute inset-0 w-full h-full bg-muted" />
              )}

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

          {/* Runner row — WorldRankingsShowcase style */}
          {runners.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.35 }}
              className="mt-4"
            >
              <div
                className="flex gap-4 overflow-x-auto pb-2 px-1 scrollbar-hide snap-x snap-mandatory"
                style={{
                  WebkitOverflowScrolling: 'touch',
                  scrollbarWidth: 'none',
                }}
              >
                {runners.map((player) => (
                  <RunnerItem key={player.playerId} player={player} rank={player.worldRank} />
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
