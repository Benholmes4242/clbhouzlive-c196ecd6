/**
 * BLOCK 3 — COMING UP (BRIEF_TOUR_REBUILD).
 *
 * FIVE DATED ROWS AND A SEE-ALL. What is on next, in date order, across every
 * tour — this block has NO tour dimension, so the picker does not govern it. A
 * member reading the PGA Tour still wants to know the Solheim Cup starts
 * Thursday.
 *
 * THE DATE IS THE SUBJECT, so it leads the row and it is real: start and end
 * come from the tournaments cache, never from a formatted string in the copy.
 * The tour is stated on every row, because without it a bare name does not say
 * whose week it is.
 *
 * EMPTY RENDERS NOTHING. No heading over no schedule. The count is real.
 *
 * COLOUR LAW: nothing here is a score, so nothing is coloured. No amber — no
 * viewing member appears in a schedule.
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { DiscoverSectionHeading } from '@/components/ui/DiscoverSectionHeading';
import { DISCOVER_FACT, DISCOVER_QUIET, FIGS, SANS } from '@/components/explore-tab-new/courseled/tokens';
import { HAIRLINE_INK_7, INK, INK_MUTE } from '@/features/tourhub/_shared/tokens';
import { useTournamentsCache, type CachedTournament } from '@/hooks/useTournamentsCache';
import { TOUR_CONFIG, type TourId } from '@/features/tourhub/hooks/useOverviewData';
import { analyticsEvents } from '@/utils/analyticsEvents';

/** Five on the page; the rest live on the pushed schedule. */
const VISIBLE_EVENTS = 5;

const KICKER: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.13em',
  textTransform: 'uppercase',
};

/** "11–14 SEP", and "28 SEP – 1 OCT" when the week crosses a month. */
export function dateSpan(start: string, end: string | null): string {
  const fmt = (iso: string, withMonth: boolean) => {
    const d = new Date(`${iso}T00:00:00Z`);
    const day = d.getUTCDate();
    const month = d.toLocaleString('en-GB', { month: 'short', timeZone: 'UTC' }).toUpperCase();
    return withMonth ? `${day} ${month}` : `${day}`;
  };
  if (!end || end === start) return fmt(start, true);
  const sameMonth = start.slice(0, 7) === end.slice(0, 7);
  return sameMonth ? `${fmt(start, false)}\u2013${fmt(end, true)}` : `${fmt(start, true)} \u2013 ${fmt(end, true)}`;
}

function venueLine(t: CachedTournament): string | null {
  const parts = [t.venue_name ?? t.venue_course_name, t.venue_city, t.venue_country].filter(Boolean);
  return parts.length ? (parts as string[]).join(' \u00b7 ') : null;
}

function tourName(t: CachedTournament): string | null {
  const name = t.season?.tour_name as TourId | undefined;
  return name && TOUR_CONFIG[name] ? TOUR_CONFIG[name].name : null;
}

export function ComingUpRow({ t, onPress }: { t: CachedTournament; onPress: () => void }) {
  const venue = venueLine(t);
  const tour = tourName(t);
  return (
    <button
      type="button"
      onClick={onPress}
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 12,
        width: '100%',
        padding: '13px 0',
        background: 'transparent',
        border: 'none',
        borderBottom: `0.5px solid ${HAIRLINE_INK_7}`,
        textAlign: 'left',
        fontFamily: SANS,
        cursor: 'pointer',
        ...FIGS,
      }}
    >
      <span style={{ ...KICKER, flex: '0 0 76px', color: DISCOVER_QUIET }}>
        {dateSpan(t.start_date, t.end_date)}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: 'block',
            fontSize: 14,
            fontWeight: 700,
            color: INK,
            letterSpacing: '-0.01em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {t.name}
        </span>
        {venue && (
          <span
            style={{
              display: 'block',
              marginTop: 3,
              fontSize: 12.5,
              fontWeight: 400,
              color: DISCOVER_FACT,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {venue}
          </span>
        )}
      </span>
      {tour && <span style={{ ...KICKER, flexShrink: 0, color: INK_MUTE }}>{tour}</span>}
    </button>
  );
}

/** Date order, and only events that have not started. */
export function useComingUp(): CachedTournament[] {
  const { data: cache } = useTournamentsCache();
  return useMemo(
    () => (cache?.upcoming ?? []).slice().sort((a, b) => a.start_date.localeCompare(b.start_date)),
    [cache],
  );
}

export function TourComingUpBlock() {
  const navigate = useNavigate();
  const events = useComingUp();
  const shown = events.slice(0, VISIBLE_EVENTS);

  /* AN EMPTY SECTION RENDERS NOTHING. */
  if (shown.length === 0) return null;

  return (
    <section style={{ paddingTop: 32, fontFamily: SANS, ...FIGS }}>
      <DiscoverSectionHeading title="Coming up" right={`${events.length} events`} />

      {shown.map((t) => (
        <ComingUpRow
          key={t.id}
          t={t}
          onPress={() => {
            analyticsEvents.track('tour_coming_up_row_pressed', { tournamentId: t.id });
            navigate(`/tourhub/tournament/${t.id}`);
          }}
        />
      ))}

      {events.length > VISIBLE_EVENTS && (
        <button
          type="button"
          onClick={() => {
            analyticsEvents.track('tour_coming_up_see_all', { total: events.length });
            navigate('/tour/schedule');
          }}
          style={{
            ...KICKER,
            display: 'block',
            width: '100%',
            marginTop: 12,
            padding: 0,
            border: 'none',
            background: 'transparent',
            color: INK,
            fontFamily: SANS,
            textAlign: 'left',
            cursor: 'pointer',
          }}
        >
          See all {events.length}
        </button>
      )}
    </section>
  );
}

export default TourComingUpBlock;
