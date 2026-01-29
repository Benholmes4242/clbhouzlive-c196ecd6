/**
 * CinematicPodium - Apple-grade Premium Podium Display
 * 
 * Phase 5: Premium podium with metallic gradients for Leaders tab
 * Features:
 * - Olympic-style stepped podium layout
 * - Metallic gradient badges (Gold/Silver/Bronze)
 * - Glassmorphic player cards
 * - Ken Burns subtle animations
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlayerAvatar } from '../PlayerAvatar';
import { resolvePhotoUrl } from '../../utils/resolvePhotoUrl';

interface PodiumPlayer {
  id: string;
  player_id: string;
  player?: {
    full_name: string;
    country?: string | null;
    photo_url?: string | null;
  };
  displayRank: number;
  value: number | null;
}

interface CinematicPodiumProps {
  players: PodiumPlayer[];
  formatValue: (value: number) => string;
  isWorldRank?: boolean;
  className?: string;
}

function toTitleCase(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Metallic gradient styles for each position
const PODIUM_STYLES = {
  1: {
    gradient: 'from-amber-400 via-yellow-500 to-amber-600',
    bgGradient: 'from-amber-500/20 via-yellow-500/10 to-transparent',
    ring: 'ring-amber-400/60',
    glow: 'shadow-amber-500/40',
    textColor: '#C1A84C',
    height: 'h-[280px]',
    avatarSize: 'w-24 h-24',
    order: 'order-2',
  },
  2: {
    gradient: 'from-slate-300 via-zinc-200 to-slate-400',
    bgGradient: 'from-slate-300/15 via-zinc-200/10 to-transparent',
    ring: 'ring-slate-300/50',
    glow: 'shadow-slate-300/30',
    textColor: '#B8C6C9',
    height: 'h-[240px]',
    avatarSize: 'w-20 h-20',
    order: 'order-1',
  },
  3: {
    gradient: 'from-orange-400 via-amber-600 to-orange-700',
    bgGradient: 'from-orange-400/15 via-amber-600/10 to-transparent',
    ring: 'ring-orange-400/50',
    glow: 'shadow-orange-400/30',
    textColor: '#8B7355',
    height: 'h-[220px]',
    avatarSize: 'w-18 h-18',
    order: 'order-3',
  },
} as const;

function PodiumSlot({ 
  player, 
  position, 
  formatValue, 
  isWorldRank 
}: { 
  player: PodiumPlayer; 
  position: 1 | 2 | 3; 
  formatValue: (value: number) => string;
  isWorldRank?: boolean;
}) {
  const style = PODIUM_STYLES[position];
  const photoUrl = resolvePhotoUrl(player.player?.photo_url);
  const formattedCountry = toTitleCase(player.player?.country || '');
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: position === 1 ? 0.1 : position === 2 ? 0 : 0.2,
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1]
      }}
      className={cn("flex-1", style.order)}
    >
      <Link
        to={`/tourhub/player/${player.player_id}`}
        className="block group"
      >
        <div
          className={cn(
            "relative flex flex-col items-center justify-end",
            "rounded-t-3xl overflow-hidden",
            "bg-gradient-to-t from-zinc-900/90 to-zinc-800/50",
            "border border-white/10 border-b-0",
            "backdrop-blur-xl",
            style.height,
            "transition-transform duration-300",
            "group-hover:-translate-y-2"
          )}
        >
          {/* Subtle gradient background */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-t",
            style.bgGradient,
            "opacity-60"
          )} />
          
          {/* Crown for #1 */}
          {position === 1 && (
            <motion.div
              initial={{ scale: 0, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
              className="absolute top-4 z-20"
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                "bg-gradient-to-br", style.gradient,
                "shadow-lg", style.glow
              )}>
                <Crown className="w-5 h-5 text-white" />
              </div>
            </motion.div>
          )}
          
          {/* Content */}
          <div className="relative z-10 flex flex-col items-center pb-5 px-3">
            {/* Avatar with metallic ring */}
            <div className="relative mb-3">
              <div className={cn(
                "absolute -inset-1 rounded-full",
                "bg-gradient-to-br", style.gradient,
                "opacity-80 blur-sm"
              )} />
              <div className={cn(
                style.avatarSize,
                "rounded-full bg-zinc-700 flex items-center justify-center overflow-hidden",
                "ring-2", style.ring,
                "relative"
              )}>
                {photoUrl ? (
                  <img 
                    src={photoUrl}
                    alt={player.player?.full_name || ''}
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <span className="text-xl font-bold text-white/80">
                    {getInitials(player.player?.full_name || '')}
                  </span>
                )}
              </div>
            </div>
            
            {/* Rank Badge */}
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              "bg-gradient-to-br", style.gradient,
              "shadow-md", style.glow,
              "-mt-5 mb-2 relative z-10"
            )}>
              <span className="text-sm font-bold text-white">
                {isWorldRank ? `#${player.value}` : position}
              </span>
            </div>
            
            {/* Name */}
            <h3 className={cn(
              "font-bold text-white text-center leading-tight truncate w-full",
              position === 1 ? "text-base" : "text-sm"
            )}>
              {player.player?.full_name}
            </h3>
            
            {/* Country */}
            <p className="text-xs text-white/60 mt-0.5 truncate w-full text-center">
              {formattedCountry}
            </p>
            
            {/* Value */}
            {!isWorldRank && player.value !== null && (
              <p 
                className="text-lg font-bold mt-2"
                style={{ color: style.textColor }}
              >
                {formatValue(player.value)}
              </p>
            )}
          </div>
        </div>
        
        {/* Podium Base */}
        <div className={cn(
          "h-3 rounded-b-lg",
          "bg-gradient-to-r", style.gradient
        )} />
      </Link>
    </motion.div>
  );
}

export function CinematicPodium({ 
  players, 
  formatValue, 
  isWorldRank,
  className 
}: CinematicPodiumProps) {
  if (players.length < 3) return null;
  
  const top3 = players.slice(0, 3);
  
  return (
    <div className={cn("px-2", className)}>
      <div className="flex items-end gap-2">
        {/* Position 2 (left) */}
        <PodiumSlot 
          player={top3[1]} 
          position={2} 
          formatValue={formatValue}
          isWorldRank={isWorldRank}
        />
        
        {/* Position 1 (center, tallest) */}
        <PodiumSlot 
          player={top3[0]} 
          position={1} 
          formatValue={formatValue}
          isWorldRank={isWorldRank}
        />
        
        {/* Position 3 (right) */}
        <PodiumSlot 
          player={top3[2]} 
          position={3} 
          formatValue={formatValue}
          isWorldRank={isWorldRank}
        />
      </div>
    </div>
  );
}

export default CinematicPodium;
