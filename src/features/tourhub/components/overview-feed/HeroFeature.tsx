/**
 * HeroFeature - Full-bleed cinematic hero with course image
 * Enhanced height and stronger gradient for text contrast
 */

import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { MapPin, Zap, Trophy, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TourTournament } from '../../hooks/useTourHubData';

interface HeroFeatureProps {
  tournament: TourTournament;
  type: 'live' | 'recent' | 'upcoming';
  courseImageUrl?: string | null;
}

export function HeroFeature({ tournament, type, courseImageUrl }: HeroFeatureProps) {
  const labelConfig = {
    live: { 
      text: 'LIVE', 
      icon: <Zap className="w-3 h-3" />, 
      className: 'bg-red-500 text-white animate-pulse' 
    },
    recent: { 
      text: 'MOST RECENT', 
      icon: <Trophy className="w-3 h-3" />, 
      className: 'bg-black/50 backdrop-blur-md text-white/90 border border-white/15' 
    },
    upcoming: { 
      text: 'UPCOMING', 
      icon: <Calendar className="w-3 h-3" />, 
      className: 'bg-emerald-500/90 text-white' 
    },
  };

  const label = labelConfig[type];

  return (
    <Link
      to={`/tourhub/tournament/${tournament.id}`}
      className="group block relative overflow-hidden -mx-4 sm:-mx-6"
      style={{ height: 'min(44vh, 360px)' }}
    >
      {/* Background Image or Gradient Fallback */}
      {courseImageUrl ? (
        <img
          src={courseImageUrl}
          alt={tournament.venue_name || tournament.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-slate-800 to-slate-900">
          {/* Topographic texture fallback */}
          <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="hero-topo" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                <path d="M0 40 Q20 20 40 40 T80 40" fill="none" stroke="white" strokeWidth="0.5" />
                <path d="M0 60 Q20 40 40 60 T80 60" fill="none" stroke="white" strokeWidth="0.3" />
                <circle cx="60" cy="25" r="12" fill="none" stroke="white" strokeWidth="0.4" />
              </pattern>
            </defs>
            <rect width="400" height="300" fill="url(#hero-topo)" />
          </svg>
        </div>
      )}

      {/* Stronger gradient overlays for text contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />

      {/* Content overlay - pinned bottom-left */}
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
        {/* Status pill - cleaner, smaller */}
        <div className={cn(
          "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider mb-4",
          label.className
        )}>
          {label.icon}
          {label.text}
        </div>

        {/* Tournament name - broadcast style */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight line-clamp-2 mb-2 drop-shadow-lg tracking-tight">
          {tournament.name}
        </h1>

        {/* Venue - proper bullet separator */}
        {tournament.venue_name && (
          <div className="flex items-center gap-1.5 text-white/80 text-sm mb-3">
            <MapPin className="w-3.5 h-3.5" />
            <span>
              {tournament.venue_name}
              {tournament.venue_city && ` · ${tournament.venue_city}`}
            </span>
          </div>
        )}

        {/* Date */}
        <p className="text-white/70 text-sm mb-4">
          {format(new Date(tournament.start_date), 'MMM d')} – {format(new Date(tournament.end_date), 'd, yyyy')}
        </p>

        {/* Stats row - semi-transparent white/blur background */}
        <div className="flex flex-wrap items-center gap-2">
          {tournament.purse && (
            <span className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-medium border border-white/10">
              ${(tournament.purse / 1_000_000).toFixed(1)}M
            </span>
          )}
          {tournament.venue_par && (
            <span className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-medium border border-white/10">
              Par {tournament.venue_par}
            </span>
          )}
          {tournament.venue_yardage && (
            <span className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-medium border border-white/10">
              {tournament.venue_yardage.toLocaleString()} yds
            </span>
          )}
        </div>

        {/* Defending champion */}
        {tournament.defending_champion && (
          <div className="mt-4 pt-3 border-t border-white/20 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-white/80 text-sm">
              Champion: <span className="font-semibold text-white">{tournament.defending_champion}</span>
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
