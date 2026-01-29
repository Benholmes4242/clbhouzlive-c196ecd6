/**
 * TournamentDetailHero - 50vh cinematic hero
 * Full-bleed course image with Ken Burns, live status, weather info
 */

import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, MapPin, DollarSign, Flag, Ruler, Thermometer, Wind } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CinematicImage, LiveIndicator, GlassCard } from '../premium';
import type { TourTournament } from '../../hooks/useTourHubData';

interface TournamentDetailHeroProps {
  tournament: TourTournament;
  courseImageUrl?: string | null;
  weather?: {
    temp: string;
    wind: string;
  };
}

export function TournamentDetailHero({ 
  tournament, 
  courseImageUrl,
  weather,
}: TournamentDetailHeroProps) {
  const isLive = tournament.status === 'inprogress';
  const isComplete = tournament.status === 'closed';

  return (
    <div 
      className="relative overflow-hidden -mx-4 sm:-mx-6"
      style={{ height: '50vh', minHeight: '320px', maxHeight: '450px' }}
    >
      {/* Background with Ken Burns */}
      <CinematicImage
        src={courseImageUrl || undefined}
        alt={tournament.venue_name || tournament.name}
        className="absolute inset-0"
        priority
      />

      {/* Fallback gradient */}
      {!courseImageUrl && (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-slate-900 to-black">
          <div className="absolute inset-0 opacity-5">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
              <defs>
                <pattern id="hero-detail-pattern" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                  <circle cx="5" cy="5" r="1" fill="white" />
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#hero-detail-pattern)" />
            </svg>
          </div>
        </div>
      )}

      {/* Cinematic overlays */}
      <div 
        className="absolute inset-0"
        style={{ 
          background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 30%)' 
        }} 
      />
      <div 
        className="absolute inset-0"
        style={{ 
          background: 'linear-gradient(0deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0) 80%)' 
        }} 
      />

      {/* Back button */}
      <div className="absolute top-4 left-4 z-20">
        <Link 
          to="/tourhub?tab=schedule"
          className="flex items-center gap-2 px-3 py-2 rounded-full bg-black/30 backdrop-blur-md text-white text-sm font-medium
                     hover:bg-black/50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Schedule
        </Link>
      </div>

      {/* Status Badge - Top Right */}
      <div className="absolute top-4 right-4 z-20">
        {isLive ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[hsl(var(--th-accent-live))]/90 backdrop-blur-sm">
            <LiveIndicator size="sm" />
            <span className="text-[11px] font-bold text-white uppercase tracking-wide">
              LIVE
            </span>
          </div>
        ) : isComplete ? (
          <div className="px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10">
            <span className="text-[11px] font-bold text-white/90 uppercase tracking-wide">
              COMPLETED
            </span>
          </div>
        ) : (
          <div className="px-3 py-1.5 rounded-full bg-emerald-500/90 backdrop-blur-sm">
            <span className="text-[11px] font-bold text-white uppercase tracking-wide">
              UPCOMING
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <motion.div 
        className="absolute inset-x-0 bottom-0 p-5 sm:p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Tournament Name */}
        <h1 className="th-display-m text-white leading-[1.1] mb-2">
          {tournament.name}
        </h1>

        {/* Venue Name */}
        {tournament.venue_name && (
          <p className="th-title-2 text-white/90 mb-1">
            {tournament.venue_name}
          </p>
        )}

        {/* Location */}
        <div className="flex items-center gap-1.5 th-body-small text-white/70 mb-4">
          <MapPin className="w-3.5 h-3.5" />
          <span>
            {tournament.venue_city}{tournament.venue_state && `, ${tournament.venue_state}`}
          </span>
        </div>

        {/* Stats Row */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {tournament.purse && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm">
              <DollarSign className="w-3.5 h-3.5 text-white/70" />
              <span className="text-sm font-semibold text-white">
                ${(tournament.purse / 1_000_000).toFixed(0)}M
              </span>
            </div>
          )}
          
          {tournament.venue_par && (
            <div className="flex items-center gap-1.5 text-white/80 text-sm">
              <Flag className="w-3.5 h-3.5 opacity-60" />
              <span>Par {tournament.venue_par}</span>
            </div>
          )}
          
          {tournament.venue_yardage && (
            <div className="flex items-center gap-1.5 text-white/80 text-sm">
              <Ruler className="w-3.5 h-3.5 opacity-60" />
              <span>{tournament.venue_yardage.toLocaleString()} yds</span>
            </div>
          )}

          {/* Weather (if available) */}
          {weather && (
            <>
              <div className="flex items-center gap-1.5 text-white/70 text-sm">
                <Thermometer className="w-3.5 h-3.5 opacity-60" />
                <span>{weather.temp}</span>
              </div>
              <div className="flex items-center gap-1.5 text-white/70 text-sm">
                <Wind className="w-3.5 h-3.5 opacity-60" />
                <span>{weather.wind}</span>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
