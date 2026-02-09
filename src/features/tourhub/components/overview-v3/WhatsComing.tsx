/**
 * WhatsComing - Upcoming tournament cards for the Overview tab
 * Replaces ScheduleModule on the overview page
 * Vertical stack of 4-6 upcoming events across all tours
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, CalendarDays } from 'lucide-react';
import { useUpcomingTournaments } from '../../hooks/useUpcomingTournaments';
import { useVenueImage, getFallbackCourseImage } from '../../hooks/useVenueImage';
import { Skeleton } from '@/components/ui/skeleton';
import type { SeasonTournament } from '../../hooks/useSeasonTournaments';

// ============ Context Label Logic ============

const MAJOR_KEYWORDS = ['masters', 'u.s. open', 'us open', 'open championship', 'pga championship'];
const SIGNATURE_KEYWORDS = ['invitational', 'genesis', 'arnold palmer', 'memorial', 'players'];
const PLAYOFF_KEYWORDS = ['playoff', 'tour championship', 'fedexcup'];

function getContextLabel(tournament: SeasonTournament): string {
  const nameLower = tournament.name.toLowerCase();

  if (MAJOR_KEYWORDS.some((k) => nameLower.includes(k))) return 'Major Championship';
  if (PLAYOFF_KEYWORDS.some((k) => nameLower.includes(k))) return 'Playoff Event';
  if (SIGNATURE_KEYWORDS.some((k) => nameLower.includes(k))) return 'Signature Event';

  return tournament.tourName || 'Tour Event';
}

// ============ Countdown Text ============

function getCountdownText(startDate: string): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const diffMs = start.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / 86400000);

  if (diffDays <= 0) return 'Starts today';
  if (diffDays === 1) return 'Starts tomorrow';
  if (diffDays <= 6) {
    const dayName = start.toLocaleDateString('en-US', { weekday: 'long' });
    return `Starts ${dayName}`;
  }
  if (diffDays <= 30) return `Starts in ${diffDays} days`;

  return start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ============ Single Event Card ============

function EventCard({ tournament, index }: { tournament: SeasonTournament; index: number }) {
  const navigate = useNavigate();
  const { data: venueImage } = useVenueImage(tournament.venueName, tournament.venueCity);
  const imageUrl = venueImage?.imageUrl || getFallbackCourseImage(tournament.name);
  const contextLabel = getContextLabel(tournament);
  const countdown = getCountdownText(tournament.startDate);
  const isMajor = contextLabel === 'Major Championship';

  return (
    <motion.button
      onClick={() => navigate(`/tourhub/tournament/${tournament.id}`)}
      className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-card border border-border/60 text-left transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        delay: 0.08 * index,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {/* Course thumbnail */}
      <div
        className="w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-muted"
        style={{ aspectRatio: '1' }}
      >
        <img
          src={imageUrl}
          alt={tournament.venueName || tournament.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <p
          className="text-foreground truncate"
          style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.2px' }}
        >
          {tournament.name}
        </p>

        <p
          className="mt-0.5 truncate"
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: isMajor ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
          }}
        >
          {contextLabel}
        </p>

        <p
          className="mt-0.5 text-muted-foreground"
          style={{ fontSize: '12px', fontWeight: 500 }}
        >
          {countdown}
        </p>
      </div>

      <ChevronRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
    </motion.button>
  );
}

// ============ Skeleton ============

function EventCardSkeleton() {
  return (
    <div className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-card border border-border/60">
      <Skeleton className="w-16 h-16 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

// ============ Main Component ============

export function WhatsComing() {
  const navigate = useNavigate();
  const { data: tournaments, isLoading } = useUpcomingTournaments(6);

  const upcoming = useMemo(() => {
    if (!tournaments) return [];
    return tournaments.filter(
      (t) => t.status === 'scheduled' || t.status === 'created'
    );
  }, [tournaments]);

  if (isLoading) {
    return (
      <section style={{ paddingTop: '40px', paddingBottom: '16px' }}>
        <div className="flex items-center justify-between px-4 mb-4">
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="flex flex-col gap-2.5 px-4">
          {[1, 2, 3, 4].map((i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (!upcoming.length) return null;

  return (
    <motion.section
      style={{ paddingTop: '40px', paddingBottom: '16px' }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-4">
        <h2
          className="text-foreground"
          style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.3px' }}
        >
          What's Coming
        </h2>

        <button
          onClick={() => navigate('/tourhub?tab=schedule')}
          className="flex items-center gap-1 group transition-all duration-300 active:scale-95 text-muted-foreground"
          style={{ fontSize: '13px', fontWeight: 600 }}
        >
          <span className="group-hover:text-primary transition-colors">
            View Full Schedule
          </span>
          <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-[3px] transition-all" />
        </button>
      </div>

      {/* Vertical card stack */}
      <div className="flex flex-col gap-2.5 px-4">
        {upcoming.map((tournament, index) => (
          <EventCard key={tournament.id} tournament={tournament} index={index} />
        ))}
      </div>
    </motion.section>
  );
}
