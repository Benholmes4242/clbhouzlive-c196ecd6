/**
 * PlayerHero - Immersive full-bleed hero with gradient scrim,
 * overlaid player identity, glass rank pills, and Ken Burns animation.
 */

import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowLeft, Share2, Globe } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { resolvePhotoUrl } from '../../utils/resolvePhotoUrl';
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

  const heroPhotoUrl = resolvePhotoUrl(player.photo_url, player.pga_tour_id, 'hero');

  // No initials fallback per SDS rules

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
    // If we have history, go back — otherwise fallback to players tab
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
      // User cancelled or not supported — silently ignore
    }
  }, [player.full_name]);

  return (
    <div ref={heroRef} className="relative w-full overflow-hidden" style={{ height: 'calc(clamp(282px, 53vh, 422px) + max(var(--sat, env(safe-area-inset-top, 0px)), 47px))' }}>
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

      {/* Gradient scrim */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

      {/* Glass Back button — 44px squircle matching standard */}
      <button
        onClick={handleBack}
        className="absolute z-10 h-11 w-11 rounded-md flex items-center justify-center bg-black/20 backdrop-blur-sm hover:bg-black/40 active:scale-95 transition-all"
        style={{
          top: 'calc(1rem + max(var(--sat, env(safe-area-inset-top, 0px)), 47px))',
          left: '16px',
        }}
      >
        <ArrowLeft className="w-5 h-5 text-white" />
      </button>

      {/* Share button — top right */}
      <motion.button
        onClick={handleShare}
        className="absolute z-10 flex items-center justify-center w-9 h-9 rounded-full"
        style={{
          top: 'calc(max(var(--sat, env(safe-area-inset-top, 0px)), 47px) + 4px)',
          right: '16px',
          background: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.15)',
        }}
        whileTap={{ scale: 0.9 }}
      >
        <Share2 className="w-4 h-4 text-white" />
      </motion.button>

      {/* Overlay Content — bottom of hero */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 px-5 pb-8 z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {/* Player Name */}
        <h1 className="text-3xl font-bold text-white mb-1.5 leading-tight">
          {player.full_name}
        </h1>

        {/* Country + Age */}
        <div className="flex items-center gap-2 text-sm text-white/80 mb-3">
          {countryDisplay && (
            <span className="flex items-center gap-1.5">
              {flag ? (
                <span className="text-lg leading-none">{flag}</span>
              ) : (
                <Globe className="w-4 h-4" />
              )}
              {countryDisplay}
            </span>
          )}
          {age && (
            <>
              <span className="text-white/40">•</span>
              <span>Age {age}</span>
            </>
          )}
        </div>

        {/* Glass Rank Pills */}
        <div className="flex flex-wrap gap-2">
          {playerStats?.world_rank && playerStats.world_rank > 0 && (
            <motion.span
              className={cn(
                "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-white",
              )}
              style={{
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.2)',
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
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
              style={{
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.2)',
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

      {/* World #1 gold shimmer at bottom edge */}
      {isWorldNo1 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400" />
      )}
    </div>
  );
}