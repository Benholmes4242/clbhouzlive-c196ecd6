/**
 * schedule-v2/ScheduleTab — the rebuilt Tour Schedule
 * (BRIEF_TOUR_SCHEDULE_REBUILT, schedule-signed-off.html).
 *
 * Weeks, not months: events group into Monday→Sunday weeks with sticky
 * LAST/THIS/NEXT WEEK headers; THIS WEEK is lightly shaded and is the anchor
 * the page opens on. A next-major card sits above the list when an upcoming
 * major exists for the current lens. The "This week" pill appears only when
 * the THIS WEEK section is fully off screen and smooth-scrolls back to it.
 *
 * The tour chip row is this page's ONLY tour control by design —
 * TourSelectionContext is scoped to the overview hero. ?tour= is honoured once
 * on mount so Coming Up's "full schedule" link keeps the member's tour.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useTourLensFromPicker } from '../hooks/useTourLensFromPicker';
import { readStoredTour } from '../hooks/useTourSelection';
import { TOUR_CONFIG, type TourId } from '../hooks/useOverviewData';
import { isActiveTour } from '../constants/tourMap';

import { tournamentRoute } from '../routes';
import { TourHubEmptyState } from '../components/TourHubEmptyState';
import { useSeasonTimeline, type SeasonEvent } from './useSeasonTimeline';
import { useMergedSchedule } from './useMergedSchedule';
import { SeasonRow, type SeasonRowYou } from './SeasonRow';
import { useScheduleFieldPlayers } from './useScheduleFieldPlayers';
import { useTourPlayerFollows } from '../leaderboard/useTourPlayerFollows';
import { useComingUpOwnRounds } from '../overview/data/useComingUpOwnRounds';
import { displayEventName } from '../overview/sections/ComingUp';
import { getScrollAncestor, scrollElementIntoView } from '@/lib/getScrollParent';
import { currentWeekKey, weekRelation } from './timelineUtils';
import {
  followedFieldNames,
  nextMajorDateLabel,
  seasonBreakBoundaries,
  venueLine,
  weekRangeLabel,
  type SeasonBreak as SeasonBreakModel,
} from './scheduleRules';
import { formatDayMonthShortGB } from '@/i18n/format';
import {
  AMBER,
  FONT,
  HAIRLINE_INK_10,
  INK,
  INK_FAINT,
  INK_MUTE,
  TOUR_CANVAS,
  WHITE_ALPHA_06,
} from '../_shared/tokens';

const PANEL = '#141418';
const THIS_WEEK_BG = 'rgba(255,255,255,0.025)';
const THIS_WEEK_HEADER_BG = '#0E0E11';

/* Season break (schedule-across-seasons-signed-off.html): the ending
   season's closing line, then the next season's amber-headed opener. */
const SEASON_KICKER: React.CSSProperties = {
  display: 'block',
  fontSize: 10.5,
  fontWeight: 800,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
};

const SeasonBreakBlock: React.FC<{ brk: SeasonBreakModel }> = ({ brk }) => {
  const { t } = useTranslation('tourhub');
  const startDate = brk.starting.firstStart
    ? formatDayMonthShortGB(new Date(`${brk.starting.firstStart.slice(0, 10)}T12:00:00Z`))
    : null;
  return (
    <div data-season-break={`${brk.ending.year}-${brk.starting.year}`}>
      <div
        style={{
          padding: '22px 22px 14px',
        }}
      >
        <span style={{ ...SEASON_KICKER, color: INK_MUTE }}>
          {t('schedule.seasonBreak.end', {
            year: brk.ending.year,
            defaultValue: `END OF THE ${brk.ending.year} SEASON`,
          })}
        </span>
        <span
          className="num"
          style={{ display: 'block', marginTop: 3, fontSize: 12.5, color: INK_MUTE, fontVariantNumeric: 'tabular-nums' }}
        >
          {t('schedule.seasonBreak.eventCount', {
            count: brk.ending.eventCount,
            defaultValue_one: '{{count}} event',
            defaultValue_other: '{{count}} events',
          })}
        </span>
      </div>
      <div
        style={{
          padding: '16px 22px 14px',
          borderTop: '1px solid rgba(247,147,30,0.45)',
          background: 'linear-gradient(180deg, rgba(247,147,30,0.08), rgba(247,147,30,0))',
        }}
      >
        <span style={{ ...SEASON_KICKER, color: AMBER }}>
          {t('schedule.seasonBreak.season', {
            year: brk.starting.year,
            defaultValue: `${brk.starting.year} SEASON`,
          })}
        </span>
        <span
          className="num"
          style={{ display: 'block', marginTop: 4, fontSize: 17, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}
        >
          {startDate
            ? t('schedule.seasonBreak.from', {
                count: brk.starting.eventCount,
                date: startDate,
                defaultValue_one: '{{count}} event, from {{date}}',
                defaultValue_other: '{{count}} events, from {{date}}',
              })
            : t('schedule.seasonBreak.eventCount', {
                count: brk.starting.eventCount,
                defaultValue_one: '{{count}} event',
                defaultValue_other: '{{count}} events',
              })}
        </span>
        {brk.starting.tourName ? (
          <span style={{ display: 'block', marginTop: 3, fontSize: 12.5, color: INK_MUTE }}>
            {brk.starting.tourName}
          </span>
        ) : null}
      </div>
    </div>
  );
};

const KICKER: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: INK,
};

const LABEL: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.13em',
  textTransform: 'uppercase',
  color: INK_FAINT,
};

const FIGURE: React.CSSProperties = {
  fontSize: 21,
  fontWeight: 700,
  letterSpacing: '-0.02em',
  color: INK,
  lineHeight: 1,
  fontVariantNumeric: 'tabular-nums lining-nums',
};

export function ScheduleTab() {
  const { t } = useTranslation('tourhub');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const weekHeaderRef = useRef<HTMLDivElement | null>(null);
  const [anchorFar, setAnchorFar] = useState(false);
  const viewTrackedRef = useRef(false);

  // The sticky chips row is GONE (BRIEF_TOUR_HEADER_ONE_ROW): the tour control
  // now lives in the island's left capsule. --tour-chips-h is still read by the
  // week-header offset and the anchor scroll maths, and both readers carry a
  // 47px fallback — so it must be written as 0, never left unset.
  useEffect(() => {
    document.documentElement.style.setProperty('--tour-chips-h', '0px');
  }, []);

  // Per-section tour lens (local state, All Tours allowed). Seeded ONCE from
  // ?tour= when it names a known tour; All Tours (null) stays the default.
  const [tourLens, setTourLens] = useState<TourId | null>(() => {
    const param = searchParams.get('tour');
    /* `?tour=all` is an EXPLICIT All Tours request from a caller that knows
       the member's lens (Coming Up's FULL SCHEDULE row). It must beat the
       stored single tour, otherwise a see-all silently narrows the scope. */
    if (param === 'all') return null;
    if (param && isActiveTour(param)) {
      return param as TourId;
    }
    const stored = readStoredTour();
    if (stored && isActiveTour(stored)) {
      return stored as TourId;
    }
    return null;
  });
  const singleTour: TourId = tourLens ?? 'pga';

  const singleQuery = useSeasonTimeline(singleTour, { enabled: tourLens !== null });
  const mergedQuery = useMergedSchedule({ enabled: tourLens === null });
  const { data: timeline, isLoading, error, refetch } =
    tourLens === null ? mergedQuery : singleQuery;

  const activeTour: TourId | 'all' = tourLens ?? 'all';

  // Publish the week header's real outer height so the anchor scroll offset
  // clears BOTH sticky layers (chips row + week header).
  useEffect(() => {
    const el = weekHeaderRef.current;
    if (!el) return;
    const publish = () => {
      document.documentElement.style.setProperty(
        '--tour-week-h',
        `${Math.round(el.offsetHeight)}px`,
      );
    };
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    return () => ro.disconnect();
  }, [timeline?.weeks.length]);

  const allEvents = useMemo<SeasonEvent[]>(
    () => (timeline ? timeline.weeks.flatMap((w) => w.events) : []),
    [timeline],
  );
  const anchorEvent = useMemo(
    () => allEvents.find((e) => e.id === timeline?.anchorEventId) ?? null,
    [allEvents, timeline?.anchorEventId],
  );
  const anchorState: 'live' | 'upcoming' | 'none' =
    anchorEvent?.state === 'live'
      ? 'live'
      : anchorEvent
        ? 'upcoming'
        : 'none';

  // ── Member signals (§5/§7): follows, fields, own courses — all batched ──
  const { ids: followedIds } = useTourPlayerFollows();
  const upcomingForField = useMemo(
    () =>
      allEvents
        .filter((e) => e.state === 'upcoming')
        .map((e) => ({ id: e.id, startDate: e.startDate })),
    [allEvents],
  );
  const liveIds = useMemo(
    () => allEvents.filter((e) => e.state === 'live').map((e) => e.id),
    [allEvents],
  );
  const fieldMap = useScheduleFieldPlayers(upcomingForField, liveIds);
  const courseIds = useMemo(
    () =>
      allEvents
        .map((e) => e.golfCourseId)
        .filter((id): id is string => Boolean(id)),
    [allEvents],
  );
  const ownRounds = useComingUpOwnRounds(courseIds);

  const youByEvent = useMemo(() => {
    const map = new Map<string, SeasonRowYou>();
    for (const e of allEvents) {
      const protagonistId =
        e.state === 'completed'
          ? (e.champion?.playerId ?? null)
          : e.state === 'live'
            ? (e.leader?.playerId ?? null)
            : null;
      map.set(e.id, {
        followedPlayerId:
          protagonistId && followedIds.has(protagonistId) ? protagonistId : null,
        fieldNames:
          e.state === 'upcoming' || e.state === 'live'
            ? followedFieldNames(fieldMap.get(e.id), followedIds)
            : [],
        playedHere: e.golfCourseId ? (ownRounds?.has(e.golfCourseId) ?? false) : false,
      });
    }
    return map;
  }, [allEvents, followedIds, fieldMap, ownRounds]);

  // ── Auto-land on this-week/next row on mount + tour flip ───────────────
  /* EMPTY-WEEK FIX: the first landing fired before the winner/leader
     enrichment settled; the rows above the anchor then grew and the page
     landed short, leaving a pinned week header covering its own row (the
     "12 – 18 OCT" / SAS Championship report). Re-land whenever the timeline
     identity changes (enrichment settle points) until the user scrolls. */
  const userScrolledRef = useRef(false);
  useEffect(() => {
    userScrolledRef.current = false;
    const mark = () => { userScrolledRef.current = true; };
    window.addEventListener('wheel', mark, { passive: true });
    window.addEventListener('touchmove', mark, { passive: true });
    window.addEventListener('keydown', mark);
    return () => {
      window.removeEventListener('wheel', mark);
      window.removeEventListener('touchmove', mark);
      window.removeEventListener('keydown', mark);
    };
  }, [activeTour]);

  const anchorId = timeline?.anchorEventId ?? null;
  const computeOffset = () => {
    const rootStyles = getComputedStyle(document.documentElement);
    /* `|| 47` would swallow a legitimate 0: the chips row is gone, so the var
       IS "0px" and the fallback must only cover an unset/NaN read. */
    const chipsRaw = parseInt(rootStyles.getPropertyValue('--tour-chips-h'), 10);
    const chipsH = Number.isNaN(chipsRaw) ? 47 : chipsRaw;
    const weekH =
      parseInt(rootStyles.getPropertyValue('--tour-week-h'), 10) || 41;
    const headerH =
      parseInt(rootStyles.getPropertyValue('--tour-header-h'), 10) || 0;
    return headerH + chipsH + weekH;
  };
  useEffect(() => {
    if (!anchorId) return;
    let cancelled = false;
    let rafId = 0;
    const start = performance.now();
    const DEADLINE = 1500;
    const tryScroll = () => {
      if (cancelled || userScrolledRef.current) return;
      const el = document.getElementById(`sv2-row-${anchorId}`);
      if (!el) {
        if (performance.now() - start < DEADLINE) {
          rafId = requestAnimationFrame(tryScroll);
        }
        return;
      }
      const doScroll = () => {
        if (userScrolledRef.current) return;
        scrollElementIntoView(el, { offset: computeOffset(), behavior: 'auto' });
      };
      doScroll();
      rafId = requestAnimationFrame(() => {
        if (cancelled) return;
        doScroll();
      });
    };
    rafId = requestAnimationFrame(() => requestAnimationFrame(tryScroll));
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [anchorId, activeTour, timeline]);

  const thisWeekKey = useMemo(() => currentWeekKey(), [timeline?.totalEvents]);
  const hasThisWeek = !!timeline?.weeks.some((w) => w.key === thisWeekKey);

  const scrollToAnchor = useCallback(() => {
    if (!anchorId) return;
    analyticsEvents.track('tour_schedule_jump_tapped', {
      anchor_state: anchorState,
    });
    const section = document.getElementById('sv2-week-this');
    const el = section ?? document.getElementById(`sv2-row-${anchorId}`);
    if (!el) return;
    scrollElementIntoView(el, { offset: computeOffset(), behavior: 'smooth' });
  }, [anchorId, anchorState]);

  // ── "This week" visibility — the THIS WEEK section fully off screen ────
  useEffect(() => {
    const section = document.getElementById('sv2-week-this');
    const row = anchorId ? document.getElementById(`sv2-row-${anchorId}`) : null;
    const el = section ?? row;
    if (!el) {
      setAnchorFar(false);
      return;
    }
    const scroller = getScrollAncestor(el);
    const target: HTMLElement | Window = scroller ?? window;
    let ticking = false;
    const compute = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      if (section) {
        // Fully off screen: entirely above the sticky header or below the fold.
        const rootStyles = getComputedStyle(document.documentElement);
        const headerH =
          parseInt(rootStyles.getPropertyValue('--tour-header-h'), 10) || 0;
        setAnchorFar(rect.bottom <= headerH || rect.top >= vh);
      } else {
        // No THIS WEEK section (off-season): the former anchor-distance rule.
        const center = rect.top + rect.height / 2;
        const dist = Math.abs(center - vh / 2);
        setAnchorFar(dist > vh * 1.5);
      }
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        compute();
        ticking = false;
      });
    };
    compute();
    target.addEventListener('scroll', onScroll, { passive: true } as AddEventListenerOptions);
    return () => target.removeEventListener('scroll', onScroll as EventListener);
  }, [anchorId, timeline?.totalEvents, hasThisWeek]);

  // ── Row navigation ─────────────────────────────────────────────────────
  const onSelectEvent = useCallback(
    (evt: SeasonEvent) => {
      analyticsEvents.track('tour_schedule_row_tapped', {
        tournament_id: evt.id,
        state: evt.state,
        is_major: evt.isMajor,
        days_away: evt.daysAway,
        mode: tourLens === null ? 'all' : 'single',
      });
      const target = tournamentRoute(evt.id, { kind: 'schedule' });
      navigate(target.to, { state: target.state });
    },
    [navigate, tourLens],
  );

  const onTourChange = useCallback(
    (next: TourId | null) => {
      analyticsEvents.track('tour_schedule_tour_changed', {
        from: tourLens,
        to: next,
      });
      setTourLens(next);
    },
    [tourLens],
  );

  /* The island's TourPickerSheet replaces the deleted pills row. Mapping:
     the sheet's All-tours row emits 'all', which is this page's `null` lens
     (the merged schedule) — the same value the lens's All Tours chip passed.
     'major' is not a schedule tour, so it is ignored rather than substituted. */
  useTourLensFromPicker<TourId | null>(
    (slug) => {
      if (slug === 'all') return null;
      if (isActiveTour(slug)) return slug as TourId;
      return undefined;
    },
    onTourChange,
    tourLens ?? 'all',
  );

  // ── Header figures + next major ────────────────────────────────────────
  /* The list runs across seasons, but the header figures keep describing
     the CURRENT season only (inCurrentSeason is undefined — treated as
     current — on the merged all-tours view, which is unchanged). */
  const currentSeasonEvents = useMemo(
    () => allEvents.filter((e) => e.inCurrentSeason !== false),
    [allEvents],
  );
  const yearLabel = timeline?.seasonYear ?? new Date().getFullYear();
  const played = useMemo(
    () => currentSeasonEvents.filter((e) => e.state === 'completed').length,
    [currentSeasonEvents],
  );
  const remaining = useMemo(
    () => currentSeasonEvents.filter((e) => e.state === 'upcoming').length,
    [currentSeasonEvents],
  );
  const nextMajor = useMemo(
    () =>
      currentSeasonEvents.find(
        (e) => e.state === 'upcoming' && e.isMajor && e.daysAway !== null,
      ) ?? null,
    [currentSeasonEvents],
  );

  // Season breaks: event id → the boundary that renders before it.
  const seasonBreaks = useMemo(
    () =>
      timeline?.seasons && timeline.seasons.length > 1
        ? seasonBreakBoundaries(allEvents, timeline.seasons)
        : new Map<string, SeasonBreakModel>(),
    [allEvents, timeline?.seasons],
  );

  const progressPct = useMemo(() => {
    if (!timeline || timeline.totalEvents === 0) return 0;
    return Math.max(0, Math.min(1, played / timeline.totalEvents));
  }, [timeline, played]);

  const hasTimeline = !!timeline && timeline.totalEvents > 0;

  // Fire once per mount, after the timeline resolves.
  useEffect(() => {
    if (viewTrackedRef.current || !hasTimeline) return;
    viewTrackedRef.current = true;
    analyticsEvents.track('tour_schedule_viewed', {
      mode: tourLens === null ? 'all' : 'single',
      tour: tourLens,
      total_events: timeline!.totalEvents,
      anchor_state: anchorState,
    });
  }, [hasTimeline, timeline, tourLens, anchorState]);

  let weekHeaderAttached = false;

  return (
    <div
      style={{
        background: TOUR_CANVAS,
        minHeight: '100vh',
        fontFamily: FONT,
        position: 'relative',
      }}
    >
      {/* No tour-pills row: the island's left capsule owns the tour control
          (BRIEF_TOUR_HEADER_ONE_ROW). --tour-chips-h is written as 0 above. */}

      {/* HEADER */}

      <div style={{ padding: '16px 24px 12px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <span style={KICKER}>{t('schedule.eyebrow.season')}</span>
          <span style={{ ...LABEL, fontVariantNumeric: 'tabular-nums lining-nums' }}>
            {tourLens
              ? `${yearLabel} · ${TOUR_CONFIG[tourLens]?.name ?? tourLens}`
              : `${yearLabel}`}
          </span>
        </div>

        {isLoading ? (
          <div>
            <Skeleton className="h-6 w-full rounded mb-2" />
            <Skeleton className="h-1 w-full rounded-full" />
          </div>
        ) : hasTimeline ? (
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-around',
                gap: 12,
                marginBottom: 12,
              }}
            >
              <StatCell label={t('schedule.stats.played')} value={String(played)} />
              <StatCell
                label={t('schedule.stats.remaining')}
                value={String(remaining)}
              />
            </div>
            {timeline!.totalEvents > 0 && (
              <div
                style={{
                  height: 3,
                  background: HAIRLINE_INK_10,
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${Math.round(progressPct * 100)}%`,
                    height: '100%',
                    background: INK,
                    transition: 'width 240ms ease',
                  }}
                />
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* NEXT MAJOR — takes the former header figure's place (§2). */}
      {!isLoading && nextMajor ? (
        <button
          type="button"
          onClick={() => onSelectEvent(nextMajor)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            width: 'calc(100% - 32px)',
            margin: '18px 16px 6px',
            padding: 14,
            borderRadius: 16,
            background: PANEL,
            border: '1px solid rgba(255,255,255,0.08)',
            color: INK,
            textAlign: 'left',
            cursor: 'pointer',
            fontFamily: FONT,
          }}
        >
          <span style={{ flex: 'none', width: 64, textAlign: 'center' }}>
            <span
              className="num"
              style={{ display: 'block', fontSize: 26, fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}
            >
              {nextMajor.daysAway}
            </span>
            <span
              style={{
                display: 'block',
                marginTop: 4,
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: '0.14em',
                color: INK_FAINT,
              }}
            >
              {t('schedule.nextMajor.days', { count: nextMajor.daysAway ?? 0 })}
            </span>
          </span>
          <span style={{ minWidth: 0 }}>
            <span
              style={{
                display: 'block',
                fontSize: 9.5,
                fontWeight: 800,
                letterSpacing: '0.14em',
                color: INK_FAINT,
              }}
            >
              {t('schedule.nextMajor.label')}
            </span>
            <span style={{ display: 'block', marginTop: 3, fontSize: 16, fontWeight: 800 }}>
              {displayEventName(nextMajor.name)}
            </span>
            <span style={{ display: 'block', marginTop: 2, fontSize: 12.5, color: INK_MUTE }}>
              {[nextMajor.venueName, nextMajorDateLabel(nextMajor.startDate)]
                .filter(Boolean)
                .join(' · ')}
            </span>
          </span>
        </button>
      ) : null}

      {/* BODY — page owns the scroll (no inner scroller). */}
      <div style={{ position: 'relative' }}>
        {isLoading ? (
          <div style={{ padding: '0 24px' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="w-full mb-2" style={{ height: 68, borderRadius: 8 }} />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 px-6 text-center">
            <AlertCircle className="w-10 h-10 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold text-foreground">
              {t('schedule.error.title')}
            </h3>
            <p className="text-sm text-muted-foreground max-w-[280px]">
              {t('schedule.error.body')}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              style={{
                marginTop: 4,
                background: INK,
                color: TOUR_CANVAS,
                border: 'none',
                borderRadius: 999,
                padding: '10px 20px',
                fontFamily: FONT,
                // CAPS BUTTON: two points down from the 13 button base, 0.10em.
                fontSize: 11.5,
                fontWeight: 700,
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              {t('schedule.error.retry', { defaultValue: 'Retry' })}
            </button>
          </div>
        ) : !hasTimeline ? (
          <TourHubEmptyState variant="schedule" />
        ) : (
          <>
            {timeline!.weeks.map((group) => {
              const attachRef = !weekHeaderAttached;
              if (attachRef) weekHeaderAttached = true;
              const relation = weekRelation(group.key);
              const isThis = relation === 'this';
              const leftLabel =
                relation === 'last'
                  ? t('schedule.week.last')
                  : relation === 'this'
                    ? t('schedule.week.this')
                    : relation === 'next'
                      ? t('schedule.week.next')
                      : weekRangeLabel(group.key);
              const rightLabel =
                relation === 'other'
                  ? null
                  : `${weekRangeLabel(group.key)}${
                      isThis
                        ? ` · ${t('schedule.week.events', { count: group.events.length })}`
                        : ''
                    }`;
              const weekBreak = group.events[0]
                ? seasonBreaks.get(group.events[0].id)
                : undefined;
              return (
                <React.Fragment key={group.key}>
                {weekBreak ? <SeasonBreakBlock brk={weekBreak} /> : null}
                <section
                  id={isThis ? 'sv2-week-this' : undefined}
                  style={isThis ? { background: THIS_WEEK_BG } : undefined}
                >
                  <div
                    ref={attachRef ? weekHeaderRef : undefined}
                    style={{
                      position: 'sticky',
                      top: 'calc(var(--tour-header-h, 0px) + var(--tour-chips-h, 0px) - 1px)',
                      zIndex: 2,
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                      background: isThis ? THIS_WEEK_HEADER_BG : TOUR_CANVAS,
                      padding: '22px 24px 8px',
                      borderBottom: `1px solid ${WHITE_ALPHA_06}`,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase',
                        color: isThis ? INK : INK_MUTE,
                      }}
                    >
                      {leftLabel}
                    </span>
                    {rightLabel ? (
                      <span
                        className="num"
                        style={{ fontSize: 12, fontWeight: 600, color: INK_FAINT, fontVariantNumeric: 'tabular-nums' }}
                      >
                        {rightLabel}
                      </span>
                    ) : null}
                  </div>
                  <div>
                    {group.events.map((evt, eventIndex) => {
                      const isAnchor = evt.id === timeline!.anchorEventId;
                      const rowBreak =
                        eventIndex > 0 ? seasonBreaks.get(evt.id) : undefined;
                      return (
                        <div key={evt.id} id={`sv2-row-${evt.id}`}>
                          {rowBreak ? <SeasonBreakBlock brk={rowBreak} /> : null}
                          <SeasonRow
                            event={evt}
                            you={youByEvent.get(evt.id)}
                            isAnchor={isAnchor}
                            last={eventIndex === group.events.length - 1}
                            onSelect={onSelectEvent}
                          />
                        </div>
                      );
                    })}
                  </div>
                </section>
                </React.Fragment>
              );
            })}
            <div
              aria-hidden="true"
              style={{ height: 'calc(var(--bottom-nav-height, 96px) + 16px)' }}
            />
          </>
        )}
      </div>

      {/* This week — centred glass pill, 16px above the bottom nav (§6). */}
      {anchorId && anchorFar && createPortal(
        <button
          type="button"
          onClick={scrollToAnchor}
          aria-label={t('schedule.floating.thisWeek')}
          style={{
            position: 'fixed',
            bottom: 'calc(var(--bottom-nav-height, 96px) + 16px)',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 39,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            height: 40,
            padding: '0 16px',
            borderRadius: 999,
            background: 'rgba(20,20,24,0.92)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.18)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            color: INK,
            fontFamily: FONT,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
          {t('schedule.floating.thisWeek')}
        </button>,
        document.body,
      )}
    </div>
  );
}

const StatCell: React.FC<{ label: string; value: string; suffix?: string }> = ({
  label,
  value,
  suffix,
}) => (
  <div
    style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
    }}
  >
    <span style={LABEL}>{label}</span>
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 2 }}>
      <span style={FIGURE}>{value}</span>
      {suffix && (
        <span style={{ fontSize: 11, fontWeight: 700, color: INK_MUTE }}>
          {suffix}
        </span>
      )}
    </span>
  </div>
);

export default ScheduleTab;
