/**
 * ScheduleTournamentCard - Cinematic tournament card (Apple-grade)
 * 
 * Features:
 * - 220px height with 16px squircle radius
 * - Cinematic gradient overlay
 * - Glass-effect status badges
 * - Framer Motion hover/tap interactions
 * - Ken Burns subtle animation on hover
 */

import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { MapPin, DollarSign, Flag, Ruler, ChevronRight, Check, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import type { TourTournament } from '../../hooks/useTourHubData';
import { useSingleCourseImage } from '../../hooks/useCourseImageResolver';
import { getCourseImage } from '../../utils/placeholders';

interface ScheduleTournamentCardProps {
  tournament: TourTournament;
  className?: string;
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

export function ScheduleTournamentCard({ tournament, className }: ScheduleTournamentCardProps) {
  // Resolve course image
  const { courseImage, isLoading: imageLoading } = useSingleCourseImage(
    tournament.venue_name ? {
      venueName: tournament.venue_name,
      city: tournament.venue_city,
      country: tournament.venue_country,
    } : null
  );

  const imageUrl = courseImage?.imageUrl || getCourseImage({ id: tournament.id });

  return (
    <Link
      to={`/tourhub/tournament/${tournament.id}`}
      className={cn("block relative group", className)}
    >
      <motion.div
        className="relative overflow-hidden mx-4"
        style={{ 
          height: '220px',
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
            alt={tournament.venue_name || tournament.name}
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
            className="font-bold text-white leading-tight line-clamp-2 mb-1.5"
            style={{ 
              fontSize: '18px',
              letterSpacing: '-0.02em',
              textShadow: '0 2px 8px rgba(0,0,0,0.5)',
            }}
          >
            {tournament.name}
          </h3>
          
          {/* Date */}
          <p className="text-[13px] font-medium text-white/90 mb-1">
            {format(new Date(tournament.start_date), 'MMM d')} – {format(new Date(tournament.end_date), 'd, yyyy')}
          </p>
          
          {/* Location */}
          {(tournament.venue_name || tournament.venue_city) && (
            <div className="flex items-center gap-1.5 text-[12px] text-white/70 mb-2.5">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {[tournament.venue_name, tournament.venue_city].filter(Boolean).join(' • ')}
              </span>
            </div>
          )}

          {/* Meta Info - Glassmorphic pills */}
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
            {tournament.venue_par && (
              <div 
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-white/80"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              >
                <Flag className="w-3 h-3" />
                <span>Par {tournament.venue_par}</span>
              </div>
            )}
            {tournament.venue_yardage && (
              <div 
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-white/80"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              >
                <Ruler className="w-3 h-3" />
                <span>{tournament.venue_yardage.toLocaleString()} yds</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
