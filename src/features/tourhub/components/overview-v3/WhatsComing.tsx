/**
 * WhatsComing - Upcoming tournament list grouped by date
 * Majors get a featured amber card. Signature/Rolex events keep emerald left bar.
 * Events on the same start date are grouped under a single date header.
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useUpcomingTournaments } from '../../hooks/useUpcomingTournaments';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionErrorState } from '../SectionErrorState';
import { getTourLogo } from '../../utils/tourLogos';
import { TOUR_COLORS } from '../../constants/colors';
import type { SeasonTournament } from '../../hooks/useSeasonTournaments';
import { getContextLabel, TOUR_NAME_TO_SLUG } from '../../utils/tournamentClassification';

// ── Date helpers ──────────────────────────────────────────────────────────

function getMonthAbbr(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  return new Intl.DateTimeFormat('en-US', { month: 'short' }).format(d).toUpperCase();
}

function getDayNum(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  return new Intl.DateTimeFormat('en-US', { day: 'numeric' }).format(d);
}

function getDateKey(dateStr: string): string {
  return `${getMonthAbbr(dateStr)} ${getDayNum(dateStr)}`;
}

function getVenueString(tournament: SeasonTournament): string {
  const parts: string[] = [];
  if (tournament.venueName) parts.push(tournament.venueName);
  if (tournament.venueCity) parts.push(tournament.venueCity);
  return parts.join(' · ') || '';
}

// ── Tour badge ────────────────────────────────────────────────────────────

function TourLogo({ tourSlug, isMajor }: { tourSlug: string; isMajor: boolean }) {
  const WIDE = ['pga', 'lpga'];
  const src = tourSlug ? getTourLogo(tourSlug) : null;
  if (!src) return null;
  const size = WIDE.includes(tourSlug) ? 32 : 38;
  return (
    <div style={{ flexShrink: 0, opacity: isMajor ? 0.7 : 0.5 }}>
      <img
        src={src}
        alt={tourSlug}
        style={{ width: size, height: size, objectFit: 'contain' }}
      />
    </div>
  );
}

// ── Major featured card ───────────────────────────────────────────────────

function MajorCard({
  tournament,
  index,
}: {
  tournament: SeasonTournament;
  index: number;
}) {
  const navigate = useNavigate();
  const rawTourSlug = TOUR_NAME_TO_SLUG[tournament.tourName || ''] || '';
  const tourSlug = rawTourSlug !== 'pga' ? 'pga' : rawTourSlug;
  const venue = getVenueString(tournament);

  return (
    <motion.button
      onClick={() => navigate(`/tourhub/tournament/${tournament.id}`)}
      className="w-full text-left active:scale-[0.99] transition-transform"
      style={{
        background: `linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(255,255,255,0.9) 100%)`,
        borderRadius: '16px',
        border: `1.5px solid rgba(245,158,11,0.35)`,
        padding: '14px 16px',
        boxShadow: `0 2px 12px rgba(245,158,11,0.12)`,
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05 * index, ease: [0.16, 1, 0.3, 1] }}
      aria-label={`${tournament.name}, Major Championship`}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span
          style={{
            fontSize: '9px',
            fontWeight: 800,
            letterSpacing: '1.5px',
            color: TOUR_COLORS.intelligenceGold,
          }}
        >
          MAJOR CHAMPIONSHIP
        </span>
        <TourLogo tourSlug={tourSlug} isMajor />
      </div>
      <div
        style={{
          fontSize: '15px',
          fontWeight: 800,
          color: 'hsl(var(--foreground))',
          lineHeight: 1.3,
          marginBottom: '4px',
        }}
      >
        {tournament.name}
      </div>
      {venue && (
        <div
          style={{
            fontSize: '11px',
            color: 'hsl(var(--muted-foreground))',
            fontWeight: 500,
            marginBottom: '2px',
          }}
        >
          {venue}
        </div>
      )}
      {tournament.defendingChampion && (
        <div
          style={{
            fontSize: '10px',
            color: 'hsl(var(--muted-foreground) / 0.7)',
            fontWeight: 600,
            marginTop: '4px',
          }}
        >
          Defending: {tournament.defendingChampion}
        </div>
      )}
    </motion.button>
  );
}

// ── Standard event row ────────────────────────────────────────────────────

function EventRow({
  tournament,
  index,
}: {
  tournament: SeasonTournament;
  index: number;
}) {
  const navigate = useNavigate();
  const contextLabel = getContextLabel(tournament);
  const isSignature = contextLabel === 'SIGNATURE EVENT' || contextLabel === 'ROLEX SERIES';
  const isPlayoff = contextLabel === 'PLAYOFF EVENT';
  const venue = getVenueString(tournament);
  const tourSlug = TOUR_NAME_TO_SLUG[tournament.tourName || ''] || '';

  const leftBorderColor = isSignature
    ? 'rgba(16,185,129,0.8)'
    : isPlayoff
    ? 'rgba(99,102,241,0.8)'
    : 'transparent';

  const labelColor = isSignature
    ? 'rgba(16,185,129,0.9)'
    : isPlayoff
    ? 'rgba(99,102,241,0.8)'
    : 'transparent';

  return (
    <motion.button
      onClick={() => navigate(`/tourhub/tournament/${tournament.id}`)}
      className="w-full text-left active:scale-[0.98] transition-transform"
      style={{
        background: 'hsl(var(--card))',
        borderRadius: '14px',
        border: `1px solid hsl(var(--border) / 0.5)`,
        borderLeft: isSignature || isPlayoff
          ? `3px solid ${leftBorderColor}`
          : `1px solid hsl(var(--border) / 0.5)`,
        padding: '11px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.04 * index, ease: [0.16, 1, 0.3, 1] }}
      aria-label={`${tournament.name}`}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {(isSignature || isPlayoff) && (
          <span
            style={{
              fontSize: '8px',
              fontWeight: 800,
              letterSpacing: '1.2px',
              color: labelColor,
              display: 'block',
              marginBottom: '3px',
            }}
          >
            {contextLabel}
          </span>
        )}
        <div
          style={{
            fontSize: '13.5px',
            fontWeight: 700,
            color: 'hsl(var(--foreground))',
            lineHeight: 1.3,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {tournament.name}
        </div>
        {venue && (
          <div
            style={{
              fontSize: '11px',
              color: 'hsl(var(--muted-foreground))',
              fontWeight: 500,
              marginTop: '2px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {venue}
          </div>
        )}
        {tournament.defendingChampion && (
          <div
            style={{
              fontSize: '10px',
              color: 'hsl(var(--muted-foreground) / 0.6)',
              fontWeight: 600,
              marginTop: '3px',
            }}
          >
            Defending: {tournament.defendingChampion}
          </div>
        )}
      </div>
      <TourLogo tourSlug={tourSlug} isMajor={false} />
    </motion.button>
  );
}

// ── Date group header ─────────────────────────────────────────────────────

function DateGroupHeader({ label, count }: { label: string; count: number }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '4px 0',
      }}
    >
      <span
        style={{
          fontSize: '13px',
          fontWeight: 800,
          color: 'hsl(var(--foreground))',
          letterSpacing: '-0.2px',
        }}
      >
        {label}
      </span>
      <div
        style={{
          flex: 1,
          height: '1px',
          background: 'hsl(var(--border) / 0.4)',
        }}
      />
      <span
        style={{
          fontSize: '10px',
          fontWeight: 600,
          color: 'hsl(var(--muted-foreground) / 0.5)',
          letterSpacing: '0.5px',
        }}
      >
        {count} {count === 1 ? 'event' : 'events'}
      </span>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────

function EventRowSkeleton() {
  return (
    <div
      className="rounded-[14px] bg-card border border-border/50"
      style={{ padding: '11px 14px' }}
    >
      <div className="space-y-2">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-2.5 w-24" />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────

export function WhatsComing() {
  const navigate = useNavigate();
  const { data: tournaments, isLoading, error, refetch } = useUpcomingTournaments(6);

  if (isLoading) {
    return (
      <section className="px-4" aria-label="Upcoming tournaments">
        <div className="mb-4">
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <EventRowSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="px-4" aria-label="Upcoming tournaments">
        <SectionErrorState sectionName="upcoming tournaments" onRetry={() => refetch()} />
      </section>
    );
  }

  if (!tournaments?.length) return null;

  // Group by start date
  const groups: { key: string; events: SeasonTournament[] }[] = [];
  const seen = new Map<string, number>();
  for (const t of tournaments) {
    const key = getDateKey(t.startDate);
    if (seen.has(key)) {
      groups[seen.get(key)!].events.push(t);
    } else {
      seen.set(key, groups.length);
      groups.push({ key, events: [t] });
    }
  }

  let globalIndex = 0;

  return (
    <section className="px-4" aria-label="Upcoming tournaments">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-[15px] font-extrabold tracking-tight"
          style={{ color: 'hsl(var(--foreground))' }}
        >
          What's Coming Up
        </h2>
        <button
          onClick={() => navigate('/tourhub?tab=schedule')}
          className="flex items-center gap-0.5 transition-all active:scale-95 text-muted-foreground text-[0.8125rem] font-medium"
          style={{ minHeight: '44px' }}
          aria-label="View full tournament schedule"
        >
          View Full Schedule
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Date groups */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {groups.map((group) => (
          <div key={group.key}>
            <DateGroupHeader label={group.key} count={group.events.length} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
              {group.events.map((tournament) => {
                const contextLabel = getContextLabel(tournament);
                const isMajor = contextLabel === 'MAJOR CHAMPIONSHIP';
                const idx = globalIndex++;
                return isMajor ? (
                  <MajorCard key={tournament.id} tournament={tournament} index={idx} />
                ) : (
                  <EventRow key={tournament.id} tournament={tournament} index={idx} />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
