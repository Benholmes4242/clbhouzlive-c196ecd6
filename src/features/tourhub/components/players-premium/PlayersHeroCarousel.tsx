/**
 * PlayersHeroCarousel - Premium spotlight carousel for top players
 * Full-bleed cinematic cards with Ken Burns effect
 */

import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Globe, Trophy, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassCard, RankBadge } from '../premium';
import { PlayerAvatar } from '../PlayerAvatar';
import type { WorldRankedPlayer } from '../../hooks/useWorldRankings';

interface PlayersHeroCarouselProps {
  players: WorldRankedPlayer[];
  className?: string;
}

// Country flag helper
function getCountryFlag(country: string | null): string {
  if (!country) return '';
  const countryToFlag: Record<string, string> = {
    'UNITED STATES': '🇺🇸', 'USA': '🇺🇸', 'ENGLAND': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'SCOTLAND': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    'IRELAND': '🇮🇪', 'AUSTRALIA': '🇦🇺', 'JAPAN': '🇯🇵', 'KOREA': '🇰🇷', 'SOUTH KOREA': '🇰🇷',
    'SPAIN': '🇪🇸', 'SOUTH AFRICA': '🇿🇦', 'SWEDEN': '🇸🇪', 'NORWAY': '🇳🇴',
  };
  const upper = country?.toUpperCase() || '';
  return countryToFlag[upper] || '🏳️';
}

export function PlayersHeroCarousel({ players, className }: PlayersHeroCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 320;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };
  
  if (!players.length) return null;
  
  // Take top 10 for spotlight
  const spotlightPlayers = players.slice(0, 10);
  
  return (
    <section className={cn('relative -mx-4 sm:-mx-6 lg:-mx-8', className)}>
      {/* Section Header */}
      <div className="px-4 sm:px-6 lg:px-8 mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-th-accent" />
            World's Best
          </h2>
          <p className="text-sm text-white/60">Top 10 Official World Golf Ranking</p>
        </div>
        
        {/* Scroll Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
      
      {/* Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide px-4 sm:px-6 lg:px-8 pb-4 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {spotlightPlayers.map((player, idx) => (
          <motion.div
            key={player.playerId}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: idx * 0.05 }}
            className="shrink-0 snap-start"
          >
            <Link to={`/tourhub/player/${player.playerId}`}>
              <div className="relative w-[280px] h-[180px] rounded-2xl overflow-hidden group">
                {/* Background gradient */}
                <div 
                  className={cn(
                    'absolute inset-0',
                    idx === 0 && 'bg-gradient-to-br from-yellow-500/30 via-amber-600/20 to-transparent',
                    idx === 1 && 'bg-gradient-to-br from-slate-400/30 via-slate-500/20 to-transparent',
                    idx === 2 && 'bg-gradient-to-br from-amber-700/30 via-amber-800/20 to-transparent',
                    idx > 2 && 'bg-gradient-to-br from-th-glass-bg via-surface-card/50 to-transparent'
                  )}
                />
                
                {/* Glass overlay */}
                <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />
                
                {/* Content */}
                <div className="relative h-full p-4 flex flex-col justify-between">
                  {/* Top: Rank + Country */}
                  <div className="flex items-start justify-between">
                    <RankBadge rank={player.worldRank || idx + 1} size="lg" />
                    <span className="text-2xl">{getCountryFlag(player.country)}</span>
                  </div>
                  
                  {/* Bottom: Player Info */}
                  <div className="flex items-end gap-3">
                    <PlayerAvatar
                      playerId={player.playerId}
                      playerName={player.playerName}
                      fallbackPhotoUrl={player.photoUrl}
                      size="lg"
                      className="ring-2 ring-white/20 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-lg truncate group-hover:text-th-accent transition-colors">
                        {player.playerName}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        {player.earnings && player.earnings > 0 && (
                          <span className="flex items-center gap-1 text-xs text-white/60">
                            <Trophy className="w-3 h-3 text-yellow-400" />
                            ${(player.earnings / 1_000_000).toFixed(1)}M
                          </span>
                        )}
                        {player.top10s && player.top10s > 0 && (
                          <span className="flex items-center gap-1 text-xs text-white/60">
                            <TrendingUp className="w-3 h-3 text-green-400" />
                            {player.top10s} Top 10s
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Hover effect */}
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
