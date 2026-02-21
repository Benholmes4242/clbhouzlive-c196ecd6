/**
 * LiveHeroCarousel - Swipeable hero for live tournaments (compact Schedule page version)
 *
 * Features:
 * - Full-bleed course image with gradient overlay + glass card
 * - LIVE badge, tour badge, tournament name, venue, round indicator, leader + score
 * - Horizontal swipe (50px threshold), pagination dots, auto-advance 7s
 * - Tappable player/venue names with stopPropagation
 * - Leader scores always white inside glass cards for consistency
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TourTournament } from '../../hooks/useTourHubData';
import type { TournamentLeaderWinner } from '../../hooks/useTournamentLeadersWinners';
import { useSingleCourseImage } from '../../hooks/useCourseImageResolver';
import { getCourseImage } from '../../utils/placeholders';
import '@/styles/hero-glass.css';

/** Player avatar for carousel live card */
function PlayerAvatar({ photoUrl, displayName, size = 36 }: { photoUrl: string | null; displayName: string; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const initials = displayName.split(/[\s.]/).filter(Boolean).map(w => w[0]?.toUpperCase() || '').slice(0, 2).join('');
  return (
    <div style={{
      width: size, height: size, borderRadius: '34%', overflow: 'hidden', flexShrink: 0,
      border: '1.5px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {photoUrl && !imgError ? (
        <img src={photoUrl} alt={displayName}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
          onError={() => setImgError(true)} />
      ) : (
        <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.65)', lineHeight: 1 }}>{initials || '?'}</span>
      )}
    </div>
  );
}

interface LiveHeroCarouselProps {
  tournaments: TourTournament[];
  leadersMap?: Map<string, TournamentLeaderWinner>;
}

function getTourLabel(tourCode?: string): string {
  const labels: Record<string, string> = {
    pga: 'PGA TOUR', EURO: 'DP WORLD', LPGA: 'LPGA',
    CHAMP: 'CHAMPIONS', PGAD: 'KORN FERRY', LIV: 'LIV GOLF',
  };
  return labels[tourCode || ''] || 'TOUR';
}

function LiveSlide({ tournament, leader }: { tournament: TourTournament; leader?: TournamentLeaderWinner }) {
  const navigate = useNavigate();
  const { courseImage } = useSingleCourseImage(
    tournament.venue_name ? {
      venueName: tournament.venue_name,
      city: tournament.venue_city,
      country: tournament.venue_country,
    } : null
  );
  const imageUrl = courseImage?.imageUrl || getCourseImage({ id: tournament.id });
  const [imgError, setImgError] = useState(false);

  const handlePlayerTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (leader?.playerId) {
      navigate(`/tourhub/player/${leader.playerId}`);
    }
  };

  const handleVenueTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (tournament.venue_name) {
      navigate(`/tourhub/courses?q=${encodeURIComponent(tournament.venue_name)}`);
    }
  };

  // Round indicator
  const currentRound = (tournament as any).current_round;

  return (
    <div
      className="relative w-full cursor-pointer"
      style={{ height: '50dvh' }}
      onClick={() => navigate(`/tourhub/tournament/${tournament.id}`)}
    >
      {/* Background image */}
      <motion.div
        className="absolute inset-0 w-full h-full"
        initial={{ scale: 1.03, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ opacity: { duration: 0.8 }, scale: { duration: 5, ease: 'linear' } }}
      >
        {!imgError ? (
          <img
            src={imageUrl}
            alt={tournament.venue_name || tournament.name}
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-emerald-900 to-emerald-700" />
        )}
      </motion.div>

      {/* Gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.20) 100%),
            linear-gradient(90deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0) 55%)
          `,
        }}
      />

      {/* Glass Card */}
      <motion.div
        className="glass-card"
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          top: 'auto',
          minWidth: '260px',
          maxWidth: 'min(330px, calc(100% - 32px))',
          padding: '16px 16px 12px 16px',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.08 }}
      >
        {/* Row 1: LIVE + Tour */}
        <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
          <div className="flex items-center gap-1.5">
            <span className="live-dot" />
            <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '1.5px', color: '#22C55E' }}>LIVE</span>
          </div>
          <div className="tour-badge">
            <span>{getTourLabel(tournament.tour_code)}</span>
          </div>
        </div>

        {/* Row 2: Tournament Name */}
        <h2 className="hero-tournament-name">{tournament.name}</h2>

        {/* Row 3: Venue (tappable) */}
        <button
          onClick={handleVenueTap}
          className="hero-venue block text-left transition-opacity active:opacity-70"
        >
          {tournament.venue_name}
          {tournament.venue_city && ` · ${tournament.venue_city}`}
        </button>

        {/* Row 3b: Round indicator */}
        {currentRound && (
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '1.2px',
            color: 'rgba(255,255,255,0.6)',
            textTransform: 'uppercase',
            display: 'block',
            marginTop: '2px',
          }}>
            ROUND {currentRound} OF 4
          </span>
        )}

        {/* Row 4: Leader with frosted highlight */}
        {leader && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 10,
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '8px',
            padding: '8px',
            margin: '10px -8px 0 -8px',
          }}>
            <button onClick={handlePlayerTap} className="transition-opacity active:opacity-70">
              <PlayerAvatar photoUrl={leader.photoUrl ?? null} displayName={leader.displayName} size={36} />
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  onClick={handlePlayerTap}
                  className="transition-opacity active:opacity-70"
                  style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}
                >
                  {leader.displayName}
                </button>
                <span
                  className="score-mono"
                  style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', flexShrink: 0 }}
                >
                  {leader.displayScore}
                </span>
              </div>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginTop: 1, display: 'block' }}>Leader</span>
            </div>
          </div>
        )}

        {/* CTA — centered */}
        <div className="hero-text-cta w-full" style={{ marginTop: '8px' }}>
          <span>See Leaderboard</span>
          <ChevronRight className="w-4 h-4 cta-chevron" />
        </div>
      </motion.div>
    </div>
  );
}

export function LiveHeroCarousel({ tournaments, leadersMap }: LiveHeroCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartRef = useRef(0);
  const touchDeltaRef = useRef(0);
  const autoAdvanceRef = useRef<ReturnType<typeof setInterval>>();
  const pausedRef = useRef(false);

  const count = tournaments.length;

  // Auto-advance every 7s
  const startAutoAdvance = useCallback(() => {
    if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current);
    if (count <= 1) return;
    autoAdvanceRef.current = setInterval(() => {
      if (!pausedRef.current) {
        setActiveIndex(prev => (prev + 1) % count);
      }
    }, 7000);
  }, [count]);

  useEffect(() => {
    startAutoAdvance();
    return () => { if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current); };
  }, [startAutoAdvance]);

  const handleTouchStart = (e: React.TouchEvent) => {
    pausedRef.current = true;
    touchStartRef.current = e.touches[0].clientX;
    touchDeltaRef.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchDeltaRef.current = e.touches[0].clientX - touchStartRef.current;
  };

  const handleTouchEnd = () => {
    const delta = touchDeltaRef.current;
    if (Math.abs(delta) > 50) {
      if (delta < 0 && activeIndex < count - 1) setActiveIndex(prev => prev + 1);
      if (delta > 0 && activeIndex > 0) setActiveIndex(prev => prev - 1);
    }
    pausedRef.current = false;
    startAutoAdvance();
  };

  if (count === 0) return null;

  if (count === 1) {
    return <LiveSlide tournament={tournaments[0]} leader={leadersMap?.get(tournaments[0].id)} />;
  }

  return (
    <div className="relative">
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LiveSlide
              tournament={tournaments[activeIndex]}
              leader={leadersMap?.get(tournaments[activeIndex].id)}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Pagination dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 dots-backing">
        {tournaments.map((_, i) => (
          <button
            key={i}
            onClick={() => { setActiveIndex(i); pausedRef.current = false; startAutoAdvance(); }}
            className={i === activeIndex ? 'hero-dot-active' : 'hero-dot-inactive'}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}