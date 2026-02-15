/**
 * TournamentHero - Cinematic immersive hero for tournament detail
 * 
 * Features:
 * - Full-bleed viewport-relative immersive container
 * - Ken Burns animation (scale 1.06)
 * - Parallax scroll effect
 * - Glass back button (top-left)
 * - LIVE badge (top-right)
 * - Premium glassmorphism status badges
 * - Gradient scrim overlays
 * - Floating metadata pills
 * - Line-clamped tournament name
 */

import { format } from 'date-fns';
import { MapPin, Calendar, DollarSign, Flag, Ruler, Zap, Trophy, Clock, ArrowLeft } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
      className: 'bg-[#34C759] text-white shadow-lg shadow-[#34C759]/30',
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

// Standardized glassmorphic pill
function HeroPill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div 
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white active:opacity-70 transition-opacity",
        className
      )}
      style={{ 
        background: 'rgba(255,255,255,0.12)', 
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      {children}
    </div>
  );
}

export function TournamentHero({ tournament, imageUrl }: TournamentHeroProps) {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const imageY = useTransform(scrollY, [0, 400], [0, 60]);

  const formattedPurse = tournament.purse 
    ? `$${(tournament.purse / 1_000_000).toFixed(1)}M`
    : null;

  return (
    <div className="relative overflow-hidden">
      {/* Background container with Ken Burns */}
      <motion.div 
        className="relative overflow-hidden"
        style={{ minHeight: 'calc(45vh + max(var(--sat, env(safe-area-inset-top, 0px)), 47px))' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Background image with Ken Burns + parallax */}
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.06 }}
          animate={{ scale: 1 }}
          transition={{ duration: 15, ease: 'linear' }}
          style={{ y: imageY }}
        >
          {imageUrl ? (
            <img 
              src={imageUrl}
              alt={tournament.venue_name || tournament.name}
              className="w-full h-full object-cover"
              loading="eager"
              fetchPriority="high"
            />
          ) : (
            <div 
              className="w-full h-full" 
              style={{
                background: 'linear-gradient(135deg, hsl(var(--foreground)) 0%, hsl(220, 30%, 20%) 50%, hsl(var(--foreground)) 100%)',
              }}
            />
          )}
        </motion.div>
        

        {/* Glass Back Button - top-left */}
        <motion.button
          onClick={() => navigate(-1)}
          className="absolute left-4 z-20 flex items-center gap-2 px-3 py-2 rounded-full"
          style={{
            top: 'calc(max(var(--sat, env(safe-area-inset-top, 0px)), 47px) + 8px)',
            background: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.15)',
          }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          <ArrowLeft className="w-4 h-4 text-white" />
          <span className="text-white text-sm font-medium">Back</span>
        </motion.button>

        {/* Status Badge - top-right */}
        <motion.div 
          className="absolute right-4 z-10"
          style={{ top: 'calc(max(var(--sat, env(safe-area-inset-top, 0px)), 47px) + 8px)' }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <StatusBadge status={tournament.status} />
        </motion.div>

        {/* Content overlay - bottom aligned */}
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
          {/* Tournament Name - line clamped */}
          <motion.h1 
            className="font-extrabold text-white mb-3"
            style={{ 
              fontSize: 'clamp(28px, 6vw, 40px)',
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              textShadow: '0 4px 24px rgba(0,0,0,0.6)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {tournament.name}
          </motion.h1>

          {/* Date and Location row */}
          <motion.div 
            className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
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

          {/* Glassmorphic metadata pills - staggered */}
          <motion.div 
            className="flex flex-wrap items-center gap-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {formattedPurse && (
              <HeroPill>
                <DollarSign className="w-3.5 h-3.5" />
                <span>{formattedPurse}</span>
              </HeroPill>
            )}
            
            {tournament.venue_course_name && (
              <HeroPill>
                <Flag className="w-3.5 h-3.5" />
                <span className="max-w-[150px] truncate">{tournament.venue_course_name}</span>
              </HeroPill>
            )}
            
            {tournament.venue_par && (
              <HeroPill>
                <span>Par {tournament.venue_par}</span>
              </HeroPill>
            )}
            
            {tournament.venue_yardage && (
              <HeroPill>
                <Ruler className="w-3.5 h-3.5" />
                <span>{tournament.venue_yardage.toLocaleString()} yds</span>
              </HeroPill>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}