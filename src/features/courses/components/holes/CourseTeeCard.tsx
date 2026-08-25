// Phase L3 - "The course card" block on the course Holes tab.
// Renders NOTHING (null) when the RPC returns [] or is loading/error - the
// tab must look pixel-identical to today for courses with no synced rounds.
// No skeleton for this block.
//
// gender_scope is NEVER rendered as text. It drives the default selection
// only. Tee names ('Red', 'Ladies Red') come from real marker data.
//
// ASCII only. No em dashes in comments (house rule per Phase L2).

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useProfileData } from '@/hooks/useProfileData';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useWhsConnection } from '@/lib/whs/hooks';
import { useCourseTeeSets, type TeeSet } from '../../hooks/useCourseTeeSets';
import { AMBER, INK, INK_MUTE, INK_FAINT, HAIRLINE_INK_8 } from '../../_shared/tokens';
import { FONT } from './_constants';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { A } from './analytical/tokens';

interface Props {
  courseId: string | undefined;
  /**
   * Suppress this card's own kicker + title + collapse affordance when a
   * sheet header already provides them (mirrors CourseRecordBook.hideHeader).
   * Implies always-expanded.
   */
  hideHeader?: boolean;
}

const NUM: React.CSSProperties = {
  fontVariantNumeric: 'tabular-nums',
  fontFeatureSettings: '"tnum" 1, "kern" 1',
};

// Shared grid template for the hole table (header, Row, SubtotalRow). The
// hole-number track may shrink to 40px on narrow devices; the three data
// tracks use minmax(0, 1fr) so they can shrink below their intrinsic content
// width and never push the card past the viewport edge.
const HOLE_GRID_COLUMNS =
  'minmax(40px, 56px) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)';
// Minimum table width when wrapped in the horizontal scroll fallback so
// numbers remain readable at 320dp rather than being crushed together.
const HOLE_TABLE_MIN_WIDTH = 280;

export function storageKey(courseId: string) {
  return `tee-card:${courseId}`;
}

function fmtInt(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '-';
  return Math.round(n).toLocaleString('en-US');
}

function fmtRating(n: number): string {
  return Number.isFinite(n) ? n.toFixed(1) : '-';
}

// -----------------------------------------------------------------------------
// Default tee resolution order (per brief):
//   1) localStorage 'tee-card:{courseId}' if it matches a returned tee_label
//   2) profile gender 'female': first tee with gender_scope='ladies';
//      if none, the SHORTEST ladies-scoped colour tee, else shortest colour tee
//   3) otherwise: the MOST-SAMPLED colour tee
//   4) no colour tees at all: the MOST-SAMPLED entry
// -----------------------------------------------------------------------------
// Comparator: rounds_sampled desc -> total_yards desc -> tee_label asc.
function mostSampled(list: TeeSet[]): TeeSet | undefined {
  if (list.length === 0) return undefined;
  return [...list].sort((a, b) => {
    const r = (b.rounds_sampled ?? 0) - (a.rounds_sampled ?? 0);
    if (r !== 0) return r;
    const y = (b.total_yards ?? 0) - (a.total_yards ?? 0);
    if (y !== 0) return y;
    return a.tee_label.localeCompare(b.tee_label);
  })[0];
}

export function resolveDefaultTee(
  tees: TeeSet[],
  courseId: string,
  gender: string | null | undefined,
): string {
  if (tees.length === 0) return '';
  let stored: string | null = null;
  try {
    stored = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey(courseId)) : null;
  } catch {
    stored = null;
  }
  if (stored && tees.some((t) => t.tee_label === stored)) return stored;

  const colours = tees.filter((t) => t.label_kind === 'colour');

  if (gender === 'female') {
    const ladies = tees.find((t) => t.gender_scope === 'ladies');
    if (ladies) return ladies.tee_label;
    if (colours.length > 0) {
      // Keep "shortest colour tee" intent, scoped to ladies tees where any exist.
      const ladiesColours = colours.filter((t) => t.gender_scope === 'ladies');
      const pool = ladiesColours.length > 0 ? ladiesColours : colours;
      return pool[pool.length - 1].tee_label;
    }
  }

  if (colours.length > 0) return (mostSampled(colours) ?? colours[0]).tee_label;
  return (mostSampled(tees) ?? tees[0]).tee_label;
}


export const CourseTeeCard: React.FC<Props> = ({ courseId, hideHeader = false }) => {
  const { t } = useTranslation(['courses']);
  const { profile } = useProfileData();
  const { user } = useSupabaseSession();
  const { data: connection } = useWhsConnection(user?.id);
  const { data, isLoading, isError } = useCourseTeeSets(courseId);

  const tees = useMemo<TeeSet[]>(() => data ?? [], [data]);
  const [selected, setSelected] = useState<string>('');
  const [specialOpen, setSpecialOpen] = useState(false);
  const [viewedFired, setViewedFired] = useState(false);
  // Always starts collapsed on mount. Not persisted across sessions.
  const [expanded, setExpandedRaw] = useState(false);
  // hideHeader (sheet mount) has no collapse affordance, so it is always open.
  const setExpanded = setExpandedRaw;
  const isOpen = hideHeader || expanded;
  const [reducedMotion, setReducedMotion] = useState(false);
  const panelId = React.useId();

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = () => setReducedMotion(mq.matches);
    handler();
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  // Reset collapsed state whenever the course changes.
  useEffect(() => {
    setExpanded(false);
  }, [courseId]);

  // Resolve default once tees are available (or courseId/profile changes).
  useEffect(() => {
    if (!courseId || tees.length === 0) return;
    setSelected((prev) => {
      if (prev && tees.some((t) => t.tee_label === prev)) return prev;
      return resolveDefaultTee(tees, courseId, profile?.gender ?? null);
    });
  }, [courseId, tees, profile?.gender]);

  // Fire tee_card_viewed once per mount when tee sets are non-empty.
  useEffect(() => {
    if (viewedFired) return;
    if (!courseId || tees.length === 0) return;
    setViewedFired(true);
    analyticsEvents.track('tee_card_viewed', {
      course_id: courseId,
      tees: tees.length,
    });
  }, [courseId, tees.length, viewedFired]);

  // Contract: render null for empty / loading / error. Tab must be
  // pixel-identical to today for courses with no synced rounds.
  if (isLoading || isError) return null;
  if (!courseId || tees.length === 0) return null;

  const active = tees.find((t) => t.tee_label === selected) ?? tees[0];
  const colours = tees.filter((t) => t.label_kind === 'colour');
  const specials = tees.filter((t) => t.label_kind === 'special');

  const handlePick = (label: string) => {
    if (label === selected) return;
    setSelected(label);
    try {
      window.localStorage.setItem(storageKey(courseId), label);
    } catch {
      // ignore
    }
    analyticsEvents.track('tee_card_tee_changed', {
      course_id: courseId,
      tee_label: label,
    });
  };

  const toggleExpanded = () => {
    setExpanded((prev) => {
      const next = !prev;
      if (next) {
        // Fire on each expand (line: tee_card_expanded event).
        analyticsEvents.track('tee_card_expanded', {
          course_id: courseId,
          tee_label: active.tee_label,
        });
      }
      return next;
    });
  };

  const front9 = active.holes.filter((h) => h.hole_no <= 9);
  const back9 = active.holes.filter((h) => h.hole_no > 9);
  const outYards = front9.reduce((s, h) => s + (h.yards || 0), 0);
  const outPar = front9.reduce((s, h) => s + (h.par || 0), 0);
  const inYards = back9.reduce((s, h) => s + (h.yards || 0), 0);
  const inPar = back9.reduce((s, h) => s + (h.par || 0), 0);
  const totalYards = active.total_yards ?? outYards + inYards;

  const subhead = t('courses:teeCard.subhead', {
    tee: active.tee_label,
    yards: fmtInt(totalYards),
  });

  return (
    <section
      style={{
        padding: '14px 16px 8px',
        fontFamily: FONT,
        background: A.CANVAS,
        // minWidth:0 is the load-bearing rule here: without it a flex/grid
        // child defaults to min-width:auto and will happily push its parent
        // past the viewport regardless of maxWidth. maxWidth:100% then caps
        // the card at its container so it can never overflow the page.
        minWidth: 0,
        maxWidth: '100%',
        overflow: 'hidden',
      }}
      aria-label={t('courses:teeCard.a11yBlock') as string}
    >
      {/* Collapsible header (toggle button) - owned by the sheet when hidden */}
      {!hideHeader && (
      <button
        type="button"
        onClick={toggleExpanded}
        aria-expanded={expanded}
        aria-controls={panelId}
        aria-label={t('courses:teeCard.a11yToggle') as string}
        style={{
          display: 'block',
          width: '100%',
          background: 'transparent',
          border: 0,
          padding: 0,
          textAlign: 'left',
          cursor: 'pointer',
          color: 'inherit',
          font: 'inherit',
        }}
      >
        {/* Eyebrow */}
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: AMBER,
            marginBottom: 6,
          }}
        >
          {t('courses:teeCard.eyebrow')}
        </div>

        {/* Title + chevron */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 13,
              fontWeight: 700,
              color: INK,
              ...NUM,
            }}
          >
            {subhead}
          </div>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke={INK_MUTE}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{
              flexShrink: 0,
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: reducedMotion ? 'none' : 'transform 220ms ease',
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        {/* Compact stat strip: PAR / CR / SLOPE only (yards is in title).
            Hidden when expanded — the four-up row below owns the trio then. */}
        {!isOpen && (
        <div
          style={{
            display: 'grid',
            // minmax(0, 1fr) lets columns shrink below their content width so
            // long localized labels / large numbers cannot push the row past
            // the card edge. Cells below opt in with minWidth:0 so they can
            // truncate cleanly inside their track.
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 8,
            padding: '10px 12px',
            border: `1px solid ${HAIRLINE_INK_8}`,
            borderRadius: 10,
          }}
        >
          {[
            { k: t('courses:teeCard.stat.par'), v: fmtInt(active.par_total) },
            { k: t('courses:teeCard.stat.cr'), v: fmtRating(active.course_rating) },
            { k: t('courses:teeCard.stat.slope'), v: fmtInt(active.slope_rating) },
          ].map((cell) => (
            <div key={cell.k as string} style={{ textAlign: 'center', minWidth: 0 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: INK_FAINT,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {cell.k}
              </div>
              <div
                style={{
                  // Clamp so a 5-digit yardage / long value never clips the
                  // number. Labels may ellipsis (above); values never do.
                  fontSize: 'clamp(13px, 3.6vw, 15px)',
                  fontWeight: 700,
                  color: INK,
                  marginTop: 2,
                  whiteSpace: 'nowrap',
                  ...NUM,
                }}
              >
                {cell.v}
              </div>
            </div>
          ))}
        </div>
        )}

      </button>
      )}

      {/* Collapsible panel */}
      <div
        id={panelId}
        style={{
          display: 'grid',
          gridTemplateRows: isOpen ? '1fr' : '0fr',
          transition: reducedMotion ? 'none' : 'grid-template-rows 220ms ease',
          overflow: 'hidden',
          minWidth: 0,
          maxWidth: '100%',
        }}
      >
        <div style={{ minHeight: 0, minWidth: 0, maxWidth: '100%' }} aria-hidden={!isOpen}>
          <div style={{ height: 12 }} />

          {/* Colour tee pills — horizontal carousel with edge fades. */}
          <TeePillsRow
            tees={colours}
            activeLabel={active.tee_label}
            onPick={handlePick}
            ariaLabel={t('courses:teeCard.a11yPills') as string}
            reducedMotion={reducedMotion}
          />

          {/* Sync prompt for viewers without a WHS connection. */}
          {!connection && (
            <div
              role="note"
              style={{
                background: 'rgba(247,147,30,0.06)',
                border: '1px solid rgba(247,147,30,0.20)',
                borderRadius: 12,
                padding: '12px 14px',
                marginBottom: 12,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: INK, marginBottom: 4 }}>
                {t('courses:teeCard.syncNote.heading')}
              </div>
              <div style={{ fontSize: 12.5, color: INK_MUTE, lineHeight: 1.5 }}>
                {t('courses:teeCard.syncNote.body')}
              </div>
            </div>
          )}

          {/* Special / competition tees disclosure */}
          {specials.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <button
                type="button"
                onClick={() => setSpecialOpen((v) => !v)}
                style={{
                  background: 'transparent',
                  border: 0,
                  padding: 0,
                  color: INK_MUTE,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                aria-expanded={specialOpen}
              >
                {t('courses:teeCard.competitionTees', { count: specials.length })}
              </button>
              {specialOpen && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                  {specials.map((tee) => {
                    const isActive = tee.tee_label === active.tee_label;
                    return (
                      <button
                        key={tee.tee_label}
                        type="button"
                        onClick={() => handlePick(tee.tee_label)}
                        aria-pressed={isActive}
                        style={{
                          minHeight: 44,
                          padding: '0 14px',
                          borderRadius: 999,
                          border: `1px solid ${isActive ? INK : HAIRLINE_INK_8}`,
                          background: isActive ? INK : A.PANEL,
                          color: isActive ? A.CANVAS : INK,
                          fontSize: 13,
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                          cursor: 'pointer',
                          ...NUM,
                        }}
                      >
                        {tee.tee_label} {fmtInt(tee.total_yards ?? 0)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Full summary strip (includes yards) */}
          <div
            style={{
              display: 'grid',
              // minmax(0, 1fr) is the fix: plain 1fr = minmax(auto, 1fr) which
              // refuses to shrink below content width, so PAR/CR/SLOPE/YARDS
              // spilled past the card at 390dp. minmax(0, 1fr) lets tracks
              // shrink; cells opt in with minWidth:0 below.
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: 8,
              padding: '10px 12px',
              border: `1px solid ${HAIRLINE_INK_8}`,
              borderRadius: 10,
              marginBottom: 12,
            }}
          >
            {[
              { k: t('courses:teeCard.stat.par'), v: fmtInt(active.par_total) },
              { k: t('courses:teeCard.stat.cr'), v: fmtRating(active.course_rating) },
              { k: t('courses:teeCard.stat.slope'), v: fmtInt(active.slope_rating) },
              { k: t('courses:teeCard.stat.yards'), v: fmtInt(totalYards) },
            ].map((cell) => (
              <div key={cell.k as string} style={{ textAlign: 'center', minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: INK_FAINT,
                    // Labels may truncate with an ellipsis at narrow widths;
                    // values (below) never do — a clipped number is worse
                    // than a clipped label.
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {cell.k}
                </div>
                <div
                  style={{
                    // Value scales with viewport so 4- and 5-digit yardages
                    // stay fully readable at 320-390dp. Never truncates.
                    fontSize: 'clamp(13px, 3.6vw, 15px)',
                    fontWeight: 700,
                    color: INK,
                    marginTop: 2,
                    whiteSpace: 'nowrap',
                    ...NUM,
                  }}
                >
                  {cell.v}
                </div>
              </div>
            ))}
          </div>


          {/* Holes table — wrapped in a horizontal scroll container so at
              very narrow widths (320dp) the table can scroll internally
              without ever dragging the page or the card sideways. */}
          <style>{`.tee-holes-scroll::-webkit-scrollbar{display:none}`}</style>
          <div
            className="tee-holes-scroll"
            style={{
              maxWidth: '100%',
              minWidth: 0,
              overflowX: 'auto',
              overflowY: 'hidden',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              overscrollBehaviorX: 'contain',
              borderRadius: 10,
            }}
          >
          <div
            role="table"
            aria-label={t('courses:teeCard.a11yTable') as string}
            style={{
              border: `1px solid ${HAIRLINE_INK_8}`,
              borderRadius: 10,
              overflow: 'hidden',
              minWidth: HOLE_TABLE_MIN_WIDTH,
            }}
          >
            <div
              role="row"
              style={{
                display: 'grid',
                gridTemplateColumns: HOLE_GRID_COLUMNS,
                padding: '8px 12px',
                background: A.PANEL,
                borderBottom: `1px solid ${HAIRLINE_INK_8}`,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: INK_FAINT,
              }}
            >
              <div>{t('courses:teeCard.col.hole')}</div>
              <div style={{ textAlign: 'right' }}>{t('courses:teeCard.col.par')}</div>
              <div style={{ textAlign: 'right' }}>{t('courses:teeCard.col.si')}</div>
              <div style={{ textAlign: 'right' }}>{t('courses:teeCard.col.yards')}</div>
            </div>

            {front9.map((h) => (
              <Row key={h.hole_no} h={h} />
            ))}

            <SubtotalRow
              label={t('courses:teeCard.out') as string}
              par={outPar}
              yards={outYards}
            />

            {back9.map((h) => (
              <Row key={h.hole_no} h={h} />
            ))}

            <SubtotalRow
              label={t('courses:teeCard.in') as string}
              par={inPar}
              yards={inYards}
            />

            <SubtotalRow
              label={t('courses:teeCard.total') as string}
              par={active.par_total}
              yards={totalYards}
            />
          </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// -----------------------------------------------------------------------------
// TeePillsRow — horizontal chip carousel for colour tees.
//
// Fixes the "Yellow chip clips mid-word" bug at Hanbury Manor (4+ tees):
//   - flexShrink:0 on every chip so chips keep their natural width and the
//     ROW scrolls instead of the chips squeezing.
//   - Native horizontal overflow scroll; no snap so swipes feel continuous.
//   - No edge fades — the row sits flush against the viewport edges.
//   - Scrollbar hidden via a scoped ::-webkit-scrollbar rule (no global
//     leakage). Keyboard/AT scrollability is preserved.
//   - Active chip is scrolled into view on mount and on active-change so a
//     user whose default tee is the 5th chip does not have to hunt for it.
// -----------------------------------------------------------------------------
const TeePillsRow: React.FC<{
  tees: TeeSet[];
  activeLabel: string;
  onPick: (label: string) => void;
  ariaLabel: string;
  reducedMotion: boolean;
}> = ({ tees, activeLabel, onPick, ariaLabel, reducedMotion }) => {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const chipRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const dragStateRef = useRef<{
    startX: number;
    startY: number;
    startScrollLeft: number;
    axis: 'x' | 'y' | null;
    dragged: boolean;
  }>({ startX: 0, startY: 0, startScrollLeft: 0, axis: null, dragged: false });
  const suppressNextClickRef = useRef(false);
  const rawId = React.useId();
  // useId returns a string containing ':' which is invalid in CSS class
  // selectors; sanitize before injecting into the scoped <style>.
  const scrollerClass = `tee-pills-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  // Native horizontal overflow scrolling can be swallowed by the course page's
  // vertical scroll container on iOS when the gesture starts on a button. Own
  // horizontal drags here, while leaving vertical drags to the page.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    let clickTimer: number | null = null;

    const clearClickSuppression = () => {
      if (clickTimer != null) window.clearTimeout(clickTimer);
      clickTimer = window.setTimeout(() => {
        suppressNextClickRef.current = false;
        clickTimer = null;
      }, 180);
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      const touch = event.touches[0];
      dragStateRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startScrollLeft: el.scrollLeft,
        axis: null,
        dragged: false,
      };
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      const touch = event.touches[0];
      const state = dragStateRef.current;
      const deltaX = touch.clientX - state.startX;
      const deltaY = touch.clientY - state.startY;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (!state.axis) {
        if (absX < 6 && absY < 6) return;
        state.axis = absX > absY + 4 ? 'x' : 'y';
      }

      if (state.axis !== 'x') return;

      event.preventDefault();
      event.stopPropagation();
      el.scrollLeft = state.startScrollLeft - deltaX;
      state.dragged = true;
    };

    const handleTouchEnd = () => {
      if (dragStateRef.current.dragged) {
        suppressNextClickRef.current = true;
        clearClickSuppression();
      }
      dragStateRef.current.axis = null;
      dragStateRef.current.dragged = false;
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });
    el.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      if (clickTimer != null) window.clearTimeout(clickTimer);
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []);

  // Bring the active chip into view on mount and when it changes.
  useEffect(() => {
    const btn = chipRefs.current.get(activeLabel);
    if (!btn) return;
    btn.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  }, [activeLabel, reducedMotion, tees.length]);

  return (
    <div style={{ position: 'relative', marginBottom: 12 }}>
      <style>{`.${scrollerClass}::-webkit-scrollbar{display:none}`}</style>
      <div
        ref={scrollerRef}
        className={scrollerClass}
        role="tablist"
        aria-label={ariaLabel}
        style={{
          display: 'flex',
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          gap: 8,
          overflowX: 'auto',
          overflowY: 'hidden',
          paddingBottom: 4,
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          // Let vertical swipes keep scrolling the page; horizontal swipes are
          // owned by the manual drag handler above for reliable iOS carousels.
          touchAction: 'pan-y pinch-zoom',
          overscrollBehaviorX: 'contain',
        }}
      >
        {tees.map((tee) => {
          const isActive = tee.tee_label === activeLabel;
          return (
            <button
              key={tee.tee_label}
              ref={(node) => {
                if (node) chipRefs.current.set(tee.tee_label, node);
                else chipRefs.current.delete(tee.tee_label);
              }}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={(event) => {
                if (suppressNextClickRef.current) {
                  event.preventDefault();
                  event.stopPropagation();
                  return;
                }
                onPick(tee.tee_label);
              }}
              style={{
                // flexShrink:0 keeps the chip at its natural width so the row
                // scrolls instead of chips squeezing mid-word.
                flexShrink: 0,
                minHeight: 44,
                padding: '0 14px',
                borderRadius: 999,
                border: `1px solid ${isActive ? INK : HAIRLINE_INK_8}`,
                background: isActive ? INK : A.PANEL,
                color: isActive ? A.CANVAS : INK,
                fontSize: 13,
                fontWeight: 700,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                ...NUM,
              }}
            >
              {tee.tee_label} {fmtInt(tee.total_yards ?? 0)}
            </button>
          );
        })}
      </div>
    </div>
  );
};



const Row: React.FC<{ h: { hole_no: number; par: number; si: number; yards: number } }> = ({ h }) => (
  <div
    role="row"
    style={{
      display: 'grid',
      gridTemplateColumns: HOLE_GRID_COLUMNS,
      padding: '8px 12px',
      background: A.CANVAS,
      fontSize: 13,
      color: INK,
      ...NUM,
    }}
  >
    <div style={{ fontWeight: 700 }}>{h.hole_no}</div>
    <div style={{ textAlign: 'right' }}>{h.par || '-'}</div>
    {/* SI is reference data, not a headline — quieter than PAR and YARDS. */}
    <div style={{ textAlign: 'right', color: INK_MUTE }}>{h.si || '-'}</div>
    <div style={{ textAlign: 'right' }}>{h.yards ? h.yards.toLocaleString('en-US') : '-'}</div>
  </div>
);


const SubtotalRow: React.FC<{ label: string; par: number; yards: number }> = ({ label, par, yards }) => (
  <div
    role="row"
    style={{
      display: 'grid',
      gridTemplateColumns: HOLE_GRID_COLUMNS,
      padding: '8px 12px',
      background: A.PANEL,
      borderTop: `1px solid ${HAIRLINE_INK_8}`,
      fontSize: 13,
      fontWeight: 700,
      color: INK,
      ...NUM,
    }}
  >
    <div style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</div>
    <div style={{ textAlign: 'right' }}>{par || '-'}</div>
    <div style={{ textAlign: 'right' }} aria-hidden="true"></div>
    <div style={{ textAlign: 'right' }}>{yards ? yards.toLocaleString('en-US') : '-'}</div>
  </div>
);

export default CourseTeeCard;
