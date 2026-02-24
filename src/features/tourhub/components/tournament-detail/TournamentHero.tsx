/**
 * TournamentHero - Cinematic immersive hero with gradient scrim
 */

import { format, isSameMonth } from 'date-fns';
import { MapPin, Calendar, DollarSign, Flag, Ruler, Clock, CheckCircle2, Menu } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import { openTourNav } from '../../contexts/TourNavContext';
import type { TourTournament } from '../../hooks/useTourHubData';

interface TournamentHeroProps {
  tournament: TourTournament;
  imageUrl: string | null;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { 
    label: string; 
    icon: React.ReactNode;
    pulse?: boolean;
  }> = {
    inprogress: { 
      label: 'LIVE', 
      icon: null,
      pulse: true,
    },
    scheduled: { 
      label: 'UPCOMING', 
      icon: <Clock className="w-3.5 h-3.5 text-white" />,
    },
    created: { 
      label: 'SCHEDULED', 
      icon: <Clock className="w-3.5 h-3.5 text-white" />,
    },
    closed: { 
      label: 'COMPLETED', 
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-white" />,
    },
  };

  const c = config[status] || config.scheduled;

  return (
    <div
      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-white"
      style={{
        background: 'rgba(0,0,0,0.40)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {c.pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22C55E]" />
        </span>
      )}
      {!c.pulse && c.icon}
      {c.label}
    </div>
  );
}

function HeroPill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div 
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white active:opacity-70 transition-opacity",
        className
      )}
      style={{ 
        background: 'rgba(0,0,0,0.35)', 
        backdropFilter: 'blur(12px)',
      }}
    >
      {children}
    </div>
  );
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isSameMonth(start, end)) {
    return `${format(start, 'MMM d')} – ${format(end, 'd, yyyy')}`;
  }
  return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
}

export function TournamentHero({ tournament, imageUrl }: TournamentHeroProps) {
  const { scrollY } = useScroll();
  const imageY = useTransform(scrollY, [0, 400], [0, 60]);

  const formattedPurse = tournament.purse 
    ? `$${(tournament.purse / 1_000_000).toFixed(1)}M`
    : null;

  return (
    <div className="relative overflow-hidden">
      <motion.div 
        className="relative overflow-hidden"
        style={{ minHeight: 'calc(45dvh + max(var(--sat, env(safe-area-inset-top, 0px)), 47px))' }}
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

        {/* Canonical gradient scrim */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 35%, rgba(0,0,0,0.05) 60%, transparent 80%)',
          }}
        />

        {/* Burger menu — standard Tour Hub position */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); openTourNav(); }}
          aria-label="Open tour menu"
          className="absolute z-30 flex items-center justify-center"
          style={{ width: 44, height: 44, top: 56, left: 16 }}
        >
          <Menu
            className="w-[24px] h-[24px] text-white"
            style={{ strokeWidth: 1.5, filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.7)) drop-shadow(0 0px 8px rgba(0,0,0,0.3))' }}
          />
        </button>

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
          <motion.h1 
            className="font-bold text-white mb-3"
            style={{ 
              fontSize: '28px',
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: '-0.3px',
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
              <Calendar className="w-3.5 h-3.5 text-white/70" />
              {formatDateRange(tournament.start_date, tournament.end_date)}
            </span>
            
            {(tournament.venue_city || tournament.venue_country) && (
              <span 
                className="flex items-center gap-1.5 text-sm text-white/80"
                style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
              >
                <MapPin className="w-3.5 h-3.5 text-white/70" />
                {[tournament.venue_city, tournament.venue_country].filter(Boolean).join(', ')}
              </span>
            )}
          </motion.div>

          {/* Metadata pills */}
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
                <span className="max-w-[180px] truncate">{tournament.venue_course_name}</span>
              </HeroPill>
            )}
            
            {tournament.venue_par && (
              <HeroPill>
                <Flag className="w-3.5 h-3.5" />
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
