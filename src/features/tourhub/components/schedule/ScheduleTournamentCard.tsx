/**
 * ScheduleTournamentCard - Cinematic tournament card (Apple-grade)
 * 
 * Features:
 * - Proper card depth with border and shadow
 * - Unified status badge system
 * - Winner/Leader display for completed/live tournaments
 * - Stronger text hierarchy
 * - Smooth image loading with skeleton placeholder
 * - Smart date formatting for cross-month ranges
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format, isSameMonth } from 'date-fns';
import { MapPin, DollarSign, Flag, Ruler, ChevronRight, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { TourTournament } from '../../hooks/useTourHubData';
import type { SeasonTournament } from '../../hooks/useSeasonTournaments';
import { useSingleCourseImage } from '../../hooks/useCourseImageResolver';
import { getCourseImage } from '../../utils/placeholders';

interface ScheduleTournamentCardProps {
  tournament: TourTournament | SeasonTournament;
  className?: string;
  compact?: boolean; // For carousel view - smaller sizing
}

/**
 * Format date range with smart month handling
 * Same month: "Jan 15 – 18, 2026"
 * Cross month: "Jan 29 – Feb 1, 2026"
 */
function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isSameMonth(start, end)) {
    return `${format(start, 'MMM d')} – ${format(end, 'd, yyyy')}`;
  } else {
    return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
  }
}

/** Unified Status Badge - Dark glass pill over image */
function StatusBadge({ status }: { status: string }) {
  const isLive = status === 'inprogress';
  const isFinal = status === 'closed' || status === 'complete';
  
  const getLabel = () => {
    if (isLive) return 'LIVE';
    if (isFinal) return 'FINAL';
    return 'UPCOMING';
  };
  
  return (
    <span 
      className="inline-flex items-center"
      style={{
        padding: '4px 10px',
        borderRadius: '8px',
        fontSize: '10px',
        fontWeight: 700,
        letterSpacing: '0.8px',
        textTransform: 'uppercase',
        background: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        gap: '5px',
      }}
    >
      {isLive && (
        <span 
          className="animate-live-pulse"
          style={{
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            background: '#FF3B30',
          }}
        />
      )}
      <span style={{ color: isLive ? '#FF3B30' : 'rgba(255, 255, 255, 0.85)' }}>
        {getLabel()}
      </span>
    </span>
  );
}

/** Skeleton placeholder for loading state */
function ImageSkeleton({ compact }: { compact: boolean }) {
  return (
    <div 
      className="absolute inset-0"
      style={{
        background: 'linear-gradient(90deg, #F1F3F5 25%, #E5E7EB 50%, #F1F3F5 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s ease-in-out infinite',
      }}
    >
      {/* Subtle golf course silhouette */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(0, 0, 0, 0.05)' }}
        >
          <Flag className="w-6 h-6" style={{ color: 'rgba(0, 0, 0, 0.1)' }} />
        </div>
      </div>
    </div>
  );
}

// Type guard to check if tournament is SeasonTournament
function isSeasonTournament(t: TourTournament | SeasonTournament): t is SeasonTournament {
  return 'startDate' in t;
}

export function ScheduleTournamentCard({ tournament, className, compact = false }: ScheduleTournamentCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  
  // Normalize field names between TourTournament and SeasonTournament
  const venueName = isSeasonTournament(tournament) ? tournament.venueName : tournament.venue_name;
  const venueCity = isSeasonTournament(tournament) ? tournament.venueCity : tournament.venue_city;
  const venueCountry = isSeasonTournament(tournament) ? tournament.venueCountry : tournament.venue_country;
  const startDate = isSeasonTournament(tournament) ? tournament.startDate : tournament.start_date;
  const endDate = isSeasonTournament(tournament) ? tournament.endDate : tournament.end_date;
  const venuePar = isSeasonTournament(tournament) ? tournament.venuePar : tournament.venue_par;
  const venueYardage = isSeasonTournament(tournament) ? tournament.venueYardage : tournament.venue_yardage;
  
  // Winner info (only available in SeasonTournament)
  const winnerFirstName = isSeasonTournament(tournament) ? tournament.winnerFirstName : null;
  const winnerLastName = isSeasonTournament(tournament) ? tournament.winnerLastName : null;
  const winnerScore = isSeasonTournament(tournament) ? (tournament as any).winnerScore : null;
  const hasWinner = winnerFirstName && winnerLastName && 
    (tournament.status === 'closed' || tournament.status === 'complete');
  
  // Check if live
  const isLive = tournament.status === 'inprogress';
  
  // Resolve course image
  const { courseImage } = useSingleCourseImage(
    venueName ? {
      venueName: venueName,
      city: venueCity,
      country: venueCountry,
    } : null
  );

  const imageUrl = courseImage?.imageUrl || getCourseImage({ id: tournament.id });
  
  // Reset loading state when image URL changes
  useEffect(() => {
    if (imageUrl !== currentImageUrl) {
      setImageLoaded(false);
      setCurrentImageUrl(imageUrl);
    }
  }, [imageUrl, currentImageUrl]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  return (
    <Link
      to={`/tourhub/tournament/${tournament.id}`}
      className={cn("block relative group", className)}
      aria-label={`${tournament.name}, ${tournament.status}, ${formatDateRange(startDate, endDate)}`}
      role="button"
    >
      <motion.div
        className={cn(
          "relative overflow-hidden",
          !compact && "mx-4"
        )}
        style={{ 
          aspectRatio: '4/3',
          borderRadius: '14px',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        }}
        whileHover={{ 
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
        }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Skeleton placeholder - shows while image loads */}
        <AnimatePresence>
          {!imageLoaded && (
            <motion.div
              className="absolute inset-0 z-[1]"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <ImageSkeleton compact={compact} />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Background Image with hover Ken Burns */}
        <motion.div
          className="absolute inset-0"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.img 
            key={imageUrl} // Key by URL to trigger re-render on change
            src={imageUrl}
            alt={venueName || tournament.name}
            className="w-full h-full object-cover"
            onLoad={handleImageLoad}
            initial={{ opacity: 0 }}
            animate={{ opacity: imageLoaded ? 1 : 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          />
        </motion.div>
        
        {/* Bottom gradient overlay - 70% height for text protection */}
        <div 
          className="absolute inset-x-0 bottom-0 pointer-events-none z-[2]"
          style={{
            height: '70%',
            background: 'linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.3) 40%, transparent 100%)',
          }}
        />
        
        {/* Status Badge - Top Right - Unified dark glass */}
        <div className="absolute top-2.5 right-2.5 z-10">
          <StatusBadge status={tournament.status} />
        </div>

        {/* Tap affordance - glassmorphic chevron */}
        <motion.div 
          className="absolute right-3 bottom-3 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
          style={{ 
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          <ChevronRight className="w-4 h-4 text-white" />
        </motion.div>
        
        {/* Content - Bottom with stronger hierarchy */}
        <div 
          className="absolute inset-x-0 bottom-0 z-10"
          style={{ padding: '12px' }}
        >
          {/* Event Name - Dominant */}
          <h3 
            className="line-clamp-2"
            style={{ 
              fontSize: '16px',
              fontWeight: 700,
              color: '#FFFFFF',
              lineHeight: 1.2,
              letterSpacing: '-0.2px',
              marginBottom: '3px',
              textShadow: '0 1px 3px rgba(0,0,0,0.5)',
            }}
          >
            {tournament.name}
          </h3>
          
          {/* Winner Display (for completed tournaments) - Gold highlight */}
          {hasWinner && (
            <div 
              className="flex items-center gap-1.5"
              style={{ 
                fontSize: '12px',
                fontWeight: 600,
                color: '#FFD700',
                marginBottom: '3px',
                textShadow: '0 1px 3px rgba(0,0,0,0.5)',
              }}
            >
              <span>🏆</span>
              <span>
                {winnerFirstName?.charAt(0)}. {winnerLastName}
                {winnerScore && (
                  <span style={{ fontFamily: 'JetBrains Mono, monospace' }}> ({winnerScore})</span>
                )}
              </span>
            </div>
          )}
          
          {/* Leader Display (for live tournaments) - Green highlight */}
          {isLive && !hasWinner && (
            <div 
              className="flex items-center gap-1"
              style={{ 
                fontSize: '12px',
                fontWeight: 600,
                color: '#34C759',
                marginBottom: '3px',
                textShadow: '0 1px 3px rgba(0,0,0,0.5)',
              }}
            >
              <span>Leader: Check leaderboard</span>
            </div>
          )}
          
          {/* Date range - Subdued */}
          <p 
            style={{
              fontSize: '11px',
              fontWeight: 400,
              color: 'rgba(255, 255, 255, 0.6)',
              textShadow: '0 1px 3px rgba(0,0,0,0.5)',
            }}
          >
            {formatDateRange(startDate, endDate)}
          </p>
          
          {/* Location (non-compact only) */}
          {(venueName || venueCity) && !compact && (
            <div 
              className="flex items-center gap-1.5 mt-2"
              style={{ 
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.7)',
                textShadow: '0 1px 3px rgba(0,0,0,0.5)',
              }}
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {[venueName, venueCity].filter(Boolean).join(' • ')}
              </span>
            </div>
          )}

          {/* Meta Info - Glassmorphic pills (hidden in compact mode) */}
          {!compact && (
            <div className="flex items-center gap-2 mt-2.5 text-[11px]">
              {tournament.purse && (
                <div 
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-white font-semibold"
                  style={{ background: 'rgba(255,255,255,0.15)' }}
                >
                  <DollarSign className="w-3 h-3" />
                  <span>{(tournament.purse / 1_000_000).toFixed(1)}M</span>
                </div>
              )}
              {venuePar && (
                <div 
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-white/80"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                >
                  <Flag className="w-3 h-3" />
                  <span>Par {venuePar}</span>
                </div>
              )}
              {venueYardage && (
                <div 
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-white/80"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                >
                  <Ruler className="w-3 h-3" />
                  <span>{venueYardage.toLocaleString()} yds</span>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  );
}

/**
 * Prefetch course images for a list of tournaments
 * Used by ScheduleModule to preload adjacent pages
 */
export function prefetchTournamentImages(tournaments: (TourTournament | SeasonTournament)[]) {
  tournaments.forEach(tournament => {
    const fallbackUrl = getCourseImage({ id: tournament.id });
    const img = new Image();
    img.src = fallbackUrl;
  });
}
