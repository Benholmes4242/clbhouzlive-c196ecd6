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
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { useTourSelection } from '../context/TourSelectionContext';
import { TOUR_CONFIG, type TourId } from '../hooks/useOverviewData';
import { TOUR_PRIORITY } from '../_shared/tourOrder';
import { tournamentRoute } from '../routes';
import { TourHubEmptyState } from '../components/TourHubEmptyState';
import { useSeasonTimeline, type SeasonEvent } from './useSeasonTimeline';
import { SeasonRow } from './SeasonRow';
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

const CHIP_SHORT_LABEL: Record<TourId, string> = {
  pga: 'PGA',
  lpga: 'LPGA',
  euro: 'DP WORLD',
  pgad: 'KORN FERRY',
  champ: 'CHAMPIONS',
  liv: 'LIV',
};

export function ScheduleTab() {
  const navigate = useNavigate();
  const scrollRootRef = useRef<HTMLDivElement | null>(null);
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const [anchorVisible, setAnchorVisible] = useState(true);

  // ── Tour selection (app-wide brain) ────────────────────────────────────
  const {
    selectedTourSlug,
    viewingTourSlug,
    selectTour,
  } = useTourSelection();
  const activeTour: TourId = (
    (viewingTourSlug ?? selectedTourSlug ?? 'pga') as string
  ) in TOUR_CONFIG
    ? ((viewingTourSlug ?? selectedTourSlug ?? 'pga') as TourId)
    : 'pga';

  // ── Data ───────────────────────────────────────────────────────────────
  const { data: timeline, isLoading, error } = useSeasonTimeline(activeTour);

  // ── Auto-land on this-week/next row on mount + tour flip ───────────────
  const anchorId = timeline?.anchorEventId ?? null;
  useEffect(() => {
    if (!anchorId) return;
    // Two rAFs to ensure the row is mounted after Suspense/paint.
    let cancelled = false;
    const doScroll = () => {
      if (cancelled) return;
      const el = document.getElementById(`sv2-row-${anchorId}`);
      const root = scrollRootRef.current;
      if (!el || !root) return;
      const rootRect = root.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const offsetInScroller = elRect.top - rootRect.top + root.scrollTop;
      root.scrollTo({
        top: Math.max(0, offsetInScroller - 150),
        behavior: 'auto',
      });
    };
    const r1 = requestAnimationFrame(() =>
      requestAnimationFrame(doScroll),
    );
    return () => {
      cancelled = true;
      cancelAnimationFrame(r1);
    };
  }, [anchorId, activeTour]);

  // ── Floating "This week" chip visibility (IntersectionObserver) ────────
  useEffect(() => {
    const el = anchorRef.current;
    const root = scrollRootRef.current;
    if (!el || !root || !anchorId) {
      setAnchorVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => setAnchorVisible(entry.isIntersecting),
      { root, threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [anchorId, timeline?.totalEvents]);

  const scrollToAnchor = useCallback(() => {
    if (!anchorId) return;
    const el = document.getElementById(`sv2-row-${anchorId}`);
    const root = scrollRootRef.current;
    if (!el || !root) return;
    const rootRect = root.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const offsetInScroller = elRect.top - rootRect.top + root.scrollTop;
    root.scrollTo({
      top: Math.max(0, offsetInScroller - 150),
      behavior: 'smooth',
    });
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
          Couldn't load the schedule
        </h3>
        <p className="text-sm text-muted-foreground max-w-[280px]">
          Something went wrong. Please try again.
        </p>
      </div>
    );
  }
  if (!timeline || timeline.totalEvents === 0) {
    return <TourHubEmptyState variant="schedule" />;
  }

  // ── Chrome ─────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        background: SLATE_50,
        minHeight: '100vh',
        fontFamily: FONT,
        position: 'relative',
      }}
    >
      {/* HEADER */}
      <div style={{ padding: '16px 16px 12px', background: SLATE_50 }}>
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
            THE SEASON
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

        {/* Tour chips */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            paddingBottom: 4,
            marginBottom: 14,
            scrollbarWidth: 'none',
          }}
          className="segmented-scroller"
        >
          {TOUR_PRIORITY.map((slug) => {
            const isActive = slug === activeTour;
            return (
              <button
                key={slug}
                type="button"
                onClick={() => selectTour(slug)}
                aria-pressed={isActive}
                style={{
                  flex: '0 0 auto',
                  padding: '7px 12px',
                  borderRadius: 14,
                  border: isActive
                    ? 'none'
                    : `0.5px solid ${HAIRLINE_INK_10}`,
                  background: isActive ? INK : '#FFFFFF',
                  color: isActive ? '#FFFFFF' : INK,
                  fontFamily: 'inherit',
                  fontSize: 10.5,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  lineHeight: 1,
                }}
              >
                {CHIP_SHORT_LABEL[slug]}
              </button>
            );
          })}
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
              EVENT {timeline.currentEventNumber ?? '—'} OF{' '}
              {timeline.totalEvents}
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

      {/* TIMELINE */}
      <div
        ref={scrollRootRef}
        style={{
          maxHeight: 'calc(100vh - 240px)',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          position: 'relative',
        }}
      >
        {timeline.months.map((group) => (
          <section key={group.key}>
            <div
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 2,
                background: SLATE_50,
                padding: '10px 16px 6px',
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
        <div style={{ paddingBottom: 'calc(var(--sab, 30px) + 24px)' }} />
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
          This week
        </button>
      )}

      {/* Silence unused imports */}
      <span aria-hidden style={{ display: 'none', color: INK_FAINT }} />
    </div>
  );
}

export default ScheduleTab;
