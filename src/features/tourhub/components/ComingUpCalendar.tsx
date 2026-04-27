/**
 * ComingUpCalendar — Bare-background scannable list of upcoming tournaments.
 *
 * Lives directly on the page background (no card wrapper). Events grouped by
 * week-of-Monday (THIS WEEK badge on the current period). Tier accents on the
 * left edge: amber for Majors, green-deep for Signature Events, transparent
 * for regulars. Date column repeats on every row for fast scan.
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Star } from 'lucide-react';
import { useUpcomingTournaments } from '../hooks/useUpcomingTournaments';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionErrorState } from './SectionErrorState';
import { formatPurse } from './shared/TourHeroHelpers';
import { getContextLabel } from '../utils/tournamentClassification';
import type { SeasonTournament } from '../hooks/useSeasonTournaments';

// ── Tokens ──────────────────────────────────────────────────────────────────
const INK = '#0F172A';
const SLATE_500 = '#64748B';
const SLATE_400 = '#94A3B8';
const SLATE_300 = '#CBD5E1';
const SLATE_200 = '#E2E8F0';
const SLATE_150 = '#EDF1F5';
const AMBER = '#F7931E';
const GREEN_DEEP = '#0A5A3C';
const MAJOR_TINT = 'rgba(247,147,30,0.08)';

// Compact tour labels — strip trailing " TOUR" suffix.
// "PGA TOUR" → "PGA", "CHAMPIONS TOUR" → "CHAMPIONS",
// "DP WORLD TOUR" → "DP WORLD", "LPGA TOUR" → "LPGA",
// "KORN FERRY TOUR" → "KORN FERRY", "LIV GOLF" → "LIV GOLF" (unchanged).
function compactTourLabel(tourName: string): string {
  return tourName.toUpperCase().replace(/ TOUR$/, '');
}

// ── Date helpers ────────────────────────────────────────────────────────────
function parseUTC(dateStr: string): Date {
  return new Date(dateStr + 'T12:00:00Z');
}

function getMonthAbbr(d: Date): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' })
    .format(d).toUpperCase();
}

function getDayNum(d: Date): string {
  return new Intl.DateTimeFormat('en-US', { day: 'numeric', timeZone: 'UTC' }).format(d);
}

/** Returns the Monday of the ISO week containing `date` (UTC-based). */
function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0 = Sun … 6 = Sat
  const diff = day === 0 ? -6 : 1 - day; // shift back to Monday
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function weekKey(monday: Date): string {
  return monday.toISOString().slice(0, 10);
}

function formatWeekLabel(monday: Date): string {
  return `WEEK OF ${getMonthAbbr(monday)} ${getDayNum(monday)}`;
}

function formatWeekRange(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setUTCDate(sunday.getUTCDate() + 6);
  const startMonth = getMonthAbbr(monday);
  const endMonth = getMonthAbbr(sunday);
  const startDay = getDayNum(monday);
  const endDay = getDayNum(sunday);
  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} – ${endDay}`;
  }
  return `${startMonth} ${startDay} – ${endMonth} ${endDay}`;
}

// ── Tier classification ─────────────────────────────────────────────────────
type Tier = 'major' | 'signature' | 'regular';

function classifyTier(t: SeasonTournament): Tier {
  const ctx = getContextLabel(t);
  if (ctx === 'MAJOR CHAMPIONSHIP') return 'major';
  if (ctx === 'SIGNATURE EVENT' || ctx === 'ROLEX SERIES') return 'signature';
  return 'regular';
}

// Sort within a week: signature first, then majors, then regulars.
// Defer to natural startDate ordering inside each tier bucket.
const TIER_ORDER: Record<Tier, number> = { signature: 0, major: 1, regular: 2 };

// ── Row ─────────────────────────────────────────────────────────────────────
interface RowProps {
  tournament: SeasonTournament;
  tier: Tier;
}

function ComingUpEventRow({ tournament, tier }: RowProps) {
  const navigate = useNavigate();
  const startDate = parseUTC(tournament.startDate);
  const tourLabel = compactTourLabel(tournament.tourName);
  const purseStr = tournament.purse ? formatPurse(tournament.purse) : null;
  const venue = [tournament.venueName, tournament.venueCity].filter(Boolean).join(' · ');

  const isMajor = tier === 'major';
  const isSignature = tier === 'signature';

  const leftBorderColor =
    isMajor ? AMBER : isSignature ? GREEN_DEEP : 'transparent';

  // Major tier prefix uses amber; signature uses green-deep; regular = slate-500.
  const metaColor = isMajor ? AMBER : isSignature ? GREEN_DEEP : SLATE_500;
  // Purse is always slate-500 regardless of tier.
  const purseColor = SLATE_500;

  return (
    <div
      onClick={() => navigate(`/tourhub/tournament/${tournament.id}`)}
      role="button"
      tabIndex={0}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: isMajor ? '13px 12px 13px 0' : '13px 12px 13px 11px',
        background: isMajor ? MAJOR_TINT : 'transparent',
        borderLeft: `3px solid ${leftBorderColor}`,
        borderRadius: isMajor ? '0 6px 6px 0' : 0,
        borderBottom: `1px solid ${SLATE_150}`,
        cursor: 'pointer',
      }}
      className="active:bg-black/[0.02] transition-colors"
    >
      {/* Date column (36px) */}
      <div style={{ width: 36, flexShrink: 0, paddingLeft: isMajor ? 11 : 0 }}>
        <p style={{
          fontSize: 10, fontWeight: 800, color: SLATE_500,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          lineHeight: 1, margin: 0,
        }}>
          {getMonthAbbr(startDate)}
        </p>
        <p style={{
          fontSize: 22, fontWeight: 900, color: INK,
          letterSpacing: '-0.03em', lineHeight: 1.05,
          margin: '2px 0 0',
        }}>
          {getDayNum(startDate)}
        </p>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Meta line — tier · tour · purse */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          margin: '0 0 3px',
          fontSize: 10, fontWeight: 900,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          lineHeight: 1,
        }}>
          {isMajor && (
            <Star
              size={10}
              fill={AMBER}
              stroke={AMBER}
              strokeWidth={1.5}
              style={{ marginRight: 2, flexShrink: 0 }}
            />
          )}
          {isMajor && <span style={{ color: metaColor }}>MAJOR</span>}
          {isSignature && <span style={{ color: metaColor }}>SIGNATURE</span>}
          {(isMajor || isSignature) && <span style={{ color: SLATE_300 }}>·</span>}
          <span style={{ color: metaColor }}>{tourLabel}</span>
          {purseStr && (
            <>
              <span style={{ color: SLATE_300 }}>·</span>
              <span style={{ color: purseColor, fontVariantNumeric: 'tabular-nums' }}>
                {purseStr}
              </span>
            </>
          )}
        </div>

        {/* Tournament name */}
        <p style={{
          fontSize: 15, fontWeight: 800, color: INK,
          letterSpacing: '-0.25px', lineHeight: 1.2,
          margin: '0 0 2px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {tournament.name}
        </p>

        {/* Venue */}
        {venue && (
          <p style={{
            fontSize: 12, fontWeight: 500, color: SLATE_500,
            margin: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {venue}
          </p>
        )}
      </div>

      {/* Chevron */}
      <ChevronRight
        style={{
          width: 16, height: 16, color: SLATE_400, strokeWidth: 2.4,
          marginTop: 4, flexShrink: 0,
        }}
      />
    </div>
  );
}

// ── Component ───────────────────────────────────────────────────────────────
export function ComingUpCalendar() {
  const navigate = useNavigate();
  const { data: tournaments, isLoading, error, refetch } = useUpcomingTournaments(8);

  const weekGroups = useMemo(() => {
    if (!tournaments?.length) return [];
    const todayMonday = getMondayOfWeek(new Date());
    const todayMondayKey = weekKey(todayMonday);

    const buckets = new Map<string, { monday: Date; events: SeasonTournament[] }>();
    for (const t of tournaments) {
      const monday = getMondayOfWeek(parseUTC(t.startDate));
      const key = weekKey(monday);
      if (!buckets.has(key)) buckets.set(key, { monday, events: [] });
      buckets.get(key)!.events.push(t);
    }

    // Convert to ordered array, sort events within each week by tier then date.
    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, bucket]) => {
        const sorted = [...bucket.events].sort((a, b) => {
          const ta = TIER_ORDER[classifyTier(a)];
          const tb = TIER_ORDER[classifyTier(b)];
          if (ta !== tb) return ta - tb;
          return a.startDate.localeCompare(b.startDate);
        });
        return {
          key,
          monday: bucket.monday,
          events: sorted,
          isThisWeek: key === todayMondayKey,
        };
      });
  }, [tournaments]);

  if (isLoading) {
    return (
      <div style={{ padding: '0 16px' }}>
        <Skeleton className="h-5 w-40 mb-3" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <Skeleton className="h-4 w-3/4 mb-1" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
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
      {/* Section header — shared SectionHeader component */}
      <SectionHeader
        eyebrow="Coming Up"
        title="Tournament Calendar"
        action={
          <button
            onClick={() => navigate('/tourhub?tab=schedule')}
            className="flex items-center gap-0.5 transition-all active:scale-95 text-muted-foreground"
            style={{ fontSize: 12, fontWeight: 600, minHeight: 44 }}
            aria-label="View full tournament schedule"
          >
            View All
            <ChevronRight style={{ width: 13, height: 13 }} />
          </button>
        }
      />

      {/* Week groups — directly on page background (no card wrapper) */}
      {weekGroups.map((group) => (
        <div key={group.key}>
          {/* Week-of header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 0 12px',
          }}>
            {group.isThisWeek && (
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '3px 6px',
                background: AMBER,
                borderRadius: 3,
                fontSize: 9, fontWeight: 900, color: '#FFFFFF',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                flexShrink: 0,
              }}>
                This Week
              </span>
            )}
            <span style={{
              fontSize: 12, fontWeight: 900, color: INK,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              flexShrink: 0,
            }}>
              {formatWeekLabel(group.monday)}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 600, color: SLATE_500,
              flexShrink: 0,
            }}>
              · {formatWeekRange(group.monday)}
            </span>
            <div style={{
              flex: 1,
              height: 1,
              background: `linear-gradient(90deg, ${SLATE_200}, transparent)`,
              marginLeft: 4,
            }} />
          </div>

          {/* Event rows */}
          {group.events.map((t) => (
            <ComingUpEventRow
              key={t.id}
              tournament={t}
              tier={classifyTier(t)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
