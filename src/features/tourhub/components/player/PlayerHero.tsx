/**
 * PlayerHero - Immersive full-bleed hero with gradient scrim,
 * overlaid player identity, glass rank pills, and Ken Burns animation.
 */

import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import { titleCaseCountry } from '../../utils/countryFlags';
import CountryFlag from '@/components/ui/country-flag';
import { openTourNav } from '../../contexts/TourNavContext';
import type { TourPlayer, TourPlayerStatistics } from '../../hooks/useTourHubData';

interface PlayerHeroProps {
  player: TourPlayer;
  playerStats: TourPlayerStatistics | null;
}

export function PlayerHero({ player, playerStats }: PlayerHeroProps) {
  const heroPhotoUrl = getPlayerHeadshotUrl(player.full_name, player.tour_codes?.[0] ?? 'pga');

  const age = player.birth_date
    ? Math.floor((Date.now() - new Date(player.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const countryDisplay = player.country ? titleCaseCountry(player.country) : null;
  const isWorldNo1 = playerStats?.world_rank === 1;

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: 'calc(45dvh + var(--sat, env(safe-area-inset-top, 0px)))' }}
    >
      {/* Hero Image or Fallback Gradient */}
      {heroPhotoUrl ? (
        <motion.img
          src={heroPhotoUrl}
          alt={player.full_name}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: 'center 5%' }}
          loading="eager"
          fetchPriority="high"
          initial={{ scale: 1.06 }}
          animate={{ scale: 1 }}
          transition={{ duration: 10, ease: 'linear' }}
          onError={(e) => { (e.target as HTMLImageElement).src = PLAYER_SILHOUETTE_URL; }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-800 via-emerald-900 to-slate-900" />
      )}

      {/* Gradient scrim — smooth multi-stop */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 35%, rgba(0,0,0,0.05) 60%, transparent 80%)',
        }}
      />

      {/* Burger menu — standard Tour Hub position */}
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); openTourNav(); }}
        aria-label="Open tour menu"
        className="fixed z-30 flex items-center justify-center"
        style={{ width: 44, height: 44, top: 'calc(var(--sat, env(safe-area-inset-top, 0px)) + 52px)', left: 16 }}
      >
        <Menu
          className="w-[24px] h-[24px]"
          strokeWidth={1.5}
          style={{ color: 'hsl(var(--foreground))', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.15))' }}
        />
      </button>

      {/* Overlay Content — bottom of hero */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 z-10 px-4"
        style={{ paddingBottom: '16px' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {/* Player Name — 28px, weight 700 */}
        <h1
          className="text-white"
          style={{
            fontSize: '28px',
            fontWeight: 700,
            letterSpacing: '-0.3px',
            lineHeight: 1.15,
            marginBottom: '4px',
          }}
        >
          {player.full_name}
        </h1>

        {/* Country + Age — 13px, weight 500 */}
        <div className="flex items-center gap-2" style={{ marginBottom: '8px' }}>
          {countryDisplay && (
            <span className="flex items-center gap-1.5" style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>
              <CountryFlag country={player.country} size="sm" />
              {countryDisplay}
            </span>
          )}
          {age && (
            <>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>·</span>
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>Age {age}</span>
            </>
          )}
        </div>

        {/* Glass Rank Pills */}
        <div className="flex flex-wrap" style={{ gap: '8px' }}>
          {playerStats?.world_rank && playerStats.world_rank > 0 && (
            <motion.span
              className="inline-flex items-center text-white rounded-full"
              style={{
                fontSize: '13px',
                fontWeight: 600,
                padding: '6px 14px',
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.15)',
                ...(isWorldNo1 ? {
                  boxShadow: '0 0 12px rgba(245,158,11,0.4)',
                  borderColor: 'rgba(245,158,11,0.5)',
                } : {}),
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.3 }}
            >
              #{playerStats.world_rank} World
            </motion.span>
          )}
          {playerStats?.fedex_rank && playerStats.fedex_rank > 0 && (
            <motion.span
              className="inline-flex items-center text-white rounded-full"
              style={{
                fontSize: '13px',
                fontWeight: 600,
                padding: '6px 14px',
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.3 }}
            >
              #{playerStats.fedex_rank} FedEx Cup
            </motion.span>
          )}
        </div>
      </motion.div>
    </div>
  );
}