/**
 * WhatsComing - Upcoming tournament list for the Overview tab
 * Clean list layout matching reference: date block | context + name + venue | date
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useUpcomingTournaments } from '../../hooks/useUpcomingTournaments';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionErrorState } from '../SectionErrorState';
import { getTourLogo } from '../../utils/tourLogos';
import type { SeasonTournament } from '../../hooks/useSeasonTournaments';
import { getContextLabel, TOUR_NAME_TO_SLUG } from '../../utils/tournamentClassification';

// ============ Date formatting helpers ============

function getMonthAbbr(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  return new Intl.DateTimeFormat('en-US', { month: 'short' }).format(d).toUpperCase();
}

function getDayNum(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  return new Intl.DateTimeFormat('en-US', { day: 'numeric' }).format(d);
}

function getVenueString(tournament: SeasonTournament): string {
  const parts: string[] = [];
  if (tournament.venueName) parts.push(tournament.venueName);
  if (tournament.venueCity) parts.push(tournament.venueCity);
  return parts.join(' · ') || '';
}

// ============ Single Event Row ============

function EventRow({ tournament, index }: { tournament: SeasonTournament; index: number }) {
  const navigate = useNavigate();
  const contextLabel = getContextLabel(tournament);
  const isSpecialEvent = ['MAJOR CHAMPIONSHIP', 'SIGNATURE EVENT', 'ROLEX SERIES', 'PLAYOFF EVENT'].includes(contextLabel);
  const isMajor = contextLabel === 'MAJOR CHAMPIONSHIP';
  const isSignature = contextLabel === 'SIGNATURE EVENT';
  const isRolex = contextLabel === 'ROLEX SERIES';
  const venue = getVenueString(tournament);
  const tourSlug = TOUR_NAME_TO_SLUG[tournament.tourName || ''] || '';
  const tourLogoSrc = tourSlug ? getTourLogo(tourSlug) : null;

  // Left border accent: amber for majors, emerald for signature/rolex
  const leftBorderStyle = isMajor
    ? '3px solid #f59e0b'
    : (isSignature || isRolex)
      ? '3px solid rgba(16, 185, 129, 0.8)'
      : '3px solid transparent';

  // Label colour — only used when isSpecialEvent is true
  const labelColor = isMajor
    ? 'rgba(245, 158, 11, 0.9)'
    : contextLabel === 'PLAYOFF EVENT'
      ? 'rgba(99, 102, 241, 0.8)'
      : 'rgba(16, 185, 129, 0.9)'; // emerald for SIGNATURE EVENT + ROLEX SERIES

  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/tourhub/tournament/${tournament.id}`)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/tourhub/tournament/${tournament.id}`); }}
      className="w-full flex items-center gap-3 px-3.5 py-2.5 bg-card rounded-2xl border border-border/50 text-left transition-all active:scale-[0.98]"
      style={{ borderLeft: leftBorderStyle, cursor: 'pointer' }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05 * index, ease: [0.16, 1, 0.3, 1] }}
      aria-label={`${tournament.name}, ${getMonthAbbr(tournament.startDate)} ${getDayNum(tournament.startDate)}${venue ? `, at ${venue}` : ''}`}
    >
      {/* Date block */}
      <div className="flex-shrink-0 w-11 text-center">
        <p className="uppercase leading-none text-[0.5625rem] font-medium tracking-wide text-muted-foreground/70">
          {getMonthAbbr(tournament.startDate)}
        </p>
        <p className="leading-none mt-0.5 text-[1.125rem] font-bold text-foreground">
          {getDayNum(tournament.startDate)}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {isSpecialEvent && (
          <span style={{
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
            color: labelColor,
            display: 'block',
            lineHeight: 1,
            marginBottom: '3px',
          }}>
            {contextLabel}
          </span>
        )}
        <p className="text-[0.9375rem] font-semibold text-foreground truncate" style={{ letterSpacing: '-0.2px' }}>
          {tournament.name}
        </p>
        {venue && (
          <p className="text-[0.75rem] text-muted-foreground/60 truncate mt-0.5 leading-none">
            {venue}
          </p>
        )}
      </div>

      {/* Tour logo */}
      {tourLogoSrc && (
        <div
          className="flex-shrink-0 flex items-center justify-center opacity-45"
          style={{
            width: ['pga', 'lpga'].includes(tourSlug) ? 30 : 36,
            height: ['pga', 'lpga'].includes(tourSlug) ? 30 : 36,
          }}
        >
          <img
            src={tourLogoSrc}
            alt={tournament.tourName || 'Tour'}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </motion.div>
  );
}

// ============ Skeleton ============

function EventRowSkeleton() {
  return (
    <div className="w-full flex items-center gap-3 px-3.5 py-2.5 bg-card rounded-2xl border border-border/50">
      <div className="flex-shrink-0 w-12 flex flex-col items-center gap-1">
        <Skeleton className="h-3 w-8" />
        <Skeleton className="h-6 w-7" />
      </div>
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-2.5 w-20" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

// ============ Main Component ============

export function WhatsComing() {
  const navigate = useNavigate();
  const { data: tournaments, isLoading, error, refetch } = useUpcomingTournaments(6);

  const upcoming = useMemo(() => {
    if (!tournaments) return [];
    return tournaments.filter(
      (t) => t.status === 'scheduled' || t.status === 'created'
    );
  }, [tournaments]);

  if (isLoading) {
    return (
      <section aria-label="Upcoming tournaments">
        <div className="px-4 mb-3">
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="flex flex-col gap-2 px-4">
          {[1, 2, 3, 4].map((i) => (
            <EventRowSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  // FIX 08: Show error state instead of silently hiding
  if (error) {
    return (
      <section aria-label="Upcoming tournaments">
        <SectionErrorState sectionName="upcoming tournaments" onRetry={() => refetch()} />
      </section>
    );
  }

  if (!upcoming.length) return null;

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      aria-label="Upcoming tournaments"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-foreground text-[1.375rem] font-bold" style={{ letterSpacing: '-0.3px' }}>
          What's Coming Up
        </h2>

        <button
          onClick={() => navigate('/tourhub?tab=schedule')}
          className="flex items-center gap-0.5 transition-all active:scale-95 text-muted-foreground text-[0.8125rem] font-medium"
          style={{ minHeight: '44px' }}
          aria-label="View full tournament schedule"
        >
          <span>View Full Schedule</span>
          <ChevronRight className="w-3.5 h-3.5 opacity-60" />
        </button>
      </div>

      {/* Event list */}
      <div className="flex flex-col gap-2 px-4">
        {upcoming.map((tournament, index) => (
          <EventRow key={tournament.id} tournament={tournament} index={index} />
        ))}
      </div>
    </motion.section>
  );
}
