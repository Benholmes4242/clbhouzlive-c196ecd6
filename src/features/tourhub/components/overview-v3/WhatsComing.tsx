/**
 * WhatsComing - Upcoming tournaments grouped by date.
 * Flat ruled table design with unified EventRow.
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useUpcomingTournaments } from '../../hooks/useUpcomingTournaments';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionErrorState } from '../SectionErrorState';
import { formatPurse } from '../shared/TourHeroHelpers';
import type { SeasonTournament } from '../../hooks/useSeasonTournaments';
import { getContextLabel } from '../../utils/tournamentClassification';

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

function DateGroupHeader({ label, count }: { label: string; count: number }) {
  return (
    <div
      style={{
        padding: '12px 16px 8px',
        borderBottom: '0.5px solid rgba(15,23,42,0.07)',
        background: 'rgba(15,23,42,0.02)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: 3, height: 12, background: '#0F172A', borderRadius: 1, flexShrink: 0 }} />
        <span style={{ fontSize: '9px', fontWeight: 900, color: '#0F172A', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
          {label}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '10px', fontWeight: 700, color: '#F7931E' }}>
          {count} {count === 1 ? 'event' : 'events'}
        </span>
      </div>
    </div>
  );
}

function getPrefixedContextLabel(contextLabel: string, tourName: string | null | undefined): string {
  const isMajor = contextLabel === 'MAJOR CHAMPIONSHIP';
  const isSignature = contextLabel === 'SIGNATURE EVENT' || contextLabel === 'ROLEX SERIES';
  if (!isMajor && !isSignature) return contextLabel;
  const prefixMap: Record<string, string> = {
    'PGA Tour': 'PGA Tour', 'LPGA Tour': 'LPGA Tour', 'Champions Tour': 'Champions Tour',
    'DP World Tour': 'DP World Tour', 'Korn Ferry Tour': 'Korn Ferry',
    'LIV Golf': 'LIV Golf', 'LIV Golf League': 'LIV Golf',
  };
  const prefix = (tourName && prefixMap[tourName]) || tourName || '';
  return prefix ? `${prefix} · ${contextLabel}` : contextLabel;
}

function EventRow({ tournament, index, isLast }: { tournament: SeasonTournament; index: number; isLast: boolean }) {
  const navigate = useNavigate();
  const contextLabel = getContextLabel(tournament);
  const isMajor = contextLabel === 'MAJOR CHAMPIONSHIP';
  const isSignature = contextLabel === 'SIGNATURE EVENT' || contextLabel === 'ROLEX SERIES';
  const venue = getVenueString(tournament);

  const leftBorderColor = isMajor
    ? '#F7931E'
    : isSignature
    ? 'rgba(16,185,129,0.8)'
    : 'transparent';

  const contextColor = isMajor
    ? '#F7931E'
    : isSignature
    ? 'rgba(16,185,129,0.9)'
    : '#94A3B8';

  return (
    <motion.div
      onClick={() => navigate(`/tourhub/tournament/${tournament.id}`)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        borderBottom: !isLast ? '0.5px solid rgba(15,23,42,0.07)' : 'none',
        borderLeft: `3px solid ${leftBorderColor}`,
        background: isMajor ? 'rgba(247,147,30,0.03)' : 'transparent',
        cursor: 'pointer',
      }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.04 * index, ease: [0.16, 1, 0.3, 1] }}
      whileTap={{ scale: 0.99 }}
      className="active:bg-black/[0.02] transition-colors"
      aria-label={tournament.name}
    >
      {/* Date block */}
      <div style={{ flexShrink: 0, width: '52px', padding: '13px 0 13px 14px' }}>
        <p style={{
          fontSize: '8.5px', fontWeight: 700, color: '#CBD5E1',
          letterSpacing: '0.08em', textTransform: 'uppercase' as const, lineHeight: 1, margin: 0,
        }}>
          {getMonthAbbr(tournament.startDate)}
        </p>
        <p style={{
          fontSize: '20px', fontWeight: 900, color: '#0F172A',
          lineHeight: 1, marginTop: '2px', letterSpacing: '-0.03em', margin: '2px 0 0',
        }}>
          {getDayNum(tournament.startDate)}
        </p>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, padding: '12px 16px 12px 10px' }}>
        {/* Context label */}
        <p style={{
          fontSize: '8.5px', fontWeight: 800, color: contextColor,
          letterSpacing: '0.1em', textTransform: 'uppercase' as const,
          lineHeight: 1, margin: '0 0 4px',
        }}>
          {isMajor ? '★ ' : ''}{getPrefixedContextLabel(contextLabel, tournament.tourName)}
        </p>

        {/* Tournament name */}
        <p style={{
          fontSize: '15px', fontWeight: 800, color: '#0F172A',
          letterSpacing: '-0.02em', lineHeight: 1.25, margin: '0 0 4px',
        }}>
          {tournament.name}
        </p>

        {/* Venue */}
        {venue && (
          <p style={{
            fontSize: '11px', color: '#94A3B8', margin: '0 0 4px',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
          }}>
            {venue}
          </p>
        )}

        {/* Defending + purse */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          {tournament.defendingChampion && (
            <p style={{
              fontSize: '11px', color: '#94A3B8', margin: 0,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
              minWidth: 0, flex: 1,
            }}>
              Defending: {tournament.defendingChampion}
            </p>
          )}
          {tournament.purse && (
            <p style={{
              fontSize: '11px', fontWeight: 700, color: '#64748B',
              margin: 0, flexShrink: 0,
            }}>
              {formatPurse(tournament.purse)}
            </p>
          )}
        </div>
      </div>
    </motion.div>
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

  return (
    <div>
      {/* Section header */}
      <div style={{ padding: '0 16px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
              <div style={{ width: 3, height: 14, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
              <span style={{
                fontSize: '9px', fontWeight: 900, color: '#F7931E',
                letterSpacing: '0.16em', textTransform: 'uppercase' as const,
              }}>
                What's Coming Up
              </span>
            </div>
            <h2 style={{
              fontSize: '20px', fontWeight: 900, color: '#0F172A',
              letterSpacing: '-0.03em', margin: 0, lineHeight: 1.05,
            }}>
              Upcoming Tournaments
            </h2>
          </div>
          <button
            onClick={() => navigate('/tourhub?tab=schedule')}
            className="flex items-center gap-0.5 transition-all active:scale-95 text-muted-foreground"
            style={{ fontSize: '12px', fontWeight: 600, minHeight: '44px', marginTop: '2px' }}
            aria-label="View full tournament schedule"
          >
            View All
            <ChevronRight style={{ width: 13, height: 13 }} />
          </button>
        </div>
      </div>

      {/* White ruled table surface */}
      <div style={{
        background: '#ffffff',
        borderTop: '1px solid rgba(15,23,42,0.07)',
        borderBottom: '1px solid rgba(15,23,42,0.07)',
      }}>
        {groups.map((group, gi) => {
          let totalEventsBefore = 0;
          for (let j = 0; j < gi; j++) totalEventsBefore += groups[j].events.length;

          return (
            <div key={group.key}>
              <DateGroupHeader label={group.key} count={group.events.length} />
              {group.events.map((tournament, i) => {
                const globalIndex = totalEventsBefore + i;
                const isLastInTable =
                  gi === groups.length - 1 && i === group.events.length - 1;

                return (
                  <EventRow
                    key={tournament.id}
                    tournament={tournament}
                    index={globalIndex}
                    isLast={isLastInTable}
                  />
                );
              })}
              {/* Heavier rule between date groups */}
              {gi < groups.length - 1 && (
                <div style={{ height: '1px', background: 'rgba(15,23,42,0.1)' }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <div style={{ padding: '14px 16px', textAlign: 'center' }}>
        <button
          onClick={() => navigate('/tourhub?tab=schedule')}
          className="transition-all active:scale-95 text-foreground"
          style={{ fontSize: '13px', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          View Full Schedule ›
        </button>
      </div>
    </div>
  );
}
