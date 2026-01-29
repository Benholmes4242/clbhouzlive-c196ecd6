/**
 * CinematicWorldTop5 - Apple-grade World Top 5 Showcase
 * 
 * Light theme page with dark cinematic cards for premium player showcase
 */

import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlayerAvatar } from '../PlayerAvatar';

interface WorldRankedPlayer {
  playerId: string;
  playerName: string;
  worldRank: number;
  country?: string | null;
  photoUrl?: string | null;
  avgPoints?: number;
}

interface CinematicWorldTop5Props {
  players: WorldRankedPlayer[];
  className?: string;
}

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Metallic gradient colors for podium positions
const RANK_STYLES = {
  1: {
    bg: 'from-amber-400 via-yellow-500 to-amber-600',
    glow: 'shadow-amber-400/40',
    ring: 'ring-amber-400/50',
    text: '#C1A84C',
  },
  2: {
    bg: 'from-slate-300 via-zinc-200 to-slate-400',
    glow: 'shadow-slate-300/30',
    ring: 'ring-slate-300/40',
    text: '#B8C6C9',
  },
  3: {
    bg: 'from-orange-400 via-amber-600 to-orange-700',
    glow: 'shadow-orange-400/30',
    ring: 'ring-orange-400/40',
    text: '#8B7355',
  },
} as const;

// Champion Card - Large featured card for #1 (dark styling)
function ChampionCard({ player }: { player: WorldRankedPlayer }) {
  const formattedCountry = player.country ? toTitleCase(player.country) : '';
  const rankStyle = RANK_STYLES[1];
  
  return (
    <Link
      to={`/tourhub/player/${player.playerId}`}
      className="block group"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "relative overflow-hidden rounded-3xl",
          "bg-gradient-to-br from-zinc-900 via-zinc-800 to-black",
          "border border-white/10",
          "shadow-2xl",
          "min-h-[320px]"
        )}
      >
        {/* Ken Burns Background */}
        <motion.div
          className="absolute inset-0"
          animate={{ scale: [1, 1.05] }}
          transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-transparent to-black/80" />
        </motion.div>
        
        {/* Cinematic Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40 z-10" />
        
        {/* Gold Crown Badge - Top Left */}
        <div className="absolute top-5 left-5 z-20">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center",
              "bg-gradient-to-br", rankStyle.bg,
              "shadow-lg", rankStyle.glow
            )}
          >
            <Crown className="w-7 h-7 text-white" />
          </motion.div>
        </div>
        
        {/* World Rank Badge - Top Right */}
        <div className="absolute top-5 right-5 z-20">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="px-4 py-2 rounded-full backdrop-blur-xl bg-white/10 border border-white/20"
          >
            <span className="text-sm font-bold text-white tracking-wide">
              WORLD #1
            </span>
          </motion.div>
        </div>
        
        {/* Content */}
        <div className="relative z-20 h-full flex flex-col justify-end p-6">
          <div className="flex items-end gap-5">
            {/* Large Avatar with Gold Ring */}
            <div className="relative">
              <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 opacity-60 blur-xl" />
              <PlayerAvatar
                playerId={player.playerId}
                playerName={player.playerName}
                fallbackPhotoUrl={player.photoUrl}
                size="2xl"
                className={cn(
                  "relative border-4 border-amber-400/60",
                  "shadow-xl", rankStyle.glow
                )}
              />
            </div>
            
            {/* Player Info */}
            <div className="flex-1 min-w-0 pb-2">
              <h2 className="text-3xl font-bold text-white tracking-tight leading-tight">
                {player.playerName}
              </h2>
              <p className="text-lg text-white/70 mt-1">
                {formattedCountry}
              </p>
              {player.avgPoints && (
                <div className="flex items-baseline gap-2 mt-3">
                  <span 
                    className="text-2xl font-bold"
                    style={{ color: rankStyle.text }}
                  >
                    {player.avgPoints.toFixed(2)}
                  </span>
                  <span className="text-sm text-white/50">avg pts</span>
                </div>
              )}
            </div>
          </div>
          
          {/* CTA Arrow */}
          <motion.div
            className="absolute bottom-6 right-6"
            whileHover={{ x: 4 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 group-hover:bg-white/20 transition-colors">
              <ChevronRight className="w-6 h-6 text-white" />
            </div>
          </motion.div>
        </div>
        
        {/* Hover Glow Effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-5">
          <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 to-transparent" />
        </div>
      </motion.div>
    </Link>
  );
}

// Compact Card - For #2-5 in horizontal scroll (dark styling)
function CompactRankCard({ player, index }: { player: WorldRankedPlayer; index: number }) {
  const formattedCountry = player.country ? toTitleCase(player.country) : '';
  const rankNum = player.worldRank as 1 | 2 | 3;
  const rankStyle = RANK_STYLES[rankNum] || {
    bg: 'from-zinc-500 to-zinc-700',
    glow: 'shadow-zinc-400/20',
    ring: 'ring-zinc-400/30',
    text: '#71717a',
  };
  
  return (
    <Link
      to={`/tourhub/player/${player.playerId}`}
      className="block flex-shrink-0 snap-start group"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 * index, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ y: -6, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "relative w-[160px] h-[220px] overflow-hidden rounded-2xl",
          "bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900",
          "border border-white/10",
          "shadow-xl"
        )}
      >
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
        
        {/* Rank Badge */}
        <div className="absolute top-3 left-3 z-20">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            "bg-gradient-to-br", rankStyle.bg,
            "shadow-md", rankStyle.glow
          )}>
            <span className="text-lg font-bold text-white">
              {player.worldRank}
            </span>
          </div>
        </div>
        
        {/* Content */}
        <div className="relative z-20 h-full flex flex-col justify-end p-4">
          {/* Avatar */}
          <div className="mb-3">
            <PlayerAvatar
              playerId={player.playerId}
              playerName={player.playerName}
              fallbackPhotoUrl={player.photoUrl}
              size="lg"
              className="border-2 border-white/20"
            />
          </div>
          
          {/* Player Info */}
          <h3 className="text-base font-bold text-white leading-tight truncate">
            {player.playerName}
          </h3>
          <p className="text-xs text-white/60 mt-0.5 truncate">
            {formattedCountry}
          </p>
          
          {/* Points */}
          {player.avgPoints && (
            <div className="flex items-baseline gap-1 mt-2">
              <span 
                className="text-lg font-bold"
                style={{ color: rankStyle.text }}
              >
                {player.avgPoints.toFixed(1)}
              </span>
              <span className="text-[10px] text-white/40">pts</span>
            </div>
          )}
        </div>
        
        {/* Hover Effect */}
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity z-15" />
      </motion.div>
    </Link>
  );
}

export function CinematicWorldTop5({ players, className }: CinematicWorldTop5Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  if (players.length === 0) return null;
  
  const champion = players[0];
  const runners = players.slice(1, 5);
  
  return (
    <div className={cn("space-y-5", className)}>
      {/* Section Header - Light theme text */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-gradient-to-b from-amber-400 to-amber-600" />
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">
            World's Best
          </h2>
        </div>
        <Link 
          to="/tourhub?tab=leaderboards&category=world_rank"
          className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1"
        >
          View All
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      
      {/* Champion Card - Full Width (dark styling) */}
      <ChampionCard player={champion} />
      
      {/* Runners Carousel - #2-5 (dark styling) */}
      {runners.length > 0 && (
        <div className="-mx-4">
          <div
            ref={scrollRef}
            className={cn(
              "flex gap-3 overflow-x-auto scrollbar-hide",
              "px-4 py-2",
              "snap-x snap-mandatory"
            )}
          >
            {runners.map((player, index) => (
              <CompactRankCard
                key={player.playerId}
                player={player}
                index={index}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CinematicWorldTop5;
