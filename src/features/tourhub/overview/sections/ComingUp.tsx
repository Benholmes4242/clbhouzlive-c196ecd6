/**
 * ComingUp — ONE HEADER PER DAY, four-line event rows (MICRO_BRIEF_COMING_UP_REBUILD,
 * reference option B).
 *
 * FIVE FAULTS THIS REBUILD RETIRES, AND WHY EACH FIX IS SHAPED THE WAY IT IS:
 *
 *  a. "1 DAYS". The countdown was a raw integer beside a static "DAYS" label, so
 *     a day out read "1 DAYS". It is now a phrase (TODAY / TOMORROW / IN N DAYS)
 *     resolved through locale keys — never an integer glued to a literal.
 *  b. The date repeated per row and took the most prominent column to say the
 *     same thing three times. The date is now a GROUP HEADER and the countdown is
 *     said ONCE PER DAY, not once per event.
 *  c. The venue line wrapped because the defender was appended to it. THE
 *     DEFENDER IS NOT ON THE VENUE LINE — it is a figure in the three-up. Venue
 *     is nowrap + ellipsis so THE VENUE LINE never wraps. ROWS ARE NOT EQUAL
 *     HEIGHT: the three-up and the venue line each collapse independently, and
 *     day-header count varies per page because pages are cut on event count. The
 *     pager therefore MEASURES each page and sizes the track to the swipe rather
 *     than assuming a fixed page height (a flex row otherwise sizes to its
 *     tallest page and leaves dead space under short ones).

 *  d. Event names truncated inside a narrow flex column. The name now owns the
 *     full row width (the date column is gone), so "Husqvarna British Masters
 *     hosted by Sir Nick Faldo" fits at 390.
 *  e. No tour identity. Every row now carries its tour chip UNCONDITIONALLY —
 *     not only in the all-tours lens. Three events on one day from three tours
 *     was the fault that made the section unreadable.
 *
 * A MISSING FIGURE COLLAPSES ITS COLUMN — never a dash, never a zero. FIELD SIZE
 * HAS NO SOURCE in the feed (sr_tournaments carries no field/entry count, and
 * raw_data has no such key for scheduled events), so the FIELD column is wired
 * but collapses on every upcoming event today. It is kept because the collapse
 * path is the whole point of the rule, and because the figure arrives the moment
 * the feed carries it — see useComingUp.field_size.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { SectionShell, V4Card } from './SectionShell';
import { V4 } from '../tokens';
import { useComingUp, type ComingUpRow } from '../data/useComingUp';
import type { TourId } from '../../hooks/useOverviewData';
import { TOUR_LABEL } from '../../_shared/tourOrder';
import { formatPurse } from '../../_shared/formatPurse';
import { formatMonthShort } from '@/i18n/format';
import { Skeleton } from '@/components/ui/skeleton';

const PAGE_SIZE = 5;

/* The PLAYOFFS violet pair lived here for the removed playoffs chip. Both locals
   are gone with it; the SHARED tokens are untouched and SeasonRow on the
   schedule page still pins its own copies. */


const DIM = V4.inkFaint;
const MUTE = V4.inkMute;
const GROUP_BG = 'rgba(255,255,255,0.03)';

/**
 * SURNAME. The DEFENDS column is narrow and the leaderboard convention is the
 * surname alone, so "Tommy Fleetwood" renders "Fleetwood".
 *
 *   single word      -> returned whole ("Rahm" stays "Rahm"); there is nothing
 *                       to strip and a blank column would be worse.
 *   hyphenated       -> the hyphen is inside ONE token, so it survives intact:
 *                       "Eugenio Lopez-Chacarra" -> "Lopez-Chacarra", and
 *                       "Hae-Ran Ryu" -> "Ryu" (the hyphen is in the given name).
 *   generational     -> suffixes are stripped BEFORE the last token is taken,
 *                       so "Harold Varner III" -> "Varner", not "III".
 *   particles        -> a lowercase-particle surname is taken from its earliest
 *                       particle: "Darius Van Driel" -> "Van Driel".
 */
const SUFFIXES = new Set(['jr', 'jr.', 'sr', 'sr.', 'ii', 'iii', 'iv', 'v']);
const PARTICLES = new Set(['van', 'von', 'de', 'del', 'della', 'di', 'da', 'dos', 'la', 'le', 'du', 'den', 'ter']);

export function surnameOf(full: string | null | undefined): string | null {
  if (!full) return null;
  const parts = full.trim().split(/\s+/).filter(Boolean);
  while (parts.length > 1 && SUFFIXES.has(parts[parts.length - 1].toLowerCase())) parts.pop();
  if (parts.length === 0) return null;
  if (parts.length === 1) return parts[0];
  const particleAt = parts.findIndex((p, i) => i > 0 && i < parts.length - 1 && PARTICLES.has(p.toLowerCase()));
  if (particleAt > 0) return parts.slice(particleAt).join(' ');
  return parts[parts.length - 1];
}

/**
 * DISPLAY NAME. "Husqvarna British Masters hosted by Sir Nick Faldo" is 50
 * characters and does not fit one nowrap line at 15/700 in a 390 viewport —
 * MEASURED, it overflowed by ~30px. The host credit is the only removable part
 * and carries no scheduling information, so it is dropped for display only. The
 * stored name is untouched and the tournament page still shows it in full.
 */
export function displayEventName(name: string): string {
  return name.replace(/\s+(hosted|presented)\s+by\s+.+$/i, '').trim() || name;
}

interface DayGroup {
  key: string;
  dateLabel: string;
  daysAway: number;
  events: ComingUpRow[];
}

/** Group consecutive rows by start_date. The list is already date-ordered. */
function groupByDay(rows: ComingUpRow[]): DayGroup[] {
  const out: DayGroup[] = [];
  for (const r of rows) {
    const last = out[out.length - 1];
    if (last && last.key === r.start_date) {
      last.events.push(r);
      continue;
    }
    const d = new Date(r.start_date);
    out.push({
      key: r.start_date,
      dateLabel: `${d.getDate()} ${formatMonthShort(d).toUpperCase()}`,
      daysAway: r.days_away,
      events: [r],
    });
  }
  return out;
}

/** Pages are cut on EVENT count, so a day never splits across a page boundary. */
function paginate(groups: DayGroup[]): DayGroup[][] {
  const pages: DayGroup[][] = [];
  let page: DayGroup[] = [];
  let count = 0;
  for (const g of groups) {
    if (count > 0 && count + g.events.length > PAGE_SIZE) {
      pages.push(page);
      page = [];
      count = 0;
    }
    page.push(g);
    count += g.events.length;
  }
  if (page.length > 0) pages.push(page);
  return pages;
}

export function ComingUp({ tour }: { tour: TourId | null }) {
  const { t } = useTranslation('tourhub');
  const navigate = useNavigate();
  const { data, isLoading } = useComingUp(tour, 15);
  const rows = data ?? [];

  const pages = useMemo(() => paginate(groupByDay(rows)), [rows]);

  const trackRef = useRef<HTMLDivElement>(null);
  const [activePage, setActivePage] = useState(0);

  /* PAGE HEIGHT FOLLOWS THE SWIPE. Pages differ in height (see header claim c),
     and a flex row sizes to its tallest child — so the track height is measured
     per page and driven from the same scrollLeft read as the active dot. No CSS
     transition: the height already tracks the finger continuously. */
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const heightsRef = useRef<number[]>([]);
  const [trackH, setTrackH] = useState<number | null>(null);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => {
      const w = el.clientWidth;
      if (w <= 0) return;
      const raw = el.scrollLeft / w;
      const lo = Math.max(0, Math.floor(raw));
      const hi = Math.min(pages.length - 1, lo + 1);
      const h = Math.max(heightsRef.current[lo] ?? 0, heightsRef.current[hi] ?? 0);
      if (h > 0) setTrackH(h);
      const idx = Math.round(raw);
      setActivePage((prev) => (prev === idx ? prev : idx));
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [pages.length]);

  // Re-measure on data / lens / font / locale change. A zero measurement leaves
  // trackH null so the card sizes itself rather than collapsing.
  useEffect(() => {
    const els = pageRefs.current.slice(0, pages.length).filter(Boolean) as HTMLDivElement[];
    if (els.length === 0) return;
    const apply = () => {
      heightsRef.current = pageRefs.current.map((el) => el?.offsetHeight ?? 0);
      const el = trackRef.current;
      const w = el?.clientWidth ?? 0;
      const raw = el && w > 0 ? el.scrollLeft / w : 0;
      const lo = Math.max(0, Math.floor(raw));
      const hi = Math.min(pages.length - 1, lo + 1);
      const h = Math.max(heightsRef.current[lo] ?? 0, heightsRef.current[hi] ?? 0);
      if (h > 0) setTrackH(h);
    };
    apply();
    const ro = new ResizeObserver(apply);
    els.forEach((el) => ro.observe(el));
    return () => ro.disconnect();
  }, [pages.length, pages]);


  const goSchedule = () =>
    navigate(tour ? `/tourhub?tab=schedule&tour=${tour}` : '/tourhub?tab=schedule');

  const countdown = (days: number) =>
    days <= 0
      ? t('overview.comingUp.today')
      : days === 1
        ? t('overview.comingUp.tomorrow')
        : t('overview.comingUp.inDays', { count: days });

  if (isLoading && rows.length === 0) {
    return (
      <SectionShell eyebrow={t('overview.comingUp.eyebrow')} linkLabel={t('overview.comingUp.linkLabel')} onLinkClick={goSchedule}>
        <div style={{ margin: '0 16px' }}>
          <V4Card style={{ overflow: 'hidden' }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  padding: '11px 14px 12px',
                  borderTop: i === 0 ? 'none' : `0.5px solid ${V4.hairline}`,
                }}
              >
                {/* line 1 — name with the tour badge beside it (three-line row) */}
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-3/5 rounded" />
                  <Skeleton className="h-3.5 w-10 rounded" />
                </div>
                <Skeleton className="mt-1.5 h-3 w-2/5 rounded" />
                <Skeleton className="mt-2 h-7 w-4/5 rounded" />
              </div>
            ))}
          </V4Card>
        </div>
      </SectionShell>
    );
  }
  if (rows.length === 0) return null;

  return (
    <SectionShell eyebrow={t('overview.comingUp.eyebrow')} linkLabel={t('overview.comingUp.linkLabel')} onLinkClick={goSchedule}>
      <div style={{ margin: '0 16px' }}>
        <V4Card style={{ overflow: 'hidden' }}>
          <div
            ref={trackRef}
            className="coming-up-track"
            style={{
              display: 'flex',
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
            }}
          >
            {pages.map((page, pi) => (
              <div key={pi} style={{ flex: '0 0 100%', width: '100%', scrollSnapAlign: 'start' }}>
                {page.map((group, gi) => (
                  <div key={group.key}>
                    {/* GROUP HEADER — the date once, the countdown once. */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '9px 14px',
                        background: GROUP_BG,
                        borderTop: gi === 0 ? 'none' : `0.5px solid ${V4.hairline}`,
                      }}
                    >
                      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: V4.ink, textTransform: 'uppercase' }}>
                        {group.dateLabel}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: DIM, textTransform: 'uppercase' }}>
                        {countdown(group.daysAway)}
                      </span>
                    </div>
                    {group.events.map((r, ri) => (
                      <EventRow
                        key={r.id}
                        row={r}
                        first={ri === 0}
                        onOpen={() => navigate(`/tourhub/tournament/${r.id}`)}
                      />
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <style>{`.coming-up-track::-webkit-scrollbar{display:none}`}</style>
        </V4Card>
        {pages.length > 1 ? (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10 }}>
            {pages.map((_, i) => (
              <span
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: i === activePage ? V4.ink : 'rgba(255,255,255,0.24)',
                  transition: 'background 160ms ease',
                }}
              />
            ))}
          </div>
        ) : null}
      </div>
    </SectionShell>
  );
}

function EventRow({ row, first, onOpen }: { row: ComingUpRow; first: boolean; onOpen: () => void }) {
  const { t } = useTranslation('tourhub');
  const purse = formatPurse(row.purse ?? null);
  const defends = surnameOf(row.defending_champion);
  const figures: { label: string; value: string }[] = [];
  if (purse) figures.push({ label: t('overview.comingUp.figPurse'), value: purse });
  if (row.field_size) figures.push({ label: t('overview.comingUp.figField'), value: String(row.field_size) });
  if (defends) figures.push({ label: t('overview.comingUp.figDefends'), value: defends });

  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        display: 'block',
        width: '100%',
        padding: '11px 14px 12px',
        textAlign: 'left',
        background: 'transparent',
        border: 'none',
        borderTop: first ? 'none' : `0.5px solid ${V4.hairline}`,
        cursor: 'pointer',
      }}
    >
      {/* AMENDMENT — line 1 IS NOW NAME + TOUR BADGE, on one row. The badge sits
          AFTER the name because a truncated tour code is useless where a
          truncated tournament name is still recognisable: the name takes
          minWidth 0 and the ellipsis, the badge is flex 'none' and never
          shrinks or wraps. THE PLAYOFFS CHIP IS GONE from this section (Ben's
          call); it survives on the schedule page's SeasonRow. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <div
          style={{
            minWidth: 0,
            flex: '1 1 auto',
            fontSize: 15,
            fontWeight: 700,
            color: V4.ink,
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {displayEventName(row.name)}
        </div>
        <Chip label={TOUR_LABEL[row.tour_slug] ?? row.tour_slug} fg={MUTE} bg="rgba(255,255,255,0.06)" border="rgba(255,255,255,0.10)" />
        {row.isMajor ? <Chip label={t('pill.majorEyebrow')} fg={V4.gold} bg={V4.goldSoftA} /> : null}
      </div>
      {/* line 3 — venue only. The defender lives in the three-up. */}
      {row.venue ? (
        <div
          style={{
            marginTop: 2,
            fontSize: 12.5,
            fontWeight: 500,
            color: DIM,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {row.venue}
        </div>
      ) : null}
      {/* line 4 — the three-up. A missing figure collapses its column. */}
      {figures.length > 0 ? (
        <div style={{ display: 'flex', gap: 18, marginTop: 8, minWidth: 0 }}>
          {figures.map((f) => (
            <div key={f.label} style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.13em', color: DIM, textTransform: 'uppercase' }}>
                {f.label}
              </div>
              <div
                style={{
                  marginTop: 2,
                  fontSize: 13,
                  fontWeight: 700,
                  color: MUTE,
                  fontVariantNumeric: 'tabular-nums lining-nums',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {f.value}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </button>
  );
}

function Chip({ label, fg, bg, border }: { label: string; fg: string; bg: string; border?: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        flex: 'none',
        whiteSpace: 'nowrap',
        padding: '2px 6px',
        borderRadius: 5,
        background: bg,
        border: border ? `1px solid ${border}` : 'none',
        color: fg,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </span>
  );
}
