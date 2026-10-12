/**
 * ProfileSheetV2 · HcpStrip — the 90-day index trend card.
 *
 * ONE SUBJECT (the index), ONE INTERACTION (scrub the window), and a
 * zone-graded plot that carries colour rather than whispering it. The old
 * three-figure strip (HANDICAP / ROUNDS / INDEX MOVE) is gone; ROUNDS is
 * dropped entirely.
 *
 * THE AXIS IS NATURAL, NOT INVERTED. High index at the TOP, low at the
 * BOTTOM, so an improving index FALLS. Golfers say "I got my handicap DOWN
 * to 2" — a DIP IS A GOOD SPELL. Do not flip this on the theory that
 * "up = good"; it makes the values count backwards.
 *
 * COLOUR is INDEX_DELTA.light, via A.IMPROVED / A.DRIFTED. The index delta is
 * a MOVEMENT, not a score: never TOPAR_RED, never A.RED / A.GREEN, and never
 * the dark pair, which fails on white.
 *
 * GATING. A disabled React Query v5 query is PENDING with fetchStatus 'idle',
 * so `isLoading` is FALSE before it has ever run. Gating the connected /
 * unconnected choice on `!isLoading` reads `connection === undefined` as
 * "disconnected" and flashes the CONNECT card at a connected member on every
 * mount. We gate on isFetched, exactly as ChromeIsland:230-246 documents, and
 * while unsettled render NOTHING — no skeleton, no reserved height.
 *
 * Both states are the SAME HEIGHT, so connecting does not make the sheet
 * below jump.
 *
 * NO SAMPLE DATA ON THE UNCONNECTED CARD. EVER. (BRIEF_ACCOUNT_SHEET_REBUILD A)
 * This card previously drew an eight-point hardcoded "sample improving trend"
 * under a WORST/MID/BEST key. A line with a legend is a READING, and there was
 * nothing to read; roughly four in five accounts have no handicap, so the
 * invented version was the version most members saw. It also ran the wrong way
 * on this file's own axis, which is how it was caught.
 *
 * THE CLASS OF FAULT: a state we cannot describe rendered as one we can. If the
 * unconnected card ever needs more weight, use a treatment that CANNOT be
 * mistaken for data — a flat field, a mark, or nothing. Never a shape that
 * resembles a trace, and never an axis or a key. Decoration acquiring a key is
 * the whole failure. Do not reintroduce a sample trend as a nice touch.
 */


import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IndexMovementTriangle } from '@/components/explore-tab-new/friendRoundParts';
import { handicapSentence, formatIndex, INDEX_DOOR_ROUTE } from '../sheetState';
import { Door } from './sheetCardParts';
import FormSection from './FormSection';
import type { FormBar } from '../sheetState';
import { A, KICKER, LABEL, FIGS, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { formatDayMonthShortGB } from '@/i18n/format';
import { HcpTrendChart } from '@/components/profile/handicap/whs/charts';


// ---------------------------------------------------------------------------
// Fixed geometry. The two states share every band so the card cannot change
// height when a member connects.
// ---------------------------------------------------------------------------
const CARD_RADIUS = 14;
const HEADER_H = 26;
const FIGURE_H = 46;
const PLOT_H = 96;
const LEGEND_H = 18;
const PAD = 14;


interface Point { t: string; v: number }

/* BRIEF_ACCOUNT_SHEET_REBUILD A/B — the local `zoneColor`, the local
   `smoothPath` alias and `LegendSwatch` are gone from this file. The zone
   colouring lives in HcpTrendChart, which owns the connected plot; the only
   consumers here were the removed sample curve and the removed WORST/MID/BEST
   key. Do not reintroduce either: a curve in this file has no data behind it. */





// ---------------------------------------------------------------------------
// Shell — owns the border, the radius and the band heights. The plot is handed
// the full inner width so it can run EDGE TO EDGE to the card's own border.
// ---------------------------------------------------------------------------
const Shell: React.FC<{
  header: React.ReactNode;
  figure: React.ReactNode;
  plot: (width: number) => React.ReactNode;
  legend?: React.ReactNode;
  onClick?: () => void;
  plotRef?: React.Ref<HTMLDivElement>;
  plotHandlers?: React.HTMLAttributes<HTMLDivElement>;
}> = ({ header, figure, plot, legend, onClick, plotRef, plotHandlers }) => {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div data-card="handicap" style={{ margin: '0 20px 9px', fontFamily: SANS }}>
      <div
        ref={outerRef}
        onClick={onClick}
        style={{
          background: A.PANEL,
          border: `1px solid ${A.BORDER}`,
          borderRadius: CARD_RADIUS,
          overflow: 'hidden',
          cursor: onClick ? 'pointer' : 'default',
        }}
      >
        <div style={{ padding: `${PAD}px ${PAD}px 0` }}>
          <div
            style={{
              height: HEADER_H,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            {header}
          </div>
          <div style={{ height: FIGURE_H, display: 'flex', alignItems: 'center', gap: 10 }}>
            {figure}
          </div>
        </div>
        <div
          ref={plotRef}
          style={{ height: PLOT_H, position: 'relative', touchAction: 'none' }}
          {...plotHandlers}
        >
          {width > 0 && plot(width)}
        </div>
        <div
          style={{
            /* minHeight, not height: the connected caption line wraps at
               narrow widths and a fixed 18px band clipped it (the card sets
               overflow hidden). Both states share this band, so parity of
               card height between connected and unconnected is unaffected. */
            minHeight: LEGEND_H,
            display: 'flex',
            padding: `0 ${PAD}px`,
            marginBottom: PAD - 4,
          }}
        >
          {legend}
        </div>
      </div>
    </div>
  );
};



// ---------------------------------------------------------------------------
// The connected card.
// ---------------------------------------------------------------------------
export const TrendCard: React.FC<{
  points: Point[];
  windowDays: 30 | 90;
  onWindow: (d: 30 | 90) => void;
  fallbackIndex: number | null;
  onNavigate: (route: string) => void;
  /** V6 D — the last five rounds live inside this card, below a full-bleed rule. */
  bars?: FormBar[];
}> = ({ points, windowDays, onWindow, fallbackIndex, onNavigate, bars = [] }) => {
  // C.2 — the sentence reads the SAME points the chart draws, so it moves with the toggle.
  const sentence = useMemo(() => handicapSentence(points, windowDays), [points, windowDays]);
  const [scrub, setScrub] = useState<number | null>(null);
  const plotRef = useRef<HTMLDivElement | null>(null);
  const dragging = useRef(false);

  const n = points.length;
  const active = scrub == null ? n - 1 : Math.min(Math.max(scrub, 0), n - 1);

  // Delta: last minus first across the window. Unchanged arithmetic.
  const delta = n >= 2 ? points[n - 1].v - points[0].v : null;
  const deltaTone = delta == null || Math.abs(delta) < 0.05
    ? A.DIM
    : delta < 0 ? A.IMPROVED : A.DRIFTED;
  // Chart tone: the SAME direction test, read from deltaTone so the rule has
  // one home. The ONE deliberate difference: flat/unknown is A.DIM for the
  // chip (right for text) but A.MUTE for the chart, because a 2.2px stroke
  // and a gradient in A.DIM are near-invisible on this canvas. Intentional.
  // This makes the chart change colour between 30D and 90D when the index
  // moved in opposite directions over those windows — both are true.
  const chartTone = deltaTone === A.DIM ? A.MUTE : deltaTone;

  const headIndex = n > 0 ? points[active].v : fallbackIndex;
  const headDate = n > 0 ? formatDayMonthShortGB(points[active].t) : null;

  const moveTo = useCallback((clientX: number) => {
    const el = plotRef.current;
    if (!el || n < 2) return;
    const r = el.getBoundingClientRect();
    const ratio = (clientX - r.left) / Math.max(1, r.width);
    setScrub(Math.round(Math.min(1, Math.max(0, ratio)) * (n - 1)));
  }, [n]);

  // Move and up listeners live on WINDOW, not the element — otherwise the
  // scrub drops the moment a thumb leaves the plot bounds. Release does NOT
  // reset: the member can park the marker on any revision.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      e.preventDefault();
      moveTo(e.clientX);
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [moveTo]);

  // The window changed under us — park back on the latest revision.
  useEffect(() => { setScrub(null); }, [windowDays, n]);

  const stats = useMemo(() => {
    if (n === 0) return null;
    const vals = points.map((p) => p.v);
    return { best: Math.min(...vals), worst: Math.max(...vals) };
  }, [points, n]);

  return (
    <Shell
      plotRef={plotRef}
      plotHandlers={{
        onPointerDown: (e) => {
          if (n < 2) return;
          dragging.current = true;
          moveTo(e.clientX);
        },
      }}
      header={
        <>
          <span style={KICKER}>How you&rsquo;re playing</span>
          <span style={{ display: 'inline-flex', gap: 2, background: A.TRACK, borderRadius: 7, padding: 2 }}>
            {([30, 90] as const).map((d) => {
              const on = windowDays === d;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => onWindow(d)}
                  style={{
                    border: 'none',
                    background: on ? A.PANEL : 'transparent',
                    borderRadius: 5,
                    padding: '3px 9px',
                    fontFamily: SANS,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: on ? A.INK : A.DIM,
                    boxShadow: on ? `0 1px 2px ${A.BORDER}` : 'none',
                    cursor: 'pointer',
                  }}
                >
                  {d}D
                </button>
              );
            })}
          </span>
        </>
      }
      figure={
        <>
          <span
            style={{
              fontSize: 36,
              fontWeight: 700,
              letterSpacing: '-0.05em',
              color: A.INK,
              lineHeight: 1,
              ...FIGS,
            }}
          >
            {headIndex != null ? formatIndex(headIndex) : '\u2014'}
          </span>
          {headDate && <span style={{ ...LABEL, paddingBottom: 2 }}>{headDate}</span>}
          {delta != null && (
            <span
              style={{
                marginLeft: 'auto',
                borderRadius: 999,
                padding: '4px 10px',
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '-0.01em',
                ...FIGS,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                background:
                  deltaTone === A.IMPROVED
                    ? 'rgba(15,143,74,0.14)'
                    : deltaTone === A.DRIFTED
                      ? 'rgba(200,55,43,0.14)'
                      : 'rgba(162,169,178,0.14)',
                border: `1px solid ${
                  deltaTone === A.IMPROVED
                    ? 'rgba(15,143,74,0.28)'
                    : deltaTone === A.DRIFTED
                      ? 'rgba(200,55,43,0.28)'
                      : 'rgba(162,169,178,0.28)'
                }`,
                color: deltaTone,
                boxShadow: `0 2px 8px ${deltaTone}26`,
              }}
            >
              {Math.abs(delta) >= 0.05 && (
                <IndexMovementTriangle
                  direction={delta < 0 ? 'down' : 'up'}
                  color={deltaTone}
                  size={7}
                />
              )}
              {Math.abs(delta).toFixed(1)}
            </span>
          )}
        </>
      }
      plot={(w) => (
        <HcpTrendChart
          points={points}
          active={active}
          showCrosshair={scrub != null}
          width={w}
          height={PLOT_H}
          simplified
          tone={chartTone}
        />
      )}
      legend={
        <div style={{ width: '100%' }}>
          {sentence && (
            <div data-hcp-sentence style={{ fontSize: 12.5, lineHeight: 1.4, color: A.MUTE, marginTop: 9 }}>
              {sentence.map((s, i) => s.bold
                ? <b key={i} style={{ color: A.INK, fontWeight: 700 }}>{s.text}</b>
                : <React.Fragment key={i}>{s.text}</React.Fragment>)}
            </div>
          )}
          {bars.length >= 2 && (
            <>
              {/* Full-bleed: the legend band pads PAD each side, so -PAD reaches the card's inner edges. */}
              <div data-form-rule style={{ height: 1, background: A.TRACK, margin: `12px -${PAD}px 11px` }} />
              <FormSection bars={bars} />
            </>
          )}
          <Door label="View handicap" onClick={() => onNavigate(INDEX_DOOR_ROUTE)} />
        </div>
      }
    />
  );
};

