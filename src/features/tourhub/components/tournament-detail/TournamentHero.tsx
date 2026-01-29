/**
 * TournamentHero - Cinematic immersive hero for tournament detail
 * 
 * Features:
 * - Full-bleed 340px immersive container
 * - Ken Burns animation (scale 1.08)
 * - Premium glassmorphism status badges
 * - Gradient scrim overlays
 * - Floating metadata pills
 */

import { format } from 'date-fns';
import { MapPin, Calendar, DollarSign, Flag, Ruler, Zap, Trophy, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { TourTournament } from '../../hooks/useTourHubData';

interface TournamentHeroProps {
  tournament: TourTournament;
  imageUrl: string | null;
}

// Cinematic status badge
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { 
    label: string; 
    icon: React.ReactNode;
    className: string;
    pulse?: boolean;
  }> = {
    inprogress: { 
      label: 'LIVE', 
      icon: <Zap className="w-3.5 h-3.5" />,
      className: 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/30',
      pulse: true,
    },
    scheduled: { 
      label: 'UPCOMING', 
      icon: <Clock className="w-3.5 h-3.5" />,
      className: 'bg-white/15 backdrop-blur-xl text-white border border-white/20',
    },
    created: { 
      label: 'SCHEDULED', 
      icon: <Calendar className="w-3.5 h-3.5" />,
      className: 'bg-white/15 backdrop-blur-xl text-white border border-white/20',
    },
    closed: { 
      label: 'COMPLETED', 
      icon: <Trophy className="w-3.5 h-3.5" />,
      className: 'bg-black/40 backdrop-blur-xl text-white border border-white/10',
    },
  };

  const c = config[status] || config.scheduled;

  return (
    <div className={cn(
      "inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold uppercase tracking-wider",
      c.className
    )}>
      {c.pulse && (
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
        </span>
      )}
      {!c.pulse && c.icon}
      {c.label}
    </div>
  );
}

export function TournamentHero({ tournament, imageUrl }: TournamentHeroProps) {
  const formattedPurse = tournament.purse 
    ? `$${(tournament.purse / 1_000_000).toFixed(1)}M`
    : null;

  return (
    <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 overflow-hidden" style={{ marginTop: '-55px' }}>
      {/* Background container with Ken Burns */}
      <motion.div 
        className="relative overflow-hidden"
        style={{ height: 'calc(340px + 55px)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Background image with Ken Burns animation */}
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 12, ease: 'linear' }}
        >
          {imageUrl ? (
            <img 
              src={imageUrl}
              alt={tournament.venue_name || tournament.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900" />
          )}
        </motion.div>
        
        {/* Multi-layer cinematic gradient scrim */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.2) 100%),
              linear-gradient(to right, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 60%)
            `,
          }}
        />

        {/* Header safe zone gradient */}
        <div 
          className="absolute top-0 left-0 right-0 h-24"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 100%)',
          }}
        />

        {/* Status Badge - positioned below header */}
        <motion.div 
          className="absolute left-4 z-10"
          style={{ top: 'calc(55px + 16px)' }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <StatusBadge status={tournament.status} />
        </motion.div>

        {/* Content overlay - bottom aligned */}
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
          {/* Tournament Name */}
          <motion.h1 
            className="font-extrabold text-white mb-3"
            style={{ 
              fontSize: 'clamp(28px, 6vw, 40px)',
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              textShadow: '0 4px 24px rgba(0,0,0,0.6)',
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {tournament.name}
          </motion.h1>

          {/* Date and Location row */}
          <motion.div 
            className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <span 
              className="flex items-center gap-1.5 text-sm font-medium text-white"
              style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
            >
              <Calendar className="w-4 h-4 text-white/70" />
              {format(new Date(tournament.start_date), 'MMM d')} – {format(new Date(tournament.end_date), 'd, yyyy')}
            </span>
            
            {(tournament.venue_city || tournament.venue_country) && (
              <span 
                className="flex items-center gap-1.5 text-sm text-white/80"
                style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
              >
                <MapPin className="w-4 h-4 text-white/70" />
                {[tournament.venue_city, tournament.venue_country].filter(Boolean).join(', ')}
              </span>
            )}
          </motion.div>

          {/* Glassmorphic metadata pills */}
          <motion.div 
            className="flex flex-wrap items-center gap-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {formattedPurse && (
              <div 
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
                style={{ 
                  background: 'rgba(255,255,255,0.15)', 
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>{formattedPurse}</span>
              </div>
            )}
            
            {tournament.venue_course_name && (
              <div 
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white/90"
                style={{ 
                  background: 'rgba(255,255,255,0.1)', 
                  backdropFilter: 'blur(8px)',
                }}
              >
                <Flag className="w-3.5 h-3.5" />
                <span className="max-w-[150px] truncate">{tournament.venue_course_name}</span>
              </div>
            )}
            
            {tournament.venue_par && (
              <div 
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-white/80"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              >
                <span>Par {tournament.venue_par}</span>
              </div>
            )}
            
            {tournament.venue_yardage && (
              <div 
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-white/80"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              >
                <Ruler className="w-3.5 h-3.5" />
                <span>{tournament.venue_yardage.toLocaleString()} yds</span>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
