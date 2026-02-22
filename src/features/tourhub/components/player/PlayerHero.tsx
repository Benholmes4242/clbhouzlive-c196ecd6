/**
 * PlayerHero - Immersive full-bleed hero with gradient scrim,
 * overlaid player identity, glass rank pills, and Ken Burns animation.
 */

import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowLeft, Share2, Globe } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import { countryCodeToFlag, titleCaseCountry } from '../../utils/countryFlags';
import type { TourPlayer, TourPlayerStatistics } from '../../hooks/useTourHubData';

interface PlayerHeroProps {
  player: TourPlayer;
  playerStats: TourPlayerStatistics | null;
}

export function PlayerHero({ player, playerStats }: PlayerHeroProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const heroRef = useRef<HTMLDivElement>(null);

  const heroPhotoUrl = getPlayerHeadshotUrl(player.full_name, 'pga');

  const age = player.birth_date
    ? Math.floor((Date.now() - new Date(player.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const flag = countryCodeToFlag(player.country_code);
  const countryDisplay = player.country ? titleCaseCountry(player.country) : null;
  const isWorldNo1 = playerStats?.world_rank === 1;

  // Parallax on scroll
  const { scrollY } = useScroll();
  const imageY = useTransform(scrollY, [0, 400], [0, 80]);

  const handleBack = useCallback(() => {
    if (location.key !== 'default') {
      navigate(-1);
    } else {
      navigate('/tourhub?tab=players');
    }
  }, [navigate, location.key]);

  const handleShare = useCallback(async () => {
    try {
      await navigator.share({
        title: player.full_name,
        url: window.location.href,
      });
    } catch {
      // User cancelled or not supported
    }
  }, [player.full_name]);

  return (
    <div
      ref={heroRef}
      className="relative w-full overflow-hidden"
      style={{ height: 'clamp(380px, 55dvh, 550px)' }}
    >
      {/* Hero Image or Fallback Gradient */}
      {heroPhotoUrl ? (
        <motion.img
          src={heroPhotoUrl}
          alt={player.full_name}
          className="absolute inset-0 w-full h-full object-cover object-top"
          loading="eager"
          fetchPriority="high"
          initial={{ scale: 1.06 }}
          animate={{ scale: 1 }}
          transition={{ duration: 10, ease: 'linear' }}
          style={{ y: imageY }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-800 via-emerald-900 to-slate-900" />
      )}

      {/* Gradient scrim — per spec */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 40%, transparent 70%)',
        }}
      />

      {/* Back button — rounded-full, bg-white/10, backdrop-blur 8px */}
      <button
        onClick={handleBack}
        className="absolute z-10 rounded-full flex items-center justify-center active:scale-95 transition-all"
        style={{
          top: 'calc(1rem + max(var(--sat, env(safe-area-inset-top, 0px)), 47px))',
          left: '16px',
          width: '44px',
          height: '44px',
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        <ArrowLeft
          className="text-white"
          style={{
            width: '22px',
            height: '22px',
            filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))',
          }}
        />
      </button>

      {/* Share button — identical styling, top right */}
      <motion.button
        onClick={handleShare}
        className="absolute z-10 rounded-full flex items-center justify-center"
        style={{
          top: 'calc(1rem + max(var(--sat, env(safe-area-inset-top, 0px)), 47px))',
          right: '16px',
          width: '44px',
          height: '44px',
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
        whileTap={{ scale: 0.9 }}
      >
        <Share2
          className="text-white"
          style={{
            width: '20px',
            height: '20px',
            filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))',
          }}
        />
      </motion.button>

      {/* Overlay Content — bottom of hero */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 z-10 px-4"
        style={{ paddingBottom: '16px' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {/* Player Name — 26px, weight 800, tracking -0.3px */}
        <h1
          className="text-white"
          style={{
            fontSize: '26px',
            fontWeight: 800,
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
              {flag ? (
                <span className="text-lg leading-none">{flag}</span>
              ) : (
                <Globe className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.7)' }} />
              )}
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

        {/* Glass Rank Pills — rounded-full, bg-white/15, backdrop-blur 8px */}
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
              #{playerStats.fedex_rank} FedEx
            </motion.span>
          )}
        </div>
      </motion.div>

      {/* World #1 gold shimmer */}
      {isWorldNo1 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400" />
      )}
    </div>
  );
}
