/**
 * ScheduleTournamentCard - Cinematic tournament card (Apple-grade)
 * 
 * Features:
 * - 144/176px height with 16px squircle radius
 * - Sophisticated gradient overlay
 * - Frosted glass status badges
 * - Framer Motion hover/tap interactions
 * - Ken Burns subtle animation on hover
 * - Winner display for completed tournaments
 * - Smooth image loading with skeleton placeholder
 * - Smart date formatting for cross-month ranges
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format, isSameMonth } from 'date-fns';
import { MapPin, DollarSign, Flag, Ruler, ChevronRight, Zap, Trophy } from 'lucide-react';
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

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; pulse?: boolean; icon?: React.ReactNode; className: string }> = {
    inprogress: { 
      label: 'LIVE', 
      pulse: true,
      icon: <Zap className="w-2.5 h-2.5" />,
      className: 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/25'
    },
    scheduled: { 
      label: 'UPCOMING',
      className: 'backdrop-blur-xl text-white border border-white/20'
    },
    created: { 
      label: 'UPCOMING',
      className: 'backdrop-blur-xl text-white border border-white/20'
    },
    closed: { 
      label: 'FINAL',
      className: 'bg-white/90 backdrop-blur-xl text-slate-700'
    },
    complete: { 
      label: 'FINAL',
      className: 'bg-white/90 backdrop-blur-xl text-slate-700'
    },
  };
  
  const c = config[status] || config.created;
  
  // Upcoming uses green tinted glass
  const isUpcoming = status === 'scheduled' || status === 'created';
  
  return (
    <span 
      className={cn(
        'inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-semibold uppercase tracking-[0.3px]',
        c.className
      )}
      style={{
        background: isUpcoming ? 'rgba(52, 199, 89, 0.85)' : undefined,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {c.pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
        </span>
      )}
      {c.icon && !c.pulse && c.icon}
      {c.label}
    </span>
  );
}

/** Skeleton placeholder for loading state */
function ImageSkeleton({ compact }: { compact: boolean }) {
  return (
    <div 
      className="absolute inset-0"
      style={{
        background: 'linear-gradient(90deg, #e2e8f0 25%, #cbd5e1 50%, #e2e8f0 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s ease-in-out infinite',
      }}
    >
      {/* Subtle golf course silhouette */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-slate-300/50 flex items-center justify-center">
          <Flag className="w-6 h-6 text-slate-400/50" />
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
  const hasWinner = winnerFirstName && winnerLastName && 
    (tournament.status === 'closed' || tournament.status === 'complete');
  
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
  
  const cardHeight = compact ? '144px' : '176px';

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
          "relative overflow-hidden shadow-sm",
          !compact && "mx-4"
        )}
        style={{ 
          height: cardHeight,
          borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        }}
        whileHover={{ scale: 1.01, y: -2 }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
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
        
        {/* Sophisticated gradient overlay for better text contrast */}
        <div 
          className="absolute inset-0 pointer-events-none z-[2]"
          style={{
            background: `linear-gradient(
              180deg,
              transparent 30%,
              rgba(0, 0, 0, 0.3) 60%,
              rgba(0, 0, 0, 0.75) 100%
            )`,
          }}
        />
        
        {/* Status Badge - Top Right */}
        <div className="absolute top-3 right-3 z-10">
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
        
        {/* Content - Bottom */}
        <div className="absolute inset-x-0 bottom-0 p-4 pr-14 z-10">
          {/* Event Name */}
          <h3 
            className={cn(
              "font-semibold text-white leading-[22px] line-clamp-2 mb-1",
              compact ? "text-[15px]" : "text-[17px]"
            )}
            style={{ 
              letterSpacing: '-0.02em',
              textShadow: '0 1px 3px rgba(0,0,0,0.5)',
            }}
          >
            {tournament.name}
          </h3>
          
          {/* Date with smart month handling */}
          <p 
            className={cn(
              "font-normal mb-1",
              compact ? "text-[12px]" : "text-[13px]"
            )}
            style={{
              color: 'rgba(255, 255, 255, 0.7)',
              textShadow: '0 1px 3px rgba(0,0,0,0.5)',
            }}
          >
            {formatDateRange(startDate, endDate)}
          </p>
          
          {/* Winner Display (for completed tournaments) */}
          {hasWinner && (
            <div 
              className="flex items-center gap-1.5 text-[11px] text-amber-300/90 mb-1"
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
            >
              <Trophy className="w-3 h-3 shrink-0" />
              <span className="truncate font-medium">
                Winner: {winnerFirstName} {winnerLastName}
              </span>
            </div>
          )}
          
          {/* Location */}
          {(venueName || venueCity) && !compact && (
            <div 
              className="flex items-center gap-1.5 text-[12px] text-white/70 mb-2.5"
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {[venueName, venueCity].filter(Boolean).join(' • ')}
              </span>
            </div>
          )}

          {/* Meta Info - Glassmorphic pills (hidden in compact mode) */}
          {!compact && (
            <div className="flex items-center gap-2 text-[11px]">
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
