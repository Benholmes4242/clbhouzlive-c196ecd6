/**
 * PremiumTournamentCard - Apple-grade tournament card
 * 
 * Features:
 * - Cinematic course image with Ken Burns
 * - Glass-effect status badges
 * - Winner trophy display for completed events
 * - Premium typography and spacing
 * - Chevron tap affordance
 */

import { Link } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { MapPin, DollarSign, Flag, Ruler, ChevronRight, Check, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { TourTournament } from '../../hooks/useTourHubData';
import { useSingleCourseImage } from '../../hooks/useCourseImageResolver';
import { LiveIndicator, GlassCard } from '../premium';

interface PremiumTournamentCardProps {
  tournament: TourTournament;
  variant?: 'default' | 'compact';
  showImage?: boolean;
  index?: number;
}

function StatusBadge({ status, startDate }: { status: string; startDate: string }) {
  const isLive = status === 'inprogress';
  const isComplete = status === 'closed';
  const isUpcoming = status === 'scheduled' || status === 'created';
  
  if (isLive) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[hsl(var(--th-accent-live))]/90 backdrop-blur-sm">
        <LiveIndicator size="sm" />
        <span className="text-[10px] font-bold text-white uppercase tracking-wide">
          LIVE
        </span>
      </div>
    );
  }
  
  if (isComplete) {
    return (
      <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10">
        <Check className="w-3 h-3 text-emerald-400" />
        <span className="text-[10px] font-bold text-white uppercase tracking-wide">
          Complete
        </span>
      </div>
    );
  }
  
  if (isUpcoming) {
    const timeUntil = formatDistanceToNow(new Date(startDate), { addSuffix: true });
    return (
      <div className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
        <span className="text-[10px] font-medium text-white/90">
          {timeUntil}
        </span>
      </div>
    );
  }
  
  return null;
}

export function PremiumTournamentCard({ 
  tournament, 
  variant = 'default',
  showImage = true,
  index = 0,
}: PremiumTournamentCardProps) {
  // Resolve course image
  const { courseImage, isLoading: imageLoading } = useSingleCourseImage(
    tournament.venue_name ? {
      venueName: tournament.venue_name,
      city: tournament.venue_city,
      country: tournament.venue_country,
    } : null
  );

  const hasImage = showImage && courseImage?.imageUrl && !imageLoading;
  const isComplete = tournament.status === 'closed';
  const isLive = tournament.status === 'inprogress';
  const height = variant === 'compact' ? '180px' : '220px';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.35, 
        delay: index * 0.04,
        ease: [0.16, 1, 0.3, 1]
      }}
    >
      <Link
        to={`/tourhub/tournament/${tournament.id}`}
        className={cn(
          "group block relative overflow-hidden",
          "transition-all duration-300 ease-out",
          "active:scale-[0.99]"
        )}
        style={{ height }}
      >
        {/* Background */}
        {hasImage ? (
          <motion.img 
            src={courseImage.imageUrl!}
            alt={tournament.venue_name || tournament.name}
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ scale: 1.02 }}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-black">
            {/* Subtle pattern */}
            <div className="absolute inset-0 opacity-5">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
                <defs>
                  <pattern id={`dots-${tournament.id}`} x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                    <circle cx="5" cy="5" r="1" fill="white" />
                  </pattern>
                </defs>
                <rect width="100" height="100" fill={`url(#dots-${tournament.id})`} />
              </svg>
            </div>
          </div>
        )}
        
        {/* Cinematic gradient overlay */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, 
              rgba(0,0,0,0.15) 0%, 
              rgba(0,0,0,0.3) 40%,
              rgba(0,0,0,0.75) 100%
            )`,
          }}
        />
        
        {/* Status Badge - Top Right */}
        <div className="absolute top-3 right-3 z-10">
          <StatusBadge status={tournament.status} startDate={tournament.start_date} />
        </div>

        {/* Tour Badge - Top Left (optional) */}
        <div className="absolute top-3 left-3 z-10">
          <span className="th-caption-2 text-white/60">
            PGA TOUR
          </span>
        </div>

        {/* Tap Affordance - Chevron */}
        <div 
          className="absolute right-3 bottom-3 w-8 h-8 rounded-full flex items-center justify-center 
                     bg-white/10 backdrop-blur-sm opacity-60 group-hover:opacity-100 transition-opacity"
        >
          <ChevronRight className="w-4 h-4 text-white transition-transform group-hover:translate-x-0.5" />
        </div>
        
        {/* Content */}
        <div className="absolute inset-x-0 bottom-0 p-4 pr-14">
          {/* Tournament Name */}
          <h3 className="th-title-1 text-white leading-tight line-clamp-2 mb-1.5">
            {tournament.name}
          </h3>
          
          {/* Date */}
          <p className="th-body-small text-white/85 mb-1.5">
            {format(new Date(tournament.start_date), 'MMM d')} – {format(new Date(tournament.end_date), 'd, yyyy')}
          </p>
          
          {/* Location */}
          {(tournament.venue_name || tournament.venue_city) && (
            <div className="flex items-center gap-1.5 th-body-small text-white/65 mb-3">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">
                {tournament.venue_city}{tournament.venue_state && `, ${tournament.venue_state}`}
              </span>
            </div>
          )}

          {/* Winner (for completed) or Stats (for others) */}
          {isComplete && tournament.defending_champion ? (
            <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-lg px-3 py-2 w-fit">
              <Trophy className="w-4 h-4 text-[hsl(var(--th-accent-gold))]" />
              <span className="text-white font-medium text-sm">
                {tournament.defending_champion}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-4 th-caption-1 text-white/70">
              {tournament.purse && (
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3 opacity-60" />
                  <span className="font-semibold text-white/90">
                    ${(tournament.purse / 1_000_000).toFixed(1)}M
                  </span>
                </div>
              )}
              {tournament.venue_par && (
                <div className="flex items-center gap-1">
                  <Flag className="w-3 h-3 opacity-60" />
                  <span>Par {tournament.venue_par}</span>
                </div>
              )}
              {tournament.venue_yardage && (
                <div className="flex items-center gap-1">
                  <Ruler className="w-3 h-3 opacity-60" />
                  <span>{tournament.venue_yardage.toLocaleString()} yds</span>
                </div>
              )}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
