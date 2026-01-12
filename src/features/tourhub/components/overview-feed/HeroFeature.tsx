/**
 * HeroFeature - Cinematic full-bleed hero with course image
 * Height ~58-62vh, subtle scale animation, staggered content reveal
 */

import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { MapPin, Zap, Trophy, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
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
      className: 'bg-red-500 text-white' 
    },
    recent: { 
      text: 'MOST RECENT', 
      icon: <Trophy className="w-3 h-3" />, 
      className: 'bg-black/40 backdrop-blur-md text-white/95 border border-white/20'
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
      style={{ height: 'min(60vh, 480px)' }}
    >
      {/* Background Image with subtle scale animation */}
      {courseImageUrl ? (
        <motion.img
          src={courseImageUrl}
          alt={tournament.venue_name || tournament.name}
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ scale: 1.03 }}
          animate={{ scale: 1 }}
          transition={{ duration: 3.5, ease: 'easeOut' }}
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

      {/* TOP gradient overlay - per spec */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ 
          background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 40%)' 
        }} 
      />
      
      {/* BOTTOM gradient overlay - per spec */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ 
          background: 'linear-gradient(0deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0) 45%)' 
        }} 
      />

      {/* Content overlay - anchored bottom-left */}
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
        {/* 1. Status pill - fades in first */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, delay: 0 }}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold uppercase tracking-wider mb-4",
            label.className
          )}
        >
          {label.icon}
          {label.text}
        </motion.div>

        {/* 2. Tournament name - slides up + fades */}
        <motion.h1
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-[1.1] line-clamp-2 mb-3 drop-shadow-lg tracking-tight"
        >
          {tournament.name}
        </motion.h1>

        {/* 3. Location with pin icon */}
        {tournament.venue_name && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="flex items-center gap-1.5 text-white/85 text-sm mb-2"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>
              {tournament.venue_name}
              {tournament.venue_city && ` · ${tournament.venue_city}`}
            </span>
          </motion.div>
        )}

        {/* 4. Date */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="text-white/70 text-sm mb-4"
        >
          {format(new Date(tournament.start_date), 'MMM d')} – {format(new Date(tournament.end_date), 'd, yyyy')}
        </motion.p>

        {/* 5. Stat chips - frosted glass style, fades in last */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.35 }}
          className="flex flex-wrap items-center gap-2"
        >
          {tournament.purse && (
            <span className="px-3 py-1.5 rounded-[10px] bg-black/30 backdrop-blur-md text-white text-xs font-medium">
              ${(tournament.purse / 1_000_000).toFixed(1)}M
            </span>
          )}
          {tournament.venue_par && (
            <span className="px-3 py-1.5 rounded-[10px] bg-black/30 backdrop-blur-md text-white text-xs font-medium">
              Par {tournament.venue_par}
            </span>
          )}
          {tournament.venue_yardage && (
            <span className="px-3 py-1.5 rounded-[10px] bg-black/30 backdrop-blur-md text-white text-xs font-medium">
              {tournament.venue_yardage.toLocaleString()} yds
            </span>
          )}
        </motion.div>

        {/* Defending champion */}
        {tournament.defending_champion && type === 'recent' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="mt-4 pt-3 border-t border-white/20 flex items-center gap-2"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-white/80 text-sm">
              Champion: <span className="font-semibold text-white">{tournament.defending_champion}</span>
            </span>
          </motion.div>
        )}
      </div>
    </Link>
  );
}
