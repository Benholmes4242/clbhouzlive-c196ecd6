/**
 * schedule-v2/ScheduleTab — "The Season" open-ledger schedule view.
 *
 * Design: schedule-overview-grammar Option A body + schedule-navigation-model
 * chassis. Overview grammar throughout — amber eyebrow, thin numerals,
 * PlayerAvatar, gold reserved for majors.
 *
 * Wired to TourSelectionContext (single tour brain app-wide). Tour chips
 * dispatch selectTour(slug) — the same setter the hero picker uses.
 *
 * Not registered yet — TS2 cutover.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { SectionTourLens } from '../overview/sections/SectionTourLens';
import { TOUR_CONFIG, type TourId } from '../hooks/useOverviewData';

import { tournamentRoute } from '../routes';
import { TourHubEmptyState } from '../components/TourHubEmptyState';
import { useSeasonTimeline, type SeasonEvent } from './useSeasonTimeline';
import { useMergedSchedule } from './useMergedSchedule';
import { SeasonRow } from './SeasonRow';
import { getScrollAncestor, scrollElementIntoView } from '@/lib/getScrollParent';
import {
  AMBER,
  FONT,
  HAIRLINE_INK_10,
  INK,
  INK_FAINT,
  INK_MUTE,
  LIVE_DOT,
  SLATE_50,
} from '../_shared/tokens';


export function ScheduleTab() {
  const { t } = useTranslation('tourhub');
  const navigate = useNavigate();
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const chipsRef = useRef<HTMLDivElement | null>(null);
  const [anchorVisible, setAnchorVisible] = useState(true);

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


  // Per-section tour lens (local state, All Tours allowed).
  // Both hooks run unconditionally; we pick which result to render based on
  // the lens value. useMergedSchedule runs ONE query across all tours and
  // chronologically merges (Phase 5B); useSeasonTimeline keeps the single-
  // tour path unchanged.
  const [tourLens, setTourLens] = useState<TourId | null>(null);
  const singleTour: TourId = tourLens ?? 'pga';

  const singleQuery = useSeasonTimeline(singleTour);
  const mergedQuery = useMergedSchedule({ enabled: tourLens === null });
  const { data: timeline, isLoading, error } =
    tourLens === null ? mergedQuery : singleQuery;

  const activeTour: TourId | 'all' = tourLens ?? 'all';



  // ── Auto-land on this-week/next row on mount + tour flip ───────────────
  // Scrolls the row's real scroll ancestor; the app shell may own page scroll.
  //
  // Hardened: bounded rAF retry loop (~1500ms) until the anchor row exists,
  // then re-asserts once more after the router's ScrollRestoration effect
  // may fire scrollTo(0) on PUSH navigation. Offset is derived from the
  // sticky chips row (safe-area-inset + --tour-chips-h + breathing room)
  // instead of a hardcoded 200.
  const anchorId = timeline?.anchorEventId ?? null;
  const computeOffset = () => {
    const rootStyles = getComputedStyle(document.documentElement);
    const chipsH =
      parseInt(rootStyles.getPropertyValue('--tour-chips-h'), 10) || 47;
    // env(safe-area-inset-top) isn't queryable directly; read the --sat var
    // if present, else fall back to the chips top offset. 24 = breathing.
    const sat = parseInt(rootStyles.getPropertyValue('--sat'), 10) || 0;
    return sat + chipsH + 24;
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
      // Re-assert next frame in case ScrollRestoration or WebView reset
      // stomps our scroll after the fact.
      rafId = requestAnimationFrame(() => {
        if (cancelled) return;
        doScroll();
      });
    };
    // Wait a frame so rows have laid out.
    rafId = requestAnimationFrame(() => requestAnimationFrame(tryScroll));
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [anchorId, activeTour]);

  // ── Floating "This week" chip visibility (IntersectionObserver on row scroller)
  useEffect(() => {
    const el = anchorRef.current;
    if (!el || !anchorId) {
      setAnchorVisible(true);
      return;
    }
    const scroller = getScrollAncestor(el);
    const io = new IntersectionObserver(
      ([entry]) => setAnchorVisible(entry.isIntersecting),
      { root: scroller ?? null, threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [anchorId, timeline?.totalEvents]);

  const scrollToAnchor = useCallback(() => {
    if (!anchorId) return;
    const el = document.getElementById(`sv2-row-${anchorId}`);
    if (!el) return;
    scrollElementIntoView(el, { offset: computeOffset(), behavior: 'smooth' });
  }, [anchorId]);


  // ── Row navigation ─────────────────────────────────────────────────────
  const onSelectEvent = useCallback(
    (evt: SeasonEvent) => {
      const target = tournamentRoute(evt.id, { kind: 'schedule' });
      navigate(target.to, { state: target.state });
    },
    [navigate],
  );

  // ── Header meta ────────────────────────────────────────────────────────
  const yearLabel = timeline?.seasonYear ?? new Date().getFullYear();
  const progressPct = useMemo(() => {
    if (!timeline || timeline.totalEvents === 0) return 0;
    const n = timeline.currentEventNumber ?? 0;
    return Math.max(0, Math.min(1, n / timeline.totalEvents));
  }, [timeline]);

  // ── Loading / error / empty ────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{ background: SLATE_50, minHeight: '60vh', padding: 16 }}>
        <Skeleton className="w-full mb-3" style={{ height: 44 }} />
        <Skeleton className="w-full mb-3" style={{ height: 32 }} />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="w-full mb-2" style={{ height: 68, borderRadius: 8 }} />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 px-6 text-center">
        <AlertCircle className="w-10 h-10 text-muted-foreground/50" />
        <h3 className="text-lg font-semibold text-foreground">
          {t('schedule.error.title')}
        </h3>
        <p className="text-sm text-muted-foreground max-w-[280px]">
          {t('schedule.error.body')}
        </p>
      </div>
    );
  }
  if (!timeline || timeline.totalEvents === 0) {
    return <TourHubEmptyState variant="schedule" />;
  }

  return (
    <div
      style={{
        background: SLATE_50,
        minHeight: '100vh',
        fontFamily: FONT,
        position: 'relative',
        // Islands overlay the top band at rest; on scroll they ride away and
        // the chips row locks at the notch.
        paddingTop: 'calc(var(--sat, 0px) + 69px)',
      }}
    >
      {/* Tour lens — sticky glass wrapper preserves --tour-chips-h; chips
          themselves come from the canonical SectionTourLens primitive.
          Locks under the notch as the floating islands ride away with the
          page (TikTok/Instagram top-chrome model). */}
      <div
        ref={chipsRef}
        style={{
          position: 'sticky',
          top: 'var(--sat, 0px)',
          zIndex: 10,
          background: 'rgba(248,250,252,0.72)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(0,0,0,0.07)',
        }}
      >
        <SectionTourLens value={tourLens} onChange={setTourLens} showAllTours />
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
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 800,
              letterSpacing: '0.14em',
              color: AMBER,
              textTransform: 'uppercase',
            }}
          >
            {t('schedule.eyebrow.season')}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: INK_MUTE,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {yearLabel}
          </span>
        </div>

        {/* Progress strip */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: 6,
            }}
          >
            <span
              style={{
                fontSize: 8.5,
                fontWeight: 800,
                letterSpacing: '0.14em',
                color: INK,
                textTransform: 'uppercase',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {t('schedule.progress.eventOf', {
                current: timeline.currentEventNumber ?? '—',
                total: timeline.totalEvents,
              })}
            </span>
          </div>
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
                background: AMBER,
                transition: 'width 240ms ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* TIMELINE — page owns the scroll (no inner scroller). */}
      <div style={{ position: 'relative' }}>
        {timeline.months.map((group) => (
          <section key={group.key}>
            <div
              style={{
                position: 'sticky',
                // Stack flush below sticky chip row (measured); -1px overlap.
                top: 'calc(var(--sat, 0px) + var(--tour-chips-h, 47px) - 1px)',
                zIndex: 2,
                background: 'rgba(248,250,252,0.72)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                padding: '12px 16px 6px',
                fontSize: 10.5,
                fontWeight: 800,
                letterSpacing: '0.14em',
                color: INK_MUTE,
                textTransform: 'uppercase',
                borderBottom: `0.5px solid ${HAIRLINE_INK_10}`,
              }}
            >

              {group.label}
            </div>
            <div>
              {group.events.map((evt) => {
                const isAnchor = evt.id === timeline.anchorEventId;
                return (
                  <div
                    key={evt.id}
                    id={`sv2-row-${evt.id}`}
                  >
                    <SeasonRow
                      event={evt}
                      anchorRef={isAnchor ? anchorRef : undefined}
                      onSelect={onSelectEvent}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        ))}
        <div style={{ paddingBottom: 88 }} />
      </div>

      {/* Floating "This week" chip */}
      {anchorId && !anchorVisible && (
        <button
          type="button"
          onClick={scrollToAnchor}
          style={{
            position: 'sticky',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '9px 16px',
            borderRadius: 999,
            background: INK,
            color: '#FFFFFF',
            border: 'none',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.06em',
            fontFamily: 'inherit',
            cursor: 'pointer',
            boxShadow: '0 6px 18px rgba(15,23,42,0.30)',
            marginTop: -44,
            width: 'max-content',
            marginLeft: 'auto',
            marginRight: 'auto',
            zIndex: 5,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: LIVE_DOT,
              display: 'inline-block',
            }}
          />
          {t('schedule.floating.thisWeek')}
        </button>
      )}

      {/* Silence unused imports */}
      <span aria-hidden style={{ display: 'none', color: INK_FAINT }} />
    </div>
  );
}

export default ScheduleTab;
