/**
 * PlayersHero - Immersive full-bleed #1 player hero.
 * Runner row matches WorldRankingsShowcase style (photo-first horizontal scroll).
 */

import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { resolvePhotoUrl, getPgaTourHeadshotUrl } from '../../utils/resolvePhotoUrl';
import { countryCodeToFlag, titleCaseCountry } from '../../utils/countryFlags';
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

/** Runner card — matches TourHubNavOverlay World Rankings row style */
function RunnerCard({ player, index }: { player: ElitePlayer; index: number }) {
  const pgaHeadshot = player.pgaTourId ? getPgaTourHeadshotUrl(player.pgaTourId) : null;
  const photoUrl = pgaHeadshot || resolvePhotoUrl(player.photoUrl, player.pgaTourId);
  const rank = player.worldRank;
  const isFirst = index === 0;
  const lastName = player.playerName.split(' ').slice(-1)[0];
  const country = titleCaseCountry(player.country);

  const rankColors = isFirst
    ? 'linear-gradient(135deg, #D97706 0%, #B45309 100%)'
    : index === 1
    ? 'linear-gradient(135deg, #94A3B8 0%, #64748B 100%)'
    : 'linear-gradient(135deg, #B45309 0%, #92400E 100%)';

  return (
    <Link
      to={`/tourhub/player/${player.playerId}`}
      className="flex-shrink-0 flex items-center gap-2.5 px-3 py-2.5 rounded-2xl active:scale-[0.97] transition-transform"
      style={{
        scrollSnapAlign: 'start',
        background: isFirst
          ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.12) 0%, rgba(245, 158, 11, 0.08) 100%)'
          : 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: isFirst
          ? '1.5px solid rgba(245, 158, 11, 0.35)'
          : '1px solid rgba(255, 255, 255, 0.5)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04), 0 0 1px rgba(0, 0, 0, 0.08)',
        minWidth: '140px',
      }}
    >
      {/* Rank Badge */}
      <div
        className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
        style={{ background: rankColors, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)' }}
      >
        <span className="text-xs font-bold text-white">{rank}</span>
      </div>

      {/* Avatar — squircle */}
      <div
        className="flex-shrink-0 overflow-hidden border border-border/50"
        style={{ width: '36px', height: '36px', borderRadius: '11px' }}
      >
        {photoUrl ? (
          <div className="relative w-full h-full">
            <div className="absolute inset-0 bg-muted" />
            <img
              src={photoUrl}
              alt={player.playerName}
              className="relative z-10 w-full h-full object-cover"
              loading="lazy"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
        ) : (
          <div className="w-full h-full bg-muted" />
        )}
      </div>

      {/* Name & Country */}
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-semibold text-foreground truncate">{lastName}</p>
        <p className="text-[10px] text-muted-foreground truncate">{country || 'Unknown'}</p>
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

  // 10% taller hero: clamp(282px, 53vh, 422px)
  return (
    <div className="relative">
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
            {/* Straight-edge hero (no rounded corners) */}
            <div className="relative w-full overflow-hidden" style={{ height: 'clamp(282px, 53vh, 422px)' }}>
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

              {/* Subtle gradient for text legibility */}
              <div className="absolute inset-0" style={{
                background: 'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.55) 100%)',
              }} />

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
              </div>
            </div>
          </Link>

          {/* Runner row — overlaps the hero by ~20% */}
          {runners.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.35 }}
              className="px-4"
              style={{ marginTop: '-84px', position: 'relative', zIndex: 10 }}
            >
              <div
                className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide"
                style={{
                  WebkitOverflowScrolling: 'touch',
                  scrollbarWidth: 'none',
                  scrollSnapType: 'x mandatory',
                }}
              >
                {runners.map((player, index) => (
                  <RunnerCard key={player.playerId} player={player} index={index} />
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
