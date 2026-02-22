/**
 * SpotlightReel - Cinematic edge-to-edge hero carousel
 * 
 * Features:
 * - Large cards (~85% viewport width)
 * - Auto-scroll every 6s (pauses on touch)
 * - Snap paging with subtle parallax
 * - Vignette/gradient backgrounds
 * - OWGR badge overlay
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { TourPlayer } from '../../hooks/useTourHubData';
import { PlayerAvatar } from '../PlayerAvatar';

interface SpotlightCardProps {
  player: TourPlayer;
  worldRank: number;
  isActive: boolean;
}

/**
 * Convert country to Title Case
 */
function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function SpotlightCard({ player, worldRank, isActive }: SpotlightCardProps) {
  const formattedCountry = player.country ? toTitleCase(player.country) : '';

  return (
    <Link
      to={`/tourhub/player/${player.id}`}
      className={cn(
        "group flex-shrink-0 snap-center",
        "w-[85vw] max-w-[340px] min-w-[280px]"
      )}
    >
      <motion.div
        initial={false}
        animate={{ 
          scale: isActive ? 1 : 0.95,
          opacity: isActive ? 1 : 0.7
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn(
          "relative overflow-hidden rounded-2xl",
          "bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900",
          "border border-white/10",
          "shadow-xl shadow-black/20",
          "h-[200px]"
        )}
      >
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 z-10" />
        
        {/* Vignette effect */}
        <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,0.4)] z-10 pointer-events-none" />

        {/* Content */}
        <div className="relative z-20 h-full flex flex-col justify-end p-5">
          {/* OWGR Badge - Top right */}
          <div className="absolute top-4 right-4">
            <div className={cn(
              "px-3 py-1.5 rounded-full text-sm font-bold",
              "backdrop-blur-md",
              worldRank === 1 
                ? "bg-amber-500/90 text-white shadow-lg shadow-amber-500/30" 
                : worldRank <= 3 
                  ? "bg-white/20 text-white border border-white/30"
                  : "bg-white/15 text-white/90 border border-white/20"
            )}>
              #{worldRank}
            </div>
          </div>

          {/* Player info section */}
          <div className="flex items-end gap-4">
            {/* Avatar with glow effect */}
            <div className="relative">
              <div className={cn(
                "absolute inset-0 rounded-full blur-xl opacity-30",
                worldRank === 1 ? "bg-amber-400" : "bg-white"
              )} />
              <PlayerAvatar
                playerId={player.id}
                playerName={player.full_name}
                
                size="xl"
                className="relative border-2 border-white/30"
              />
            </div>

            {/* Name and Country */}
            <div className="flex-1 min-w-0 pb-1">
              <h3 className="font-bold text-xl text-white leading-tight truncate">
                {player.full_name}
              </h3>
              <p className="text-sm text-white/70 mt-0.5 truncate">
                {formattedCountry}
              </p>
            </div>
          </div>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity z-15" />
      </motion.div>
    </Link>
  );
}

interface SpotlightReelProps {
  worldRankedPlayers: Array<{
    playerId: string;
    playerName: string;
    worldRank: number;
    country?: string | null;
    photoUrl?: string | null;
  }>;
  players: TourPlayer[];
  autoScrollInterval?: number;
}

export function SpotlightReel({ 
  worldRankedPlayers, 
  players, 
  autoScrollInterval = 6000 
}: SpotlightReelProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);

  // Get top 10 world-ranked players with their full player data
  const spotlightPlayers = players.length > 0 
    ? worldRankedPlayers
        .slice(0, 10)
        .map(wp => ({
          player: players.find(p => p.id === wp.playerId),
          worldRank: wp.worldRank,
        }))
        .filter((item): item is { player: TourPlayer; worldRank: number } => 
          item.player !== undefined
        )
    : [];

  // Auto-scroll logic
  const scrollToIndex = useCallback((index: number) => {
    if (!scrollRef.current || spotlightPlayers.length === 0) return;
    
    const container = scrollRef.current;
    const cards = container.querySelectorAll('[data-spotlight-card]');
    const targetCard = cards[index] as HTMLElement;
    
    if (targetCard) {
      const containerWidth = container.offsetWidth;
      const cardWidth = targetCard.offsetWidth;
      const cardLeft = targetCard.offsetLeft;
      const scrollTarget = cardLeft - (containerWidth - cardWidth) / 2;
      
      container.scrollTo({
        left: scrollTarget,
        behavior: 'smooth'
      });
    }
  }, [spotlightPlayers.length]);

  // Handle auto-scroll
  useEffect(() => {
    if (isPaused || spotlightPlayers.length <= 1) return;

    autoScrollRef.current = setInterval(() => {
      setActiveIndex(prev => {
        const next = (prev + 1) % spotlightPlayers.length;
        scrollToIndex(next);
        return next;
      });
    }, autoScrollInterval);

    return () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
    };
  }, [isPaused, spotlightPlayers.length, autoScrollInterval, scrollToIndex]);

  // Handle scroll events to update active index
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    
    const container = scrollRef.current;
    const containerCenter = container.scrollLeft + container.offsetWidth / 2;
    const cards = container.querySelectorAll('[data-spotlight-card]');
    
    let closestIndex = 0;
    let closestDistance = Infinity;
    
    cards.forEach((card, index) => {
      const cardElement = card as HTMLElement;
      const cardCenter = cardElement.offsetLeft + cardElement.offsetWidth / 2;
      const distance = Math.abs(containerCenter - cardCenter);
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    
    setActiveIndex(closestIndex);
  }, []);

  // Pause on touch/mouse interaction
  const handleInteractionStart = useCallback(() => {
    setIsPaused(true);
    if (autoScrollRef.current) {
      clearInterval(autoScrollRef.current);
      autoScrollRef.current = null;
    }
  }, []);

  const handleInteractionEnd = useCallback(() => {
    // Resume after 4 seconds of no interaction
    const timeoutId = setTimeout(() => setIsPaused(false), 4000);
    return () => clearTimeout(timeoutId);
  }, []);

  if (spotlightPlayers.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-foreground tracking-tight">
          World Rankings
        </h3>
        <div className="flex gap-1">
          {spotlightPlayers.slice(0, 5).map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setActiveIndex(index);
                scrollToIndex(index);
              }}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all duration-300",
                index === activeIndex 
                  ? "bg-primary w-4" 
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
              aria-label={`Go to player ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Carousel - Edge to edge */}
      <div className="-mx-4">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          onTouchStart={handleInteractionStart}
          onTouchEnd={handleInteractionEnd}
          onMouseDown={handleInteractionStart}
          onMouseUp={handleInteractionEnd}
          onMouseLeave={handleInteractionEnd}
          className={cn(
            "flex gap-3 overflow-x-auto scrollbar-hide",
            "px-4 py-2",
            "snap-x snap-mandatory scroll-smooth"
          )}
        >
          {spotlightPlayers.map(({ player, worldRank }, index) => (
            <div key={player.id} data-spotlight-card>
              <SpotlightCard
                player={player}
                worldRank={worldRank}
                isActive={index === activeIndex}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
