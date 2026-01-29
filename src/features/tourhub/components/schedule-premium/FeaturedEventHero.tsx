/**
 * FeaturedEventHero - Large cinematic hero for schedule page
 * 
 * Features:
 * - 50vh height, full-bleed
 * - Ken Burns animation
 * - Glass overlay with rich tournament info
 * - Live indicator with pulsing animation
 * - Winner display for completed events
 */

import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { MapPin, DollarSign, Flag, Ruler, ChevronRight, Trophy, Play, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { TourTournament } from '../../hooks/useTourHubData';
import { useSingleCourseImage } from '../../hooks/useCourseImageResolver';
import { CinematicImage, LiveIndicator, GlassCard } from '../premium';

interface FeaturedEventHeroProps {
  tournament: TourTournament;
  type: 'live' | 'upcoming' | 'recent';
}

export function FeaturedEventHero({ tournament, type }: FeaturedEventHeroProps) {
  // Resolve course image
  const { courseImage, isLoading: imageLoading } = useSingleCourseImage(
    tournament.venue_name ? {
      venueName: tournament.venue_name,
      city: tournament.venue_city,
      country: tournament.venue_country,
    } : null
  );

  const hasImage = courseImage?.imageUrl && !imageLoading;
  const isLive = type === 'live';
  const isComplete = type === 'recent';

  return (
    <Link
      to={`/tourhub/tournament/${tournament.id}`}
      className="group block relative overflow-hidden -mx-4 sm:-mx-6"
      style={{ height: '50vh', minHeight: '320px', maxHeight: '450px' }}
    >
      {/* Background with Ken Burns */}
      <CinematicImage
        src={hasImage ? courseImage.imageUrl! : undefined}
        alt={tournament.venue_name || tournament.name}
        className="absolute inset-0"
        priority
      />

      {/* Fallback gradient */}
      {!hasImage && (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-slate-900 to-black">
          <div className="absolute inset-0 opacity-5">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
              <defs>
                <pattern id="hero-pattern" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                  <circle cx="5" cy="5" r="1" fill="white" />
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#hero-pattern)" />
            </svg>
          </div>
        </div>
      )}

      {/* Cinematic overlays */}
      <div 
        className="absolute inset-0"
        style={{ 
          background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 30%)' 
        }} 
      />
      <div 
        className="absolute inset-0"
        style={{ 
          background: 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0) 80%)' 
        }} 
      />

      {/* Status Badge - Top Left */}
      <div className="absolute top-4 left-4 z-10">
        {isLive ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[hsl(var(--th-accent-live))]/90 backdrop-blur-sm">
            <LiveIndicator size="sm" />
            <span className="text-[11px] font-bold text-white uppercase tracking-wide">
              LIVE NOW
            </span>
          </div>
        ) : type === 'upcoming' ? (
          <div className="px-3 py-1.5 rounded-full bg-emerald-500/90 backdrop-blur-sm">
            <span className="text-[11px] font-bold text-white uppercase tracking-wide">
              FEATURED EVENT
            </span>
          </div>
        ) : (
          <div className="px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10">
            <span className="text-[11px] font-bold text-white/90 uppercase tracking-wide">
              MOST RECENT
            </span>
          </div>
        )}
      </div>

      {/* Tap Affordance */}
      <div 
        className="absolute right-4 bottom-4 w-10 h-10 rounded-full flex items-center justify-center 
                   bg-white/10 backdrop-blur-sm opacity-70 group-hover:opacity-100 transition-opacity z-10"
      >
        <ChevronRight className="w-5 h-5 text-white transition-transform group-hover:translate-x-0.5" />
      </div>

      {/* Content */}
      <motion.div 
        className="absolute inset-x-0 bottom-0 p-5 sm:p-6 pr-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Tour Label */}
        <p className="th-caption-2 text-white/60 mb-2">
          PGA TOUR
        </p>

        {/* Tournament Name */}
        <h2 className="th-display-m text-white leading-[1.1] mb-2">
          {tournament.name}
        </h2>

        {/* Date */}
        <p className="th-body text-white/85 mb-2">
          {format(new Date(tournament.start_date), 'MMM d')} – {format(new Date(tournament.end_date), 'd, yyyy')}
        </p>

        {/* Location */}
        {tournament.venue_name && (
          <div className="flex items-center gap-1.5 th-body-small text-white/70 mb-4">
            <MapPin className="w-3.5 h-3.5" />
            <span>
              {tournament.venue_city}{tournament.venue_state && `, ${tournament.venue_state}`}
            </span>
          </div>
        )}

        {/* Winner for completed OR stats for live/upcoming */}
        {isComplete && tournament.defending_champion ? (
          <div className="flex items-center gap-2.5 bg-black/40 backdrop-blur-sm rounded-xl px-4 py-2.5 w-fit">
            <Trophy className="w-5 h-5 text-[hsl(var(--th-accent-gold))]" />
            <div>
              <p className="text-white font-bold">
                {tournament.defending_champion}
              </p>
              <p className="text-white/60 text-xs">
                Tournament Winner
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-4 th-body-small text-white/80">
            {tournament.purse && (
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5">
                <DollarSign className="w-3.5 h-3.5 opacity-70" />
                <span className="font-semibold">
                  ${(tournament.purse / 1_000_000).toFixed(0)}M Purse
                </span>
              </div>
            )}
            {tournament.venue_par && (
              <div className="flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5 opacity-60" />
                <span>Par {tournament.venue_par}</span>
              </div>
            )}
            {tournament.venue_yardage && (
              <div className="flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5 opacity-60" />
                <span>{tournament.venue_yardage.toLocaleString()} yards</span>
              </div>
            )}
          </div>
        )}

        {/* Action buttons for live */}
        {isLive && (
          <motion.div 
            className="flex gap-2 mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <button 
              onClick={(e) => e.preventDefault()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black text-sm font-semibold
                         hover:bg-white/90 transition-colors"
            >
              <Play className="w-4 h-4" />
              Watch Live
            </button>
            <button 
              onClick={(e) => e.preventDefault()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 backdrop-blur-sm text-white text-sm font-medium
                         border border-white/10 hover:bg-white/20 transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              Live Stats
            </button>
          </motion.div>
        )}
      </motion.div>
    </Link>
  );
}
