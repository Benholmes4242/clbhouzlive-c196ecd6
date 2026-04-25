/**
 * ComingUpCalendar — Vertical rail timeline of upcoming tournaments.
 * Replaces the legacy WhatsComing flat-table on the Tour Hub Overview.
 *
 * Layout:
 * - White card, rail line at left:60px running top→bottom
 * - Date column repeats only on first event of each new date group
 * - Major championships: amber-haloed filled dot + ⭐ tour eyebrow
 * - Regular events: hollow dot + slate tour eyebrow
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useUpcomingTournaments } from '../hooks/useUpcomingTournaments';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionErrorState } from './SectionErrorState';
import { formatPurse } from './shared/TourHeroHelpers';
import { getContextLabel } from '../utils/tournamentClassification';
import type { SeasonTournament } from '../hooks/useSeasonTournaments';

function getMonthAbbr(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  return new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(d).toUpperCase();
}

function getDayNum(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  return new Intl.DateTimeFormat('en-US', { day: 'numeric', timeZone: 'UTC' }).format(d);
}

function getWeekday(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' }).format(d).toUpperCase();
}

function getDateKey(dateStr: string): string {
  return `${getMonthAbbr(dateStr)} ${getDayNum(dateStr)}`;
}

function tourEyebrow(tournament: SeasonTournament): { label: string; isMajor: boolean; isSignature: boolean } {
  const ctx = getContextLabel(tournament);
  const isMajor = ctx === 'MAJOR CHAMPIONSHIP';
  const isSignature = ctx === 'SIGNATURE EVENT' || ctx === 'ROLEX SERIES';
  if (isMajor) return { label: `${tournament.tourName.toUpperCase()} · MAJOR`, isMajor, isSignature };
  if (isSignature) return { label: `${tournament.tourName.toUpperCase()} · ${ctx}`, isMajor, isSignature };
  return { label: tournament.tourName.toUpperCase(), isMajor, isSignature };
}

interface RowProps {
  tournament: SeasonTournament;
  showDate: boolean;
  isLast: boolean;
}

function ComingUpEventRow({ tournament, showDate, isLast }: RowProps) {
  const navigate = useNavigate();
  const { label, isMajor } = tourEyebrow(tournament);
  const venue = [tournament.venueName, tournament.venueCity].filter(Boolean).join(' · ');

  return (
    <div
      onClick={() => navigate(`/tourhub/tournament/${tournament.id}`)}
      role="button"
      tabIndex={0}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        padding: '12px 14px 12px 12px',
        borderBottom: !isLast ? '0.5px solid rgba(15,23,42,0.05)' : 'none',
        cursor: 'pointer',
      }}
      className="active:bg-black/[0.02] transition-colors"
    >
      {/* Date column (48px) */}
      <div style={{ width: 48, flexShrink: 0, paddingTop: 2 }}>
        {showDate && (
          <>
            <p style={{
              fontSize: 9, fontWeight: 900, color: '#94A3B8',
              letterSpacing: '0.08em', textTransform: 'uppercase',
              lineHeight: 1, margin: 0,
            }}>
              {getMonthAbbr(tournament.startDate)}
            </p>
            <p style={{
              fontSize: 22, fontWeight: 900, color: '#0F172A',
              letterSpacing: '-0.05em', lineHeight: 1.1,
              margin: '2px 0 1px',
            }}>
              {getDayNum(tournament.startDate)}
            </p>
            <p style={{
              fontSize: 9, fontWeight: 700, color: '#CBD5E1',
              letterSpacing: '0.06em', textTransform: 'uppercase',
              lineHeight: 1, margin: 0,
            }}>
              {getWeekday(tournament.startDate)}
            </p>
          </>
        )}
      </div>

      {/* Rail dot column (12px wide, dot centered over the line at left:60px) */}
      <div style={{
        width: 12, flexShrink: 0, paddingTop: 6,
        display: 'flex', justifyContent: 'center',
        position: 'relative', zIndex: 1,
      }}>
        {isMajor ? (
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#F7931E',
            border: '2px solid #F7931E',
            boxShadow: '0 0 0 3px rgba(247,147,30,0.25)',
          }} />
        ) : (
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#FFFFFF',
            border: '1.5px solid rgba(15,23,42,0.2)',
          }} />
        )}
      </div>

      {/* Event content */}
      <div style={{ flex: 1, minWidth: 0, paddingLeft: 8 }}>
        <p style={{
          fontSize: 9, fontWeight: 900,
          color: isMajor ? '#F7931E' : '#94A3B8',
          letterSpacing: '0.1em', textTransform: 'uppercase',
          margin: '0 0 3px', lineHeight: 1,
        }}>
          {isMajor ? '⭐ ' : ''}{label}
        </p>
        <p style={{
          fontSize: 13, fontWeight: 800, color: '#0F172A',
          letterSpacing: '-0.01em', lineHeight: 1.25,
          margin: '0 0 3px',
        }}>
          {tournament.name}
        </p>
        {venue && (
          <p style={{
            fontSize: 10, color: '#94A3B8', margin: '0 0 5px',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {venue}
          </p>
        )}
        {tournament.purse && (
          <span style={{
            display: 'inline-block',
            fontSize: 10, fontWeight: 800, color: '#0F172A',
            background: 'rgba(15,23,42,0.06)',
            padding: '2px 6px', borderRadius: 4,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {formatPurse(tournament.purse)}
          </span>
        )}
      </div>

      {/* Right chevron */}
      <ChevronRight style={{
        width: 14, height: 14, color: '#CBD5E1', marginTop: 4, flexShrink: 0,
      }} />
    </div>
  );
}

export function ComingUpCalendar() {
  const navigate = useNavigate();
  const { data: tournaments, isLoading, error, refetch } = useUpcomingTournaments(8);

  const groups = useMemo(() => {
    if (!tournaments?.length) return [];
    const out: { key: string; events: SeasonTournament[] }[] = [];
    const seen = new Map<string, number>();
    for (const t of tournaments) {
      const key = getDateKey(t.startDate);
      if (seen.has(key)) {
        out[seen.get(key)!].events.push(t);
      } else {
        seen.set(key, out.length);
        out.push({ key, events: [t] });
      }
    }
    return out;
  }, [tournaments]);

  if (isLoading) {
    return (
      <div style={{ padding: '0 16px' }}>
        <Skeleton className="h-5 w-40 mb-3" />
        <div style={{ background: '#fff', borderRadius: 14, padding: 12 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <Skeleton className="h-4 w-3/4 mb-1" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '0 16px' }}>
        <SectionErrorState sectionName="Coming Up" onRetry={() => refetch()} />
      </div>
    );
  }

  if (!tournaments?.length) return null;

  return (
    <div style={{ padding: '0 16px' }}>
      {/* Section header */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <div style={{ width: 3, height: 14, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
              <span style={{
                fontSize: 9, fontWeight: 900, color: '#F7931E',
                letterSpacing: '0.16em', textTransform: 'uppercase',
              }}>
                Coming Up
              </span>
            </div>
            <h2 style={{
              fontSize: 20, fontWeight: 900, color: '#0F172A',
              letterSpacing: '-0.03em', margin: 0, lineHeight: 1.05,
            }}>
              Tournament Calendar
            </h2>
          </div>
          <button
            onClick={() => navigate('/tourhub?tab=schedule')}
            className="flex items-center gap-0.5 transition-all active:scale-95 text-muted-foreground"
            style={{ fontSize: 12, fontWeight: 600, minHeight: 44, marginTop: 2 }}
            aria-label="View full tournament schedule"
          >
            View All
            <ChevronRight style={{ width: 13, height: 13 }} />
          </button>
        </div>
      </div>

      {/* Card with vertical rail */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 14,
        border: '1px solid rgba(15,23,42,0.07)',
        position: 'relative',
        overflow: 'hidden',
        padding: '8px 0',
      }}>
        {/* Vertical rail line — left:60px (12 padding + 48 date col) */}
        <div style={{
          position: 'absolute',
          left: 60 + 12, // padding-left of row (12px) + date col (48px) + dot col offset → centered
          top: 16, bottom: 16,
          width: 1,
          background: 'rgba(15,23,42,0.08)',
          pointerEvents: 'none',
        }} />

        {groups.map((group, gi) => {
          const isLastGroup = gi === groups.length - 1;
          return (
            <div key={group.key}>
              {/* Group header strip */}
              <div style={{
                padding: '8px 14px',
                background: 'rgba(15,23,42,0.025)',
                borderTop: gi === 0 ? 'none' : '0.5px solid rgba(15,23,42,0.06)',
                borderBottom: '0.5px solid rgba(15,23,42,0.05)',
              }}>
                <span style={{
                  fontSize: 10, fontWeight: 800, color: '#64748B',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                }}>
                  {group.key} · {group.events.length} {group.events.length === 1 ? 'event' : 'events'}
                </span>
              </div>

              {group.events.map((t, i) => (
                <ComingUpEventRow
                  key={t.id}
                  tournament={t}
                  showDate={i === 0}
                  isLast={isLastGroup && i === group.events.length - 1}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
