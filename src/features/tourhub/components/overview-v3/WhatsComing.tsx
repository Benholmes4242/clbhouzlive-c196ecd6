/**
 * WhatsComing - Upcoming tournaments grouped by date.
 * Majors get a featured amber card. Signature events get subtle top border.
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useUpcomingTournaments } from '../../hooks/useUpcomingTournaments';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionErrorState } from '../SectionErrorState';
import { TOUR_COLORS } from '../../constants/colors';
import type { SeasonTournament } from '../../hooks/useSeasonTournaments';
import { getContextLabel, TOUR_NAME_TO_SLUG } from '../../utils/tournamentClassification';

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

function getVenueString(t: SeasonTournament): string {
  const parts: string[] = [];
  if (t.venueName) parts.push(t.venueName);
  if (t.venueCity) parts.push(t.venueCity);
  return parts.join(' · ') || '';
}

function formatPurse(purse: number | null): string | null {
  if (!purse) return null;
  return `$${(purse / 1_000_000).toFixed(1)}M`;
}

function getTourPillLabel(tourName: string | undefined | null): string {
  if (!tourName) return '';
  return tourName
    .replace('PGA Tour', 'PGA TOUR')
    .replace('LPGA Tour', 'LPGA')
    .replace('LIV Golf', 'LIV GOLF')
    .replace('Champions Tour', 'CHAMPIONS')
    .replace('Korn Ferry Tour', 'KORN FERRY')
    .replace('DP World Tour', 'DP WORLD')
    .toUpperCase();
}

function DateGroupHeader({ label, count }: { label: string; count: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{
        background: 'hsl(var(--foreground))',
        color: 'hsl(var(--background))',
        borderRadius: '8px',
        padding: '4px 10px',
        fontSize: '11px',
        fontWeight: 800,
        letterSpacing: '0.3px',
        flexShrink: 0,
      }}>
        {label}
      </div>
      <div style={{ flex: 1, height: '1px', background: 'hsl(var(--border) / 0.5)' }} />
      <span
        style={{ fontSize: '11px', fontWeight: 500, color: 'hsl(var(--muted-foreground))', whiteSpace: 'nowrap' }}
      >
        {count} {count === 1 ? 'event' : 'events'}
      </span>
    </div>
  );
}

function MajorCard({ tournament, index }: { tournament: SeasonTournament; index: number }) {
  const navigate = useNavigate();
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.12em', color: TOUR_COLORS.intelligenceGold, textTransform: 'uppercase' as const }}>
          ★ Major Championship
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {tournament.purse && (
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(var(--muted-foreground))' }}>
              ${(tournament.purse / 1_000_000).toFixed(1)}M
            </span>
          )}
          <div style={{
            fontSize: '9px',
            fontWeight: 800,
            color: '#fff',
            background: '#0F172A',
            borderRadius: '5px',
            padding: '2px 7px',
            letterSpacing: '0.05em',
            whiteSpace: 'nowrap',
          }}>
            {tournament.tourName
              ?.replace('PGA Tour', 'PGA TOUR')
              ?.replace('LPGA Tour', 'LPGA')
              ?.replace('LIV Golf', 'LIV GOLF')
              ?.replace('Champions Tour', 'CHAMPIONS')
              ?.replace('Korn Ferry Tour', 'KORN FERRY')
              ?.replace('DP World Tour', 'DP WORLD')
              ?.toUpperCase() ?? ''}
          </div>
        </div>
      </div>
      <div style={{ fontSize: '16px', fontWeight: 700, color: 'hsl(var(--foreground))', lineHeight: 1.25, marginBottom: '4px' }}>
        {tournament.name}
      </div>
      {venue && <p style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))', margin: 0 }}>{venue}</p>}
      {tournament.defendingChampion && (
        <p style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginTop: '4px', margin: '4px 0 0' }}>
          Defending: {tournament.defendingChampion}
        </p>
      )}
    </motion.button>
  );
}

function EventRow({ tournament, index }: { tournament: SeasonTournament; index: number }) {
  const navigate = useNavigate();
  const contextLabel = getContextLabel(tournament);
  const isSignature = contextLabel === 'SIGNATURE EVENT' || contextLabel === 'ROLEX SERIES';
  const venue = getVenueString(tournament);

  return (
    <motion.button
      onClick={() => navigate(`/tourhub/tournament/${tournament.id}`)}
      className="w-full text-left active:scale-[0.98] transition-transform"
      style={{
        background: '#fff',
        borderRadius: '14px',
        border: '1px solid rgba(15,23,42,0.08)',
        borderTop: isSignature ? '2px solid rgba(15,23,42,0.15)' : '1px solid rgba(15,23,42,0.08)',
        padding: isSignature ? '10px 14px 11px' : '11px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 1px 4px rgba(15,23,42,0.04)',
      }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.04 * index, ease: [0.16, 1, 0.3, 1] }}
      aria-label={tournament.name}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {isSignature && (
          <span style={{
            fontSize: '9px',
            fontWeight: 800,
            letterSpacing: '0.12em',
            color: 'rgba(15,23,42,0.4)',
            textTransform: 'uppercase' as const,
            display: 'block',
            marginBottom: '3px',
          }}>
            Signature Event
          </span>
        )}
        <div style={{
          fontSize: '14px',
          fontWeight: 700,
          color: 'hsl(var(--foreground))',
          lineHeight: 1.25,
          marginBottom: '2px',
        }}>
          {tournament.name}
        </div>
        {venue && (
          <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', lineHeight: 1.3 }}>
            {venue}
          </div>
        )}
        {tournament.defendingChampion && (
          <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginTop: '2px' }}>
            Defending: {tournament.defendingChampion}
          </div>
        )}
      </div>

      {/* Tour pill + purse */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
        <div style={{
          fontSize: '9px',
          fontWeight: 800,
          color: '#fff',
          background: '#0F172A',
          borderRadius: '5px',
          padding: '2px 7px',
          letterSpacing: '0.05em',
          whiteSpace: 'nowrap',
        }}>
          {getTourPillLabel(tournament.tourName)}
        </div>
        {tournament.purse && (
          <div style={{ fontSize: '10px', color: 'hsl(var(--muted-foreground))' }}>
            {formatPurse(tournament.purse)}
          </div>
        )}
      </div>
    </motion.button>
  );
}

function EventRowSkeleton() {
  return (
    <div style={{ background: 'hsl(var(--card))', borderRadius: '14px', border: '1px solid hsl(var(--border) / 0.5)', padding: '12px 14px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function WhatsComing() {
  const navigate = useNavigate();
  const { data: tournaments, isLoading, error, refetch } = useUpcomingTournaments(6);

  if (isLoading) {
    return (
      <div style={{ padding: '0 16px' }}>
        <Skeleton className="h-5 w-40 mb-3" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1, 2, 3, 4].map((i) => <EventRowSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '0 16px' }}>
        <SectionErrorState sectionName="What's Coming Up" onRetry={() => refetch()} />
      </div>
    );
  }

  if (!tournaments?.length) return null;

  // Group tournaments by start date
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
    <div style={{ padding: '0 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <span style={{ fontSize: '17px', fontWeight: 700, color: 'hsl(var(--foreground))' }}>
          What's Coming Up
        </span>
        <button
          onClick={() => navigate('/tourhub?tab=schedule')}
          className="flex items-center gap-0.5 transition-all active:scale-95 text-muted-foreground text-[0.8125rem] font-medium"
          style={{ minHeight: '44px' }}
          aria-label="View full tournament schedule"
        >
          View Full Schedule
          <ChevronRight style={{ width: 14, height: 14 }} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {groups.map((group) => (
          <div key={group.key}>
            <DateGroupHeader label={group.key} count={group.events.length} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
              {group.events.map((tournament) => {
                const contextLabel = getContextLabel(tournament);
                const isMajor = contextLabel === 'MAJOR CHAMPIONSHIP';
                const idx = globalIndex++;
                return isMajor
                  ? <MajorCard key={tournament.id} tournament={tournament} index={idx} />
                  : <EventRow key={tournament.id} tournament={tournament} index={idx} />;
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
