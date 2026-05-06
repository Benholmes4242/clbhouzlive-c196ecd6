/**
 * ComingUpCalendar — Editorial "this week" calendar.
 *
 * Single headline event card + compact rows for the remaining events of the
 * current week (Mon–Sun UTC). Events outside this week route to ScheduleTab
 * via the "Full Schedule" CTA.
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Star, MapPin, Calendar, Clock } from 'lucide-react';
import { useUpcomingTournaments } from '../hooks/useUpcomingTournaments';
import { useVenueImage } from '../hooks/useVenueImage';
import { SectionErrorState } from './SectionErrorState';
import { ScheduleTournamentCard } from './schedule/ScheduleTournamentCard';
import { Shimmer } from './shared/Shimmer';
import { getContextLabel, TOUR_NAME_TO_SLUG } from '../utils/tournamentClassification';
import { TOUR_MAP, type TourCode } from '../constants/tourMap';
import type { SeasonTournament } from '../hooks/useSeasonTournaments';

// ── Tokens ──────────────────────────────────────────────────────────────────
const INK = '#0F172A';
const SLATE_500 = '#64748B';
const SLATE_400 = '#94A3B8';
const SLATE_200 = '#E2E8F0';
const SLATE_150 = '#EDF1F5';
const AMBER = '#F7931E';
const GOLD = '#FFB800';
const NAVY_HIGH = '#15203A';

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

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function formatWeekRange(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setUTCDate(sunday.getUTCDate() + 6);
  const startMonth = getMonthAbbr(monday);
  const endMonth = getMonthAbbr(sunday);
  const startDay = getDayNum(monday);
  const endDay = getDayNum(sunday);
  if (startMonth === endMonth) return `${startMonth} ${startDay} – ${endDay}`;
  return `${startMonth} ${startDay} – ${endMonth} ${endDay}`;
}

function formatDateRange(startStr: string, endStr: string): string {
  const start = parseUTC(startStr);
  const end = parseUTC(endStr);
  const sm = getMonthAbbr(start);
  const em = getMonthAbbr(end);
  const sd = getDayNum(start);
  const ed = getDayNum(end);
  if (sm === em) return `${sm} ${sd}–${ed}`;
  return `${sm} ${sd} – ${em} ${ed}`;
}

// ── Tier ────────────────────────────────────────────────────────────────────
type Tier = 'major' | 'signature' | 'regular';

function classifyTier(t: SeasonTournament): Tier {
  const ctx = getContextLabel(t);
  if (ctx === 'MAJOR CHAMPIONSHIP') return 'major';
  if (ctx === 'SIGNATURE EVENT' || ctx === 'ROLEX SERIES') return 'signature';
  return 'regular';
}

// ── Tour brand resolver ─────────────────────────────────────────────────────
function getTourBrand(tourName: string | null | undefined): {
  bg: string; fg: string; label: string; stripe: string;
} {
  const fallback = { bg: '#475569', fg: '#FFFFFF', label: 'TOUR', stripe: '#475569' };
  if (!tourName) return fallback;

  const slug = TOUR_NAME_TO_SLUG[tourName];
  if (!slug) return fallback;

  const key = (slug === 'pga' ? 'pga' : slug.toUpperCase()) as TourCode;
  const meta = TOUR_MAP[key];
  if (!meta) return fallback;

  const compact: Record<string, string> = {
    pga: 'PGA',
    LPGA: 'LPGA',
    EURO: 'DPWT',
    LIV: 'LIV',
    CHAMP: 'CHAMP',
    PGAD: 'KFT',
  };
  return {
    bg: meta.bg,
    fg: meta.fg,
    label: compact[key] ?? meta.short.toUpperCase(),
    stripe: meta.bg,
  };
}

// ── Headline selection ──────────────────────────────────────────────────────
function pickHeadlineEvent(events: SeasonTournament[]): SeasonTournament | null {
  if (events.length === 0) return null;

  const byPurseDescThenDate = (a: SeasonTournament, b: SeasonTournament) => {
    const purseDiff = (b.purse ?? 0) - (a.purse ?? 0);
    if (purseDiff !== 0) return purseDiff;
    return a.startDate.localeCompare(b.startDate);
  };

  const majors = events.filter(e => classifyTier(e) === 'major');
  if (majors.length > 0) return [...majors].sort(byPurseDescThenDate)[0];

  const sigs = events.filter(e => classifyTier(e) === 'signature');
  if (sigs.length > 0) return [...sigs].sort(byPurseDescThenDate)[0];

  return [...events].sort(byPurseDescThenDate)[0];
}

// ── Headline card ───────────────────────────────────────────────────────────
function HeadlineCard({ tournament }: { tournament: SeasonTournament }) {
  const navigate = useNavigate();
  const { data: venueImage } = useVenueImage(tournament.venueName, tournament.venueCity);

  const tier = classifyTier(tournament);
  const isMajor = tier === 'major';
  const isSig = tier === 'signature';
  const accent = isMajor ? GOLD : isSig ? AMBER : SLATE_500;
  const tour = getTourBrand(tournament.tourName);

  return (
    <button
      onClick={() => navigate(`/tourhub/tournament/${tournament.id}`)}
      style={{
        display: 'block', width: 'calc(100% - 32px)', margin: '0 16px 12px',
        padding: 0, background: INK, borderRadius: 16, overflow: 'hidden',
        border: 'none',
        boxShadow: isMajor
          ? '0 0 28px rgba(255,184,0,0.15)'
          : '0 1px 0 rgba(0,0,0,0.02)',
        textAlign: 'left', cursor: 'pointer',
      }}
    >
      <div style={{
        position: 'relative', width: '100%', height: 220,
        background: venueImage?.imageUrl
          ? `url(${venueImage.imageUrl}) center/cover`
          : `linear-gradient(135deg, ${tour.stripe}, ${NAVY_HIGH})`,
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.85) 100%)',
        }} />

        <div style={{
          position: 'absolute', top: 12, left: 12, right: 12,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          {isMajor && (
            <span style={{
              padding: '3px 7px', borderRadius: 4,
              background: 'rgba(255,184,0,0.22)', color: GOLD,
              fontSize: 9, fontWeight: 800, letterSpacing: '0.14em',
              border: `1px solid rgba(255,184,0,0.45)`,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <Star size={9} fill={GOLD} stroke={GOLD} />MAJOR
            </span>
          )}
          {isSig && (
            <span style={{
              padding: '3px 7px', borderRadius: 4,
              background: 'rgba(247,147,30,0.20)', color: AMBER,
              fontSize: 9, fontWeight: 800, letterSpacing: '0.14em',
              border: `1px solid rgba(247,147,30,0.40)`,
            }}>SIGNATURE</span>
          )}
          <span style={{
            padding: '3px 7px', borderRadius: 4,
            background: tour.bg, color: tour.fg,
            fontSize: 9, fontWeight: 900, letterSpacing: '0.10em',
          }}>{tour.label}</span>
        </div>

        <div style={{
          position: 'absolute', top: 12, right: 12,
          background: 'rgba(0, 0, 0, 0.28)',
          backdropFilter: 'blur(22px) saturate(180%)',
          WebkitBackdropFilter: 'blur(22px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
          borderRadius: 4,
          padding: '3px 8px',
          fontSize: 9,
          fontWeight: 800,
          color: '#FFFFFF',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
        }}>
          <Clock size={9} strokeWidth={3} />
          {formatDateRange(tournament.startDate, tournament.endDate).toUpperCase()}
        </div>
      </div>

      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{
          fontSize: 19, fontWeight: 800, letterSpacing: '-0.025em',
          color: '#fff', lineHeight: 1.15, marginBottom: 5,
        }}>{tournament.name}</div>

        {tournament.venueName && (
          <div style={{
            fontSize: 12, color: 'rgba(255,255,255,0.65)',
            display: 'flex', alignItems: 'center', gap: 4,
            marginBottom: tournament.defendingChampion ? 12 : 0,
            minWidth: 0,
          }}>
            <MapPin size={11} strokeWidth={2.2} style={{ opacity: 0.85, flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {tournament.venueName}{tournament.venueCity ? `, ${tournament.venueCity}` : ''}
            </span>
          </div>
        )}

        {tournament.defendingChampion && (
          <div style={{
            fontSize: 11, color: 'rgba(255,255,255,0.55)',
            paddingTop: 11, borderTop: '1px solid rgba(255,255,255,0.10)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{
              color: accent, fontWeight: 800,
              letterSpacing: '0.12em', textTransform: 'uppercase',
            }}>Defending</span>
            <span style={{ color: '#fff', fontWeight: 600 }}>{tournament.defendingChampion}</span>
          </div>
        )}
      </div>
    </button>
  );
}

// ── Compact row ─────────────────────────────────────────────────────────────
function CompactRow({ tournament }: { tournament: SeasonTournament }) {
  const navigate = useNavigate();
  const tier = classifyTier(tournament);
  const isSig = tier === 'signature';
  const tour = getTourBrand(tournament.tourName);

  const startDay = parseUTC(tournament.startDate).getUTCDay();
  const showDate = startDay !== 4;

  return (
    <button
      onClick={() => navigate(`/tourhub/tournament/${tournament.id}`)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        width: 'calc(100% - 32px)', margin: '0 16px',
        padding: '12px 12px 12px 11px',
        background: 'transparent',
        borderLeft: `3px solid ${tour.stripe}`,
        borderBottom: `1px solid ${SLATE_150}`,
        textAlign: 'left', cursor: 'pointer',
      }}
    >
      {showDate && (
        <div style={{ width: 30, flexShrink: 0 }}>
          <div style={{
            fontSize: 9, fontWeight: 800, color: SLATE_500,
            letterSpacing: '0.06em', lineHeight: 1,
          }}>{getMonthAbbr(parseUTC(tournament.startDate))}</div>
          <div style={{
            fontSize: 18, fontWeight: 900, color: INK,
            letterSpacing: '-0.025em', lineHeight: 1.05, marginTop: 2,
          }}>{getDayNum(parseUTC(tournament.startDate))}</div>
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{
            padding: '2px 6px', borderRadius: 3,
            background: tour.bg, color: tour.fg,
            fontSize: 9, fontWeight: 900, letterSpacing: '0.08em', lineHeight: 1.2,
          }}>{tour.label}</span>
          {isSig && (
            <span style={{
              fontSize: 9, fontWeight: 800, color: AMBER,
              letterSpacing: '0.12em', textTransform: 'uppercase',
            }}>Signature</span>
          )}
        </div>
        <div style={{
          fontSize: 14, fontWeight: 700, color: INK,
          letterSpacing: '-0.015em', lineHeight: 1.2, marginBottom: 2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{tournament.name}</div>
        <div style={{
          fontSize: 11, color: SLATE_500, fontWeight: 500,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{tournament.venueName}{tournament.venueCity ? ` · ${tournament.venueCity}` : ''}</div>
      </div>

      <ChevronRight size={14} color={SLATE_400} strokeWidth={2.4} style={{ flexShrink: 0 }} />
    </button>
  );
}

// ── Skeleton ────────────────────────────────────────────────────────────────
function CalendarSkeleton() {
  return (
    <div style={{ padding: '0 16px' }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        marginBottom: 18,
      }}>
        <Shimmer width="55%" height={24} radius={5} />
        <Shimmer width="25%" height={14} radius={3} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Shimmer width={70} height={11} radius={3} />
        <Shimmer width={50} height={11} radius={3} />
      </div>

      <div style={{
        margin: '0 0 12px',
        background: INK,
        borderRadius: 16, overflow: 'hidden',
      }}>
        <div style={{ aspectRatio: '16 / 9', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ padding: '14px 16px 16px' }}>
          <Shimmer width="75%" height={19} radius={4} style={{ marginBottom: 7 }} />
          <Shimmer width="55%" height={12} radius={3} />
        </div>
      </div>

      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 12px 12px 11px',
          borderLeft: `3px solid ${SLATE_200}`,
          borderBottom: `1px solid ${SLATE_150}`,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Shimmer width={48} height={11} radius={3} style={{ marginBottom: 6 }} />
            <Shimmer width="80%" height={14} radius={3} style={{ marginBottom: 4 }} />
            <Shimmer width="60%" height={11} radius={3} />
          </div>
          <Shimmer width={14} height={14} radius={3} />
        </div>
      ))}
    </div>
  );
}

// ── Component ───────────────────────────────────────────────────────────────
export function ComingUpCalendar() {
  const navigate = useNavigate();
  const { data: tournaments, isLoading, error, refetch } = useUpcomingTournaments(20);

  const { monday, sunday } = useMemo(() => {
    const m = getMondayOfWeek(new Date());
    const s = new Date(m);
    s.setUTCDate(s.getUTCDate() + 6);
    s.setUTCHours(23, 59, 59, 999);
    return { monday: m, sunday: s };
  }, []);

  const thisWeekEvents = useMemo(() => {
    if (!tournaments) return [];
    return tournaments.filter(t => {
      const start = parseUTC(t.startDate);
      return start >= monday && start <= sunday;
    });
  }, [tournaments, monday, sunday]);

  const headline = useMemo(() => pickHeadlineEvent(thisWeekEvents), [thisWeekEvents]);
  const remaining = useMemo(() => {
    if (!headline) return [];
    return thisWeekEvents
      .filter(e => e.id !== headline.id)
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [thisWeekEvents, headline]);

  if (isLoading) return <CalendarSkeleton />;

  if (error) {
    return (
      <div style={{ padding: '0 16px' }}>
        <SectionErrorState sectionName="Coming Up" onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div>
      {/* Section header — mirrors Tournament Intelligence eyebrow */}
      <div style={{ padding: '0 16px', marginBottom: 14 }}>
        <button
          onClick={() => navigate('/tourhub?tab=schedule')}
          aria-label="Open full schedule"
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Calendar size={13} color={AMBER} strokeWidth={2.5} />
          <span style={{
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: '0.14em',
            color: AMBER,
          }}>
            UPCOMING EVENTS
          </span>
          <ChevronRight
            size={11}
            color={AMBER}
            strokeWidth={2.5}
            style={{ marginTop: 1 }}
          />
        </button>
      </div>

      {/* Week separator */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '0 16px', marginBottom: 14,
      }}>
        <span style={{
          fontSize: 11, fontWeight: 800, color: AMBER,
          letterSpacing: '0.14em', textTransform: 'uppercase',
        }}>This week</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: SLATE_400 }}>
          · {formatWeekRange(monday)}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 600, color: SLATE_400, marginLeft: 'auto',
        }}>
          {thisWeekEvents.length} {thisWeekEvents.length === 1 ? 'event' : 'events'}
        </span>
      </div>

      {/* Empty state */}
      {thisWeekEvents.length === 0 && (
        <div style={{
          margin: '0 16px', padding: '24px 16px',
          background: '#fff', borderRadius: 14, border: `1px solid ${SLATE_200}`,
          textAlign: 'center',
        }}>
          <Calendar size={20} color={SLATE_400} style={{ marginBottom: 8 }} />
          <div style={{ fontSize: 13, fontWeight: 700, color: INK, marginBottom: 4 }}>
            Off week
          </div>
          <div style={{ fontSize: 12, color: SLATE_500 }}>
            No tournaments scheduled this week.
          </div>
        </div>
      )}

      {/* Headline + compact rows */}
      {headline && <HeadlineCard tournament={headline} />}
      {remaining.map(t => (
        <div key={t.id} style={{ borderBottom: `1px solid ${SLATE_150}` }}>
          <ScheduleTournamentCard tournament={t} />
        </div>
      ))}
    </div>
  );
}
