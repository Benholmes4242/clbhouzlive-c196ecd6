/**
 * ScheduleTournamentCard - Cinematic tournament card (Apple-grade)
 * 
 * Features:
 * - 220px height with 16px squircle radius
 * - Cinematic gradient overlay
 * - Glass-effect status badges
 * - Framer Motion hover/tap interactions
 * - Ken Burns subtle animation on hover
 * - Winner display for completed tournaments
 */

import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { MapPin, DollarSign, Flag, Ruler, ChevronRight, Check, Zap, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import type { TourTournament } from '../../hooks/useTourHubData';
import type { SeasonTournament } from '../../hooks/useSeasonTournaments';
import { useSingleCourseImage } from '../../hooks/useCourseImageResolver';
import { getCourseImage } from '../../utils/placeholders';

interface ScheduleTournamentCardProps {
  tournament: TourTournament | SeasonTournament;
  className?: string;
  compact?: boolean; // For carousel view - smaller sizing
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; pulse?: boolean; icon?: React.ReactNode; className: string }> = {
    inprogress: { 
      label: 'LIVE', 
      pulse: true,
      icon: <Zap className="w-3 h-3" />,
      className: 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/25'
    },
    scheduled: { 
      label: 'Upcoming',
      className: 'bg-white/15 backdrop-blur-xl text-white border border-white/20'
    },
    created: { 
      label: 'Upcoming',
      className: 'bg-white/15 backdrop-blur-xl text-white border border-white/20'
    },
    closed: { 
      label: 'Completed',
      icon: <Check className="w-3 h-3" />,
      className: 'bg-black/40 backdrop-blur-xl text-white border border-white/10'
    },
    complete: { 
      label: 'Completed',
      icon: <Check className="w-3 h-3" />,
      className: 'bg-black/40 backdrop-blur-xl text-white border border-white/10'
    },
  };
  
  const c = config[status] || config.created;
  
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider',
      c.className
    )}>
      {c.pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
        </span>
      )}
      {c.icon && !c.pulse && c.icon}
      {c.label}
    </span>
  );
}

// Type guard to check if tournament is SeasonTournament
function isSeasonTournament(t: TourTournament | SeasonTournament): t is SeasonTournament {
  return 'startDate' in t;
}

export function ScheduleTournamentCard({ tournament, className, compact = false }: ScheduleTournamentCardProps) {
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
  
  const cardHeight = compact ? '180px' : '220px';

  return (
    <Link
      to={`/tourhub/tournament/${tournament.id}`}
      className={cn("block relative group", className)}
    >
      <motion.div
        className={cn(
          "relative overflow-hidden",
          !compact && "mx-4"
        )}
        style={{ 
          height: cardHeight,
          borderRadius: '16px',
        }}
        whileHover={{ scale: 1.01, y: -2 }}
        whileTap={{ scale: 0.99 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Background Image with hover Ken Burns */}
        <motion.div
          className="absolute inset-0"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <img 
            src={imageUrl}
            alt={venueName || tournament.name}
            className="w-full h-full object-cover"
          />
        </motion.div>
        
        {/* Cinematic gradient overlay */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.1) 100%),
              linear-gradient(to right, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 60%)
            `,
          }}
        />
        
        {/* Status Badge - Top Right */}
        <div className="absolute top-3 right-3 z-10">
          <StatusBadge status={tournament.status} />
        </div>

        {/* Tap affordance - glassmorphic chevron */}
        <motion.div 
          className="absolute right-3 bottom-3 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ 
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          <ChevronRight className="w-4 h-4 text-white" />
        </motion.div>
        
        {/* Content - Bottom */}
        <div className="absolute inset-x-0 bottom-0 p-4 pr-14">
          {/* Event Name */}
          <h3 
            className={cn(
              "font-bold text-white leading-tight line-clamp-2 mb-1",
              compact ? "text-[15px]" : "text-[18px]"
            )}
            style={{ 
              letterSpacing: '-0.02em',
              textShadow: '0 2px 8px rgba(0,0,0,0.5)',
            }}
          >
            {tournament.name}
          </h3>
          
          {/* Date */}
          <p className={cn(
            "font-medium text-white/90 mb-1",
            compact ? "text-[12px]" : "text-[13px]"
          )}>
            {format(new Date(startDate), 'MMM d')} – {format(new Date(endDate), 'd, yyyy')}
          </p>
          
          {/* Winner Display (for completed tournaments) */}
          {hasWinner && (
            <div className="flex items-center gap-1.5 text-[11px] text-amber-300/90 mb-1">
              <Trophy className="w-3 h-3 shrink-0" />
              <span className="truncate font-medium">
                Winner: {winnerFirstName} {winnerLastName}
              </span>
            </div>
          )}
          
          {/* Location */}
          {(venueName || venueCity) && !compact && (
            <div className="flex items-center gap-1.5 text-[12px] text-white/70 mb-2.5">
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
