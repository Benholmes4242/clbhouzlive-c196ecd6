/**
 * PrimaryHero — Single-winner hero with editorial focus
 * 
 * Selection priority:
 * 1. Live tournament (final round first)
 * 2. Major championship (upcoming)
 * 3. Most recent completed (with winner)
 * 4. Next upcoming
 * 
 * Carousel ONLY activates for simultaneous live events across tours.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu } from 'lucide-react';
import { openTourNav } from '../../contexts/TourNavContext';
import { cn } from '@/lib/utils';
import {
  useHeroCarouselData,
  type HeroSlide as CarouselSlide,
} from '../../hooks/useHeroCarouselData';
import { useTournamentTopLeaders, type LeaderEntry } from '../../hooks/useOverviewData';
import { useVenueImage, getFallbackCourseImage } from '../../hooks/useVenueImage';
import { resolvePhotoUrl } from '../../utils/resolvePhotoUrl';
import { differenceInDays, isToday, isTomorrow } from 'date-fns';
import '@/styles/hero-glass.css';

function getStartLabel(date: string): string {
  const d = new Date(date);
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  const days = differenceInDays(d, new Date());
  if (days <= 0) return 'Today';
  return `Starts in ${days} day${days > 1 ? 's' : ''}`;
}

function getScoreClass(score: number): string {
  if (score < 0) return 'score-under';
  if (score > 0) return 'score-over';
  return 'score-even';
}

// Compact leaderboard row
function LeaderRow({ leader, isFirst }: { leader: LeaderEntry; isFirst: boolean }) {
  const name = `${leader.player.firstName[0]}. ${leader.player.lastName}`;
  const photoUrl = resolvePhotoUrl(leader.player.photoUrl ?? null, null);
  const initials = `${leader.player.firstName[0]}${leader.player.lastName[0]}`.toUpperCase();

  return (
    <div className={cn('leaderboard-row flex items-center justify-between', !isFirst && 'border-t border-white/[0.04]')}>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="leaderboard-position flex-shrink-0">{leader.position}</span>
        <div className="w-5 h-5 rounded-full overflow-hidden flex-shrink-0 border border-white/10">
          {photoUrl ? (
            <img src={photoUrl} alt={name} className="w-full h-full object-cover object-top"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white/10">
              <span style={{ fontSize: '7px', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{initials}</span>
            </div>
          )}
        </div>
        <span className={cn('leaderboard-name truncate', isFirst && 'font-bold')}>{name}</span>
      </div>
      <span className={cn('leaderboard-score flex-shrink-0 ml-2', getScoreClass(leader.scoreToPar))}>
        {leader.scoreDisplay}
      </span>
    </div>
  );
}

// Individual hero slide
function HeroSlideView({
  slide,
  isActive,
  totalSlides,
  currentIndex,
  onDotClick,
}: {
  slide: CarouselSlide;
  isActive: boolean;
  totalSlides: number;
  currentIndex: number;
  onDotClick: (i: number) => void;
}) {
  const navigate = useNavigate();
  const { tournament, type } = slide;
  const { data: venueImage } = useVenueImage(tournament.venueName, tournament.venueCity);
  const isLive = type === 'live';
  const isCompleted = type === 'completed';

  // Top 5 leaders for live only
  const { data: leaders = [], isLoading: leadersLoading } = useTournamentTopLeaders(
    isLive ? tournament.id : null
  );

  const bgImage = venueImage?.imageUrl || getFallbackCourseImage(tournament.name);
  const hasRealImage = !!venueImage?.imageUrl;

  const gradients = [
    'from-emerald-800 via-green-700 to-emerald-900',
    'from-teal-800 via-emerald-700 to-cyan-900',
  ];

  // Winner photo for completed state
  const winnerPhotoUrl = isCompleted && tournament.winnerPhotoUrl
    ? resolvePhotoUrl(tournament.winnerPhotoUrl, tournament.winnerPgaTourId)
    : null;

  return (
    <motion.div
      className="absolute inset-0 cursor-pointer"
      onClick={() => navigate(`/tourhub/tournament/${tournament.id}`)}
      initial={{ opacity: 0 }}
      animate={{ opacity: isActive ? 1 : 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Background with Ken Burns */}
      <motion.div
        className="absolute inset-0 w-full h-full"
        initial={{ scale: 1.08, opacity: 0 }}
        animate={{ scale: isActive ? 1 : 1.08, opacity: isActive ? 1 : 0 }}
        transition={{
          opacity: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
          scale: { duration: 5, ease: 'linear' },
        }}
      >
        {hasRealImage ? (
          <img src={bgImage} alt={tournament.venueName || tournament.name}
            className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className={cn('absolute inset-0 w-full h-full bg-gradient-to-br', gradients[tournament.name.length % gradients.length])} />
        )}
      </motion.div>

      {/* Bottom gradient for text legibility */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.3) 100%)' }} />

      {/* Glass card */}
      <AnimatePresence mode="wait">
        {isActive && (
          <motion.div
            className="glass-card p-5"
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '16px',
              top: 'auto',
              minWidth: '280px',
              maxWidth: 'min(350px, calc(100% - 32px))',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
          >
            {/* Status + Tour Badge */}
            <div className="flex items-center justify-between mb-2">
              {isLive ? (
                <div className="flex items-center gap-1.5">
                  <span className="live-dot" style={{ animationDuration: '3s' }} />
                  <span className="live-text">LIVE</span>
                </div>
              ) : isCompleted ? (
                <span className="text-white/70 text-xs font-semibold uppercase tracking-wider">Winner</span>
              ) : (
                <span className="countdown-label">{getStartLabel(tournament.startDate)}</span>
              )}
              <div className="flex items-center" style={{ padding: '3px 8px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px' }}>
                <span className="uppercase font-semibold" style={{ fontSize: '10px', letterSpacing: '0.8px', color: 'rgba(255,255,255,0.5)' }}>
                  {tournament.tourSlug === 'pga' ? 'PGA TOUR' :
                   tournament.tourSlug === 'liv' ? 'LIV GOLF' :
                   tournament.tourSlug === 'euro' ? 'DP WORLD' :
                   tournament.tourSlug === 'lpga' ? 'LPGA' :
                   tournament.tourSlug === 'champ' ? 'CHAMPIONS' : 'KORN FERRY'}
                </span>
              </div>
            </div>

            {/* Tournament name + venue */}
            <h2 className="hero-tournament-name">{tournament.name}</h2>
            <p className="hero-venue">
              {tournament.venueName}
              {tournament.venueCity && ` · ${tournament.venueCity}`}
            </p>

            {/* LIVE: Top 5 leaderboard */}
            {isLive && (
              <>
                {leadersLoading ? (
                  <div className="leaderboard-container mt-3">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="leaderboard-row flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-3 bg-white/10 rounded animate-pulse" />
                          <div className="w-24 h-3 bg-white/10 rounded animate-pulse" />
                        </div>
                        <div className="w-8 h-3 bg-white/10 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : leaders.length > 0 ? (
                  <div className="leaderboard-container">
                    {leaders.slice(0, 5).map((leader, idx) => (
                      <LeaderRow key={`${leader.position}-${leader.player.id}`} leader={leader} isFirst={idx === 0} />
                    ))}
                  </div>
                ) : (
                  <div className="leaderboard-container">
                    <span className="text-white/60 text-sm font-medium italic">Starting Soon</span>
                  </div>
                )}
              </>
            )}

            {/* COMPLETED: Winner display */}
            {isCompleted && tournament.winnerName && (
              <div className="flex items-center gap-3 mt-3">
                {winnerPhotoUrl ? (
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/20 flex-shrink-0">
                    <img src={winnerPhotoUrl} alt={tournament.winnerName} className="w-full h-full object-cover object-top" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-white/50 text-sm font-bold">
                      {tournament.winnerName.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-white font-semibold text-sm">{tournament.winnerName}</p>
                  {tournament.winnerScore && (
                    <p className="text-white/60 text-xs">{tournament.winnerScore}</p>
                  )}
                </div>
              </div>
            )}

            {/* NOT LIVE: Next Up teaser */}
            {!isLive && !isCompleted && (
              <p className="text-white/50 text-xs mt-3">
                {getStartLabel(tournament.startDate)}
              </p>
            )}

            {/* Pagination dots (only for multi-live) */}
            {totalSlides > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-4">
                {Array.from({ length: totalSlides }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); onDotClick(idx); }}
                    className="w-1.5 h-1.5 rounded-full transition-opacity"
                    style={{
                      background: 'rgba(255,255,255,0.4)',
                      opacity: idx === currentIndex ? 1 : 0.3,
                    }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function PrimaryHero() {
  const { data: slides = [], isLoading } = useHeroCarouselData();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartRef = React.useRef<{ x: number; time: number } | null>(null);
  const touchMoveRef = React.useRef<number>(0);

  // Auto-advance (8s) — only when multiple slides
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % slides.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [slides.length, isPaused]);

  useEffect(() => {
    if (currentIndex >= slides.length) setCurrentIndex(0);
  }, [slides.length, currentIndex]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartRef.current = { x: e.touches[0].clientX, time: Date.now() };
    touchMoveRef.current = 0;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    touchMoveRef.current = e.touches[0].clientX - touchStartRef.current.x;
  };
  const handleTouchEnd = () => {
    if (!touchStartRef.current) return;
    const dx = touchMoveRef.current;
    if (dx < -50 && currentIndex < slides.length - 1) setCurrentIndex(p => p + 1);
    else if (dx > 50 && currentIndex > 0) setCurrentIndex(p => p - 1);
    touchStartRef.current = null;
    touchMoveRef.current = 0;
    setTimeout(() => setIsPaused(false), 5000);
  };

  if (isLoading) {
    return (
      <div className="relative w-full h-full bg-slate-900 animate-pulse">
        <div className="absolute left-4 right-4 p-5 glass-card" style={{ bottom: '20px' }}>
          <div className="h-4 w-20 bg-white/10 rounded mb-4" />
          <div className="h-8 w-56 bg-white/10 rounded mb-2" />
          <div className="h-4 w-40 bg-white/10 rounded" />
        </div>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="relative w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center text-white/60">
          <p className="text-lg mb-2">No active tournaments</p>
          <p className="text-sm">Check back soon for upcoming events</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ touchAction: 'pan-y' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Menu Icon */}
      <button
        className="absolute z-20 flex items-center justify-center"
        style={{
          top: '56px', left: '16px', width: '36px', height: '36px',
          borderRadius: '10px', background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        }}
        onClick={openTourNav}
        aria-label="Open tour menu"
      >
        <Menu className="w-5 h-5 text-white" strokeWidth={1.5} />
      </button>

      <AnimatePresence mode="sync">
        {slides.map((slide, index) => (
          <HeroSlideView
            key={slide.tournament.id}
            slide={slide}
            isActive={index === currentIndex}
            totalSlides={slides.length}
            currentIndex={currentIndex}
            onDotClick={setCurrentIndex}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
