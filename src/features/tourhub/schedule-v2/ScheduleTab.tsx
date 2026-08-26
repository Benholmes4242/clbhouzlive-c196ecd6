/**
 * schedule-v2/ScheduleTab — "The Season" open-ledger schedule view.
 *
 * Analytical grammar: no row rules, a load-bearing column grid, one filled
 * (INK) jump control, and a three-up figures header. Amber appears in exactly
 * two places on this surface: the KICKER and the anchor row's day numeral.
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
import ScrollToTopGlass from '@/components/common/ScrollToTopGlass';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { SectionTourLens } from '../overview/sections/SectionTourLens';
import { TOUR_CONFIG, type TourId } from '../hooks/useOverviewData';

import { tournamentRoute } from '../routes';
import { TourHubEmptyState } from '../components/TourHubEmptyState';
import { useSeasonTimeline, type SeasonEvent } from './useSeasonTimeline';
import { useMergedSchedule } from './useMergedSchedule';
import { SeasonRow } from './SeasonRow';
import { getScrollAncestor, scrollElementIntoView } from '@/lib/getScrollParent';
import {
  FONT,
  HAIRLINE_INK_10,
  INK,
  INK_FAINT,
  INK_MUTE,
  LIVE_DOT,
  SLATE_50,
} from '../_shared/tokens';

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
  const chipsRef = useRef<HTMLDivElement | null>(null);
  const monthHeaderRef = useRef<HTMLDivElement | null>(null);
  const [anchorFar, setAnchorFar] = useState(false);
  const viewTrackedRef = useRef(false);

  // Publish real chips-row outer height so month headers can stack flush.
  useEffect(() => {
    const el = chipsRef.current;
    if (!el) return;
    const publish = () => {
      document.documentElement.style.setProperty(
        '--tour-chips-h',
        `${Math.round(el.offsetHeight)}px`,
      );
    };
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Per-section tour lens (local state, All Tours allowed). Seeded ONCE from
  // ?tour= when it names a known tour; All Tours (null) stays the default.
  const [tourLens, setTourLens] = useState<TourId | null>(() => {
    const param = searchParams.get('tour');
    if (param && Object.prototype.hasOwnProperty.call(TOUR_CONFIG, param)) {
      return param as TourId;
    }
    return null;
  });
  const singleTour: TourId = tourLens ?? 'pga';

  const singleQuery = useSeasonTimeline(singleTour, { enabled: tourLens !== null });
  const mergedQuery = useMergedSchedule({ enabled: tourLens === null });
  const { data: timeline, isLoading, error, refetch } =
    tourLens === null ? mergedQuery : singleQuery;

  const activeTour: TourId | 'all' = tourLens ?? 'all';

  // Publish the month header's real outer height so the anchor scroll offset
  // clears BOTH sticky layers (chips row + month header).
  useEffect(() => {
    const el = monthHeaderRef.current;
    if (!el) return;
    const publish = () => {
      document.documentElement.style.setProperty(
        '--tour-month-h',
        `${Math.round(el.offsetHeight)}px`,
      );
    };
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    return () => ro.disconnect();
  }, [timeline?.months.length]);

  const allEvents = useMemo<SeasonEvent[]>(
    () => (timeline ? timeline.months.flatMap((m) => m.events) : []),
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

  // ── Auto-land on this-week/next row on mount + tour flip ───────────────
  const anchorId = timeline?.anchorEventId ?? null;
  const computeOffset = () => {
    const rootStyles = getComputedStyle(document.documentElement);
    const chipsH =
      parseInt(rootStyles.getPropertyValue('--tour-chips-h'), 10) || 47;
    const monthH =
      parseInt(rootStyles.getPropertyValue('--tour-month-h'), 10) || 32;
    const headerH =
      parseInt(rootStyles.getPropertyValue('--tour-header-h'), 10) || 0;
    return headerH + chipsH + monthH + 20;
  };
  useEffect(() => {
    if (!anchorId) return;
    let cancelled = false;
    let rafId = 0;
    const start = performance.now();
    const DEADLINE = 1500;
    const tryScroll = () => {
      if (cancelled) return;
      const el = document.getElementById(`sv2-row-${anchorId}`);
      if (!el) {
        if (performance.now() - start < DEADLINE) {
          rafId = requestAnimationFrame(tryScroll);
        }
        return;
      }
      const doScroll = () => {
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
  }, [anchorId, activeTour]);

  const scrollToAnchor = useCallback(() => {
    if (!anchorId) return;
    analyticsEvents.track('tour_schedule_jump_tapped', {
      anchor_state: anchorState,
    });
    const el = document.getElementById(`sv2-row-${anchorId}`);
    if (!el) return;
    scrollElementIntoView(el, { offset: computeOffset(), behavior: 'auto' });
  }, [anchorId, anchorState]);

  // ── "Far from today" detector — anchor >1.5 viewports off-screen ────────
  useEffect(() => {
    if (!anchorId) {
      setAnchorFar(false);
      return;
    }
    const el = document.getElementById(`sv2-row-${anchorId}`);
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
      const center = rect.top + rect.height / 2;
      const dist = Math.abs(center - vh / 2);
      setAnchorFar(dist > vh * 1.5);
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
  }, [anchorId, timeline?.totalEvents]);

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

  // ── Header figures ─────────────────────────────────────────────────────
  const yearLabel = timeline?.seasonYear ?? new Date().getFullYear();
  const played = useMemo(
    () => allEvents.filter((e) => e.state === 'completed').length,
    [allEvents],
  );
  const remaining = useMemo(
    () => allEvents.filter((e) => e.state === 'upcoming').length,
    [allEvents],
  );
  const nextMajorDays = useMemo(() => {
    const hit = allEvents.find(
      (e) => e.state === 'upcoming' && e.isMajor && e.daysAway !== null,
    );
    return hit?.daysAway ?? null;
  }, [allEvents]);

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

  let monthHeaderAttached = false;

  return (
    <div
      style={{
        background: SLATE_50,
        minHeight: '100vh',
        fontFamily: FONT,
        position: 'relative',
      }}
    >
      {/* Tour lens — sticky opaque wrapper preserves --tour-chips-h. */}
      <div
        ref={chipsRef}
        style={{
          position: 'sticky',
          top: 'var(--tour-header-h, 0px)',
          zIndex: 10,
          background: '#15171F',
          borderBottom: '1px solid rgba(255,255,255,0.10)',
        }}
      >
        <SectionTourLens value={tourLens} onChange={onTourChange} showAllTours />
      </div>

      {/* HEADER — scrolls under the chips row like any content. */}
      <div style={{ padding: '16px 16px 12px' }}>
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
              {nextMajorDays !== null && (
                <StatCell
                  label={t('schedule.stats.nextMajor')}
                  value={String(nextMajorDays)}
                  suffix={t('schedule.stats.daysSuffix')}
                />
              )}
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

      {/* BODY — page owns the scroll (no inner scroller). */}
      <div style={{ position: 'relative' }}>
        {isLoading ? (
          <div style={{ padding: '0 16px' }}>
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
                color: SLATE_50,
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
            {timeline!.months.map((group) => {
              const attachRef = !monthHeaderAttached;
              if (attachRef) monthHeaderAttached = true;
              return (
                <section key={group.key}>
                  <div
                    ref={attachRef ? monthHeaderRef : undefined}
                    style={{
                      position: 'sticky',
                      top: 'calc(var(--tour-header-h, 0px) + var(--tour-chips-h, 47px) - 1px)',
                      zIndex: 2,
                      background: SLATE_50,
                      padding: '14px 16px 6px',
                      // READ 11: the month group heading is language.
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.14em',
                      color: INK_MUTE,
                      textTransform: 'uppercase',
                    }}
                  >
                    {group.label}
                  </div>
                  <div>
                    {group.events.map((evt) => {
                      const isAnchor = evt.id === timeline!.anchorEventId;
                      return (
                        <div key={evt.id} id={`sv2-row-${evt.id}`}>
                          <SeasonRow
                            event={evt}
                            isAnchor={isAnchor}
                            onSelect={onSelectEvent}
                          />
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
            <div
              aria-hidden="true"
              style={{ height: 'calc(var(--bottom-nav-height, 88px) + 16px)' }}
            />
          </>
        )}
      </div>

      {/* Back-to-top FAB (canonical grey chevron, portaled) */}
      <ScrollToTopGlass />

      {/* Jump control — the one filled button on this surface, and it is INK. */}
      {anchorId && anchorFar && createPortal(
        <button
          type="button"
          onClick={scrollToAnchor}
          aria-label={t('schedule.floating.today')}
          style={{
            position: 'fixed',
            bottom: 'calc(6rem + 2px)',
            right: 'calc(1rem + 48px)',
            zIndex: 39,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            height: 28,
            padding: '0 12px',
            borderRadius: 999,
            background: INK,
            color: SLATE_50,
            border: 'none',
            fontFamily: FONT,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {anchorState === 'live' && (
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: LIVE_DOT,
                display: 'inline-block',
              }}
            />
          )}
          {t('schedule.floating.today')}
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
