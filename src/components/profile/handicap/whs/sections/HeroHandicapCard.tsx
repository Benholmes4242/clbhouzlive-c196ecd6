import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, ArrowDown, ArrowUp, Flame, Minus, Snowflake } from 'lucide-react';
import { useHandicapHistory, useHandicapTrend, useAllScores } from '@/lib/whs/hooks';
import { whsDisplayedHcp, formatDisplayedHcp, fmtDiff } from '@/lib/whs/format';
import type { WhsConnection, HandicapPoint } from '@/lib/whs/types';
import { openTrophiesSheet } from '../trophiesSheetEvents';
import { predictHandicap } from './trends/predictHandicap';

interface Props {
  connection: WhsConnection;
}

type Range = 30 | 365 | 'all';

// FORM ring temperature colours — only used by the FORM ring
const FORM_HOT = '#E11D48';   // crimson, reads as red-hot
const FORM_COLD = '#38BDF8';  // ice blue

// ── Tokens ────────────────────────────────────────────────────────────────
const AMBER = '#F7931E';
const AMBER_DEEP = '#C97211';
const INK = '#0F172A';
const INK_55 = 'rgba(15,23,42,0.55)';
const INK_40 = 'rgba(15,23,42,0.40)';
const INK_10 = 'rgba(15,23,42,0.10)';
const INK_06 = 'rgba(15,23,42,0.06)';
const INK_04 = 'rgba(15,23,42,0.04)';
const GREEN = '#4ADE80';
const RED = '#B91C1C';                     // ember red — slightly deeper/more luminous than #9F1D1D
const RED_FORM_HOT = '#B91C1C';            // unchanged
const RING_TRACK = 'rgba(15,23,42,0.10)';  // deeper than INK_06 — track reads as a real ring
const COLD_BLUE = '#0284C7';               // deep cyan — replaces #0EA5E9
const SCORING_BLUE = '#3B82F6';            // kept as the gradient end stop (start is darker)
const SCORING_BLUE_DEEP = '#1D4ED8';       // royal blue gradient start
const MOMENTUM_GREEN_DEEP = '#047857';     // forest gradient start (was #15803D)
const MOMENTUM_GREEN_BRIGHT = '#10B981';   // forest gradient end (was #4ADE80)

const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const FONT_DISPLAY = 'SF Pro Display, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

// Hero ring (responsive — viewBox is fixed coordinate space, rendered size is clamp())
const HERO_VIEWBOX = 200;
const CX = HERO_VIEWBOX / 2;
const CY = HERO_VIEWBOX / 2;
const R_INNER = 70;
const STROKE_INNER = 5;
const C_INNER = 2 * Math.PI * R_INNER;
// Legacy constant kept only for the loading skeleton placeholder
const RING_SIZE = 162;
const INK_25 = 'rgba(15,23,42,0.25)';
const INK_70 = 'rgba(15,23,42,0.70)';

// Sparkline
const W = 340;
const H = 110;
const PAD_TOP = 22;
const PAD_BOTTOM = 22;
const PAD_LEFT = 14;
const PAD_RIGHT = 14;

// ── Milestone progress ────────────────────────────────────────────────────
function calcMilestoneProgress(h: number) {
  const displayed = whsDisplayedHcp(h);
  const windowTop = displayed + 0.4;
  const windowBottom = displayed - 0.5;
  const progress = (windowTop - h) / (windowTop - windowBottom);
  return {
    displayed,
    windowTop,
    windowBottom,
    progress: Math.max(0, Math.min(1, progress)),
  };
}

// ── Form calculation ──────────────────────────────────────────────────────
function calcForm(hcp: number, last5Diffs: number[]) {
  if (last5Diffs.length === 0) {
    return { formStrokes: 0, fillFraction: 0, direction: 'neutral' as const };
  }
  const avg = last5Diffs.reduce((s, v) => s + v, 0) / last5Diffs.length;
  const formStrokes = hcp - avg;
  const capped = Math.max(-2, Math.min(2, formStrokes));
  const fillFraction = Math.abs(capped) / 2;
  return {
    formStrokes,
    fillFraction,
    direction:
      formStrokes > 0.05 ? ('positive' as const)
      : formStrokes < -0.05 ? ('negative' as const)
      : ('neutral' as const),
  };
}

// ── Monthly movement calculation (replaces form for inner ring) ─────────
function calcMonthlyMovement(delta: number | null) {
  if (delta == null) {
    return { delta: null, fillFraction: 0, direction: 'neutral' as const };
  }
  const capped = Math.max(-1, Math.min(1, delta));
  const fillFraction = Math.abs(capped);
  return {
    delta,
    fillFraction,
    direction:
      delta < -0.05 ? ('cut' as const)
      : delta > 0.05 ? ('up' as const)
      : ('neutral' as const),
  };
}

/**
 * Maps form strokes to a 5-tier state label. Same ladder across all
 * ranges — the user's "FORM" is always one of these five words.
 */
function formStateLabel(formStrokes: number): { title: string; sub: string } {
  // Display sign convention: negative = below handicap (good), positive
  // = above handicap (bad). Internal formStrokes uses the opposite sign
  // (positive = hot) for ring-fill math, so negate for display only.
  const display = -formStrokes;
  const sign = display >= 0 ? '+' : '\u2212';
  const subStr = `${sign}${Math.abs(display).toFixed(1)} vs handicap`;

  if (formStrokes > 1.0) return { title: 'RED HOT FORM', sub: subStr };
  if (formStrokes > 0.1) return { title: 'WARM FORM', sub: subStr };
  if (formStrokes < -1.0) return { title: 'OUT OF FORM', sub: subStr };
  if (formStrokes < -0.1) return { title: 'COLD FORM', sub: subStr };
  return { title: 'STEADY', sub: 'On handicap' };
}

const HeroHandicapCard: React.FC<Props> = ({ connection }) => {
  const [range, setRange] = useState<Range>(30);
  const [scrubIdx, setScrubIdx] = useState<number | null>(null);
  const [drawn, setDrawn] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const { data: trend, isLoading: trendLoading } = useHandicapTrend(connection.id);
  const { data: history, isLoading: historyLoading } = useHandicapHistory(connection.id, range);
  const { data: recent } = useAllScores(connection.id);


  const current = trend?.current ?? null;
  const points: HandicapPoint[] = history ?? [];

  // Date-windowed slice of all rounds for the active range. Drives FORM,
  // SCORING AVG, and the round counts in sub-labels.
  const rangeFilteredScores = useMemo(() => {
    if (!recent) return [] as any[];
    if (range === 'all') return recent as any[];
    const cutoff = Date.now() - range * 24 * 60 * 60 * 1000;
    return (recent as any[]).filter((r: any) => {
      if (!r?.play_date) return false;
      const ts = new Date(r.play_date).getTime();
      return Number.isFinite(ts) && ts >= cutoff;
    });
  }, [recent, range]);

  // Differentials within active range — drives FORM. Falls back to last-5
  // if active range has fewer than 3 rounds, so the ring isn't empty.
  const last5Diffs = useMemo(() => {
    const inRange = rangeFilteredScores
      .map((r: any) => r.handicap_differential)
      .filter((d: any): d is number => typeof d === 'number');
    if (inRange.length >= 3) return inRange;
    return ((recent ?? []) as any[])
      .slice(0, 5)
      .map((r: any) => r.handicap_differential)
      .filter((d: any): d is number => typeof d === 'number');
  }, [rangeFilteredScores, recent]);

  const coords = useMemo(() => {
    if (points.length === 0) return [] as { x: number; y: number; idx: number }[];
    const values = points.map(p => p.handicap_index);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const r = max - min || 1;
    return points.map((p, i) => {
      const x = points.length === 1 ? W / 2 : PAD_LEFT + (i / (points.length - 1)) * (W - PAD_LEFT - PAD_RIGHT);
      const y = PAD_TOP + ((max - p.handicap_index) / r) * (H - PAD_TOP - PAD_BOTTOM);
      return { x, y, idx: i };
    });
  }, [points]);

  const bestPoint = useMemo(() => {
    if (coords.length === 0) return null;
    let bestIdx = 0;
    let bestVal = points[0].handicap_index;
    for (let i = 1; i < points.length; i++) {
      if (points[i].handicap_index < bestVal) {
        bestVal = points[i].handicap_index;
        bestIdx = i;
      }
    }
    return { coord: coords[bestIdx], value: bestVal };
  }, [coords, points]);

  const worstPoint = useMemo(() => {
    if (coords.length === 0) return null;
    let worstIdx = 0;
    let worstVal = points[0].handicap_index;
    for (let i = 1; i < points.length; i++) {
      if (points[i].handicap_index > worstVal) {
        worstVal = points[i].handicap_index;
        worstIdx = i;
      }
    }
    return { coord: coords[worstIdx], value: worstVal };
  }, [coords, points]);

  const zeroLineY = useMemo(() => {
    if (points.length === 0) return null;
    const values = points.map(p => p.handicap_index);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const r = max - min || 1;
    if (0 < min - r * 0.1 || 0 > max + r * 0.1) return null;
    return PAD_TOP + ((max - 0) / r) * (H - PAD_TOP - PAD_BOTTOM);
  }, [points]);

  // Scratch zone band (y=0 to y=1.5). Always render, even if user's min > 1.5
  // — band acts as goal target.
  const scratchBand = useMemo(() => {
    if (points.length === 0) return null;
    const values = points.map(p => p.handicap_index);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const r = max - min || 1;
    const project = (v: number) =>
      PAD_TOP + ((max - v) / r) * (H - PAD_TOP - PAD_BOTTOM);
    const yTop = Math.max(0, Math.min(H, project(1.5)));
    const yBottom = Math.max(0, Math.min(H, project(0)));
    if (yBottom <= yTop) return null;
    return { yTop, height: yBottom - yTop };
  }, [points]);


  const pathD = useMemo(() => {
    if (coords.length === 0) return '';
    return coords.reduce(
      (acc, c, i) => acc + (i === 0 ? `M ${c.x} ${c.y}` : ` L ${c.x} ${c.y}`),
      '',
    );
  }, [coords]);

  const areaD = useMemo(() => {
    if (coords.length === 0) return '';
    const last = coords[coords.length - 1];
    const first = coords[0];
    return `${pathD} L ${last.x} ${H} L ${first.x} ${H} Z`;
  }, [coords, pathD]);

  useEffect(() => {
    setDrawn(false);
    const t = setTimeout(() => setDrawn(true), 50);
    return () => clearTimeout(t);
  }, [range, points.length]);

  const updateScrubFromEvent = (clientX: number) => {
    if (!svgRef.current || coords.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const xInViewBox = ((clientX - rect.left) / rect.width) * W;
    let nearest = 0;
    let nearestDist = Infinity;
    coords.forEach((c, i) => {
      const dist = Math.abs(c.x - xInViewBox);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    });
    setScrubIdx(nearest);
  };

  const handlePointerMove = (e: React.PointerEvent) => updateScrubFromEvent(e.clientX);
  const handlePointerDown = (e: React.PointerEvent) => updateScrubFromEvent(e.clientX);
  const clearScrub = () => setScrubIdx(null);

  // ── Loading state ───────────────────────────────────────────────────────
  if (trendLoading || historyLoading) {
    return (
      <section style={{ padding: '24px 12px 20px', marginBottom: 24 }}>
        <div style={{ height: 12, width: 80, background: INK_10, borderRadius: 2, marginBottom: 14 }} />
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <div style={{ height: RING_SIZE, width: RING_SIZE, background: INK_06, borderRadius: '50%' }} />
        </div>
        <div style={{ height: 50, width: '100%', background: INK_06, borderRadius: 4 }} />
      </section>
    );
  }

  // ── Empty state ─────────────────────────────────────────────────────────
  if (current === null) {
    return (
      <section style={{ padding: '24px 12px 20px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, padding: '0 4px' }}>
          <span
            style={{
              width: 6, height: 6, borderRadius: '50%', background: AMBER,
              animation: 'liveDot 2s ease-in-out infinite',
            }}
          />
          <span style={{ fontSize: 10, fontWeight: 800, color: INK_55, letterSpacing: '0.22em' }}>
            HANDICAP INDEX
          </span>
        </div>
        <p style={{ fontSize: 14, color: INK_55, fontStyle: 'italic', lineHeight: 1.5, margin: 0, padding: '0 4px' }}>
          Your handicap will appear after your first 8 rounds.
        </p>
        <style>{keyframes}</style>
      </section>
    );
  }

  const scrubPoint = scrubIdx !== null ? points[scrubIdx] : null;
  const scrubValue = scrubPoint?.handicap_index ?? current;
  const isScrubbing = scrubIdx !== null && scrubPoint !== null;

  // Milestone math — outer ring
  const milestone = calcMilestoneProgress(scrubValue);
  

  // Monthly movement math — inner ring (replaces form)
  const monthly = calcMonthlyMovement(trend?.delta ?? null);
  const useMonthlyRing = monthly.delta != null;
  const fallbackForm = calcForm(current, last5Diffs);

  const innerFillLength = useMonthlyRing
    ? (monthly.fillFraction * C_INNER) / 2
    : (fallbackForm.fillFraction * C_INNER) / 2;

  const showGreenArc = useMonthlyRing
    ? monthly.direction === 'cut'
    : fallbackForm.direction === 'positive';

  const showRedArc = useMonthlyRing
    ? monthly.direction === 'up'
    : fallbackForm.direction === 'negative';

  // Form delta UI
  const formNode = (() => {
    if (trend?.delta != null) {
      const STEADY_THRESHOLD = 0.05;
      const delta = trend.delta;
      const absDelta = Math.abs(delta);
      if (absDelta < STEADY_THRESHOLD) {
        return <span style={{ color: INK_40 }}>Steady · last month</span>;
      }
      if (delta < 0) {
        return (
          <span style={{ color: GREEN, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <ArrowDown size={13} strokeWidth={2.5} />
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              {absDelta.toFixed(1)} last month
            </span>
          </span>
        );
      }
      return (
        <span style={{ color: RED, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <ArrowUp size={13} strokeWidth={2.5} />
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>
            {absDelta.toFixed(1)} last month
          </span>
        </span>
      );
    }

    // FALLBACK — form-last-5
    if (last5Diffs.length < 5) {
      return <span style={{ color: INK_40 }}>Steady form · last 5</span>;
    }
    if (fallbackForm.direction === 'positive') {
      return (
        <span style={{ color: GREEN, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <ArrowDown size={13} strokeWidth={2.5} />
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>
            {fmtDiff(-Math.abs(fallbackForm.formStrokes))} form
          </span>
          <span style={{ color: INK_40 }}>· last 5</span>
        </span>
      );
    }
    if (fallbackForm.direction === 'negative') {
      return (
        <span style={{ color: RED, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <ArrowUp size={13} strokeWidth={2.5} />
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>
            +{Math.abs(fallbackForm.formStrokes).toFixed(1)} form
          </span>
          <span style={{ color: INK_40 }}>· last 5</span>
        </span>
      );
    }
    return <span style={{ color: INK_40 }}>Steady form · last 5</span>;
  })();

  // ── Status word (driven by 30-day form direction) ───────────────────────
  const statusWord =
    fallbackForm.direction === 'negative' && Math.abs(fallbackForm.formStrokes) > 0.5 ? 'EXCELLENT'
    : fallbackForm.direction === 'negative' ? 'TRENDING DOWN'
    : fallbackForm.direction === 'positive' && Math.abs(fallbackForm.formStrokes) > 0.5 ? 'DRIFTING UP'
    : fallbackForm.direction === 'positive' ? 'STEADY'
    : 'STEADY';
  const statusColor =
    fallbackForm.direction === 'negative' ? GREEN
    : fallbackForm.direction === 'positive' && Math.abs(fallbackForm.formStrokes) > 0.5 ? '#9F1239'
    : INK_55;

  // ── Combined delta inline ────────────────────────────────────────────────
  const deltaInline = (() => {
    const d = trend?.delta;
    if (d == null || Math.abs(d) < 0.05) {
      return <span style={{ color: INK_55, fontWeight: 600 }}>Steady</span>;
    }
    const isDown = d < 0;
    return (
      <span style={{
        color: isDown ? GREEN : RED, fontWeight: 600,
        display: 'inline-flex', alignItems: 'center', gap: 3,
      }}>
        {isDown ? <ArrowDown size={10} strokeWidth={2.5} /> : <ArrowUp size={10} strokeWidth={2.5} />}
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{Math.abs(d).toFixed(1)}</span>
      </span>
    );
  })();

  // ── Delta sub text + direction (for centre ring label-stack) ─────────────
  const deltaTodayDir: 'up' | 'down' | 'flat' = (() => {
    const d = trend?.delta;
    if (d == null || Math.abs(d) < 0.05) return 'flat';
    return d < 0 ? 'down' : 'up';
  })();
  const deltaSubText = (() => {
    const d = trend?.delta;
    if (d == null) return 'Awaiting data';
    if (Math.abs(d) < 0.05) return 'Steady';
    return `${d < 0 ? '↓' : '↑'} ${Math.abs(d).toFixed(1)}`;
  })();

  // ── 6-point sparkline from history points ────────────────────────────────
  const sparkPolyline = (() => {
    if (points.length < 2) return null;
    let samples: HandicapPoint[];
    if (points.length <= 6) {
      samples = points;
    } else {
      const out: HandicapPoint[] = [];
      const n = 6;
      for (let i = 0; i < n; i++) {
        const idx = Math.round((i / (n - 1)) * (points.length - 1));
        out.push(points[idx]);
      }
      samples = out;
    }
    const values = samples.map(p => p.handicap_index);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = (max - min) || 1;
    const headroom = range * 0.08;
    const yMin = min - headroom;
    const yMax = max + headroom;
    const yRange = yMax - yMin || 1;
    const w = 32;
    const h = 10;
    const coordsLocal = samples.map((p, i) => {
      const x = (i / (samples.length - 1)) * w;
      const y = ((yMax - p.handicap_index) / yRange) * h;
      return { x, y };
    });
    return {
      points: coordsLocal.map(c => `${c.x.toFixed(2)},${c.y.toFixed(2)}`).join(' '),
      lastX: coordsLocal[coordsLocal.length - 1].x,
      lastY: coordsLocal[coordsLocal.length - 1].y,
    };
  })();

  // ── FORM (range-aware) ────────────────────────────────────────────────
  // formStrokes from fallbackForm (computed above using rangeDiffs).
  const formStrokesValue = fallbackForm.formStrokes;
  const formLabel = formStateLabel(formStrokesValue);
  const formCap = range === 'all' ? 3 : 2;
  const formClamped = Math.max(-formCap, Math.min(formCap, formStrokesValue));
  const formMagnitude = Math.abs(formClamped) / formCap; // 0–1
  const formIsHot = formClamped > 0.05;
  const formIsCold = formClamped < -0.05;
  const formArcColor = formIsHot ? FORM_HOT : formIsCold ? FORM_COLD : INK_40;
  const formHasData = last5Diffs.length > 0;

  // ── SCORING AVG within active range ───────────────────────────────────
  const rangeGrossList = rangeFilteredScores
    .map((r: any) => (typeof r?.adjusted_gross === 'number' ? r.adjusted_gross : null))
    .filter((v: any): v is number => v != null);
  const scoringAvgStr = rangeGrossList.length >= 3
    ? (rangeGrossList.reduce((s, v) => s + v, 0) / rangeGrossList.length).toFixed(1)
    : null;
  const scoringRoundCount = rangeGrossList.length;

  // Ring fill scale uses last-50 best/worst across all rounds — independent
  // of the active range so the visual position is stable.
  const allGrossList = ((recent ?? []) as any[])
    .map((r: any) => (typeof r?.adjusted_gross === 'number' ? r.adjusted_gross : null))
    .filter((v: any): v is number => v != null);
  const last50Gross = allGrossList.slice(0, 50);
  const grossBest = last50Gross.length ? Math.min(...last50Gross) : null;
  const grossWorst = last50Gross.length ? Math.max(...last50Gross) : null;
  const scoringFraction = (scoringAvgStr !== null && grossBest !== null && grossWorst !== null && grossWorst !== grossBest)
    ? Math.max(0, Math.min(1, (grossWorst - parseFloat(scoringAvgStr)) / (grossWorst - grossBest)))
    : 0.5;

  const scoringSub = range === 30
    ? 'Over 30 days'
    : range === 365
      ? 'Over 1 year'
      : 'Career';

  return (
    <section style={{ margin: '0 0 24px', padding: '0 20px', fontFamily: FONT_DISPLAY }}>
      {/* Eyebrow row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, padding: '0 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 6, height: 6, borderRadius: '50%', background: AMBER,
              animation: 'liveDot 2s ease-in-out infinite',
            }}
          />
          <span style={{ fontSize: 10, fontWeight: 800, color: INK_55, letterSpacing: '0.22em' }}>
            HANDICAP INDEX
          </span>
        </div>
        <div style={{ display: 'inline-flex', gap: 2, padding: 2, background: INK_04, borderRadius: 999 }}>
          {([30, 365, 'all'] as Range[]).map(r => {
            const active = r === range;
            const label = r === 'all' ? 'ALL' : r === 365 ? '1Y' : '30D';
            return (
              <button
                key={String(r)}
                onClick={() => setRange(r)}
                style={{
                  padding: '4px 10px', fontSize: 10, fontWeight: 800,
                  border: 'none', borderRadius: 999, cursor: 'pointer',
                  background: active ? INK : 'transparent',
                  color: active ? '#fff' : INK_55,
                  letterSpacing: '0.02em',
                  transition: 'background 150ms ease, color 150ms ease',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Range-aware subtext */}
      <div style={{
        fontSize: 12,
        fontWeight: 500,
        color: INK_55,
        marginTop: 4,
        marginBottom: 12,
        lineHeight: 1.4,
        padding: '0 4px',
      }}>
        {range === 30
          ? 'Your performance in the past 30 days'
          : range === 365
            ? 'Your performance over the past year'
            : 'Your career performance to date'}
      </div>

      {/* Three-ring row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr 1fr',
        alignItems: 'center',
        gap: 4,
        padding: '6px 0 4px',
      }}>
        {/* LEFT — HANDICAP (hero ring) */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          paddingBottom: 2, paddingTop: 14,
          justifySelf: 'center',
        }}>
          <div style={{
            position: 'relative',
            width: 'clamp(72px, 22vw, 100px)',
            aspectRatio: '1 / 1',
          }}>
            <svg
              width="100%" height="100%"
              viewBox={`0 0 100 100`}
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <linearGradient id="heroMomentumGreen" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={MOMENTUM_GREEN_DEEP} />
                  <stop offset="100%" stopColor={MOMENTUM_GREEN_BRIGHT} />
                </linearGradient>
                {/* Subtle drop-shadow filter for filled arc lift */}
                <filter id="heroArcLift" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="0.6" />
                  <feOffset dx="0" dy="0.4" result="offsetblur" />
                  <feComponentTransfer><feFuncA type="linear" slope="0.3" /></feComponentTransfer>
                  <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              {/* Track */}
              <circle
                cx={50} cy={50} r={42}
                fill="none" stroke={RING_TRACK} strokeWidth={6}
                vectorEffect="non-scaling-stroke"
              />
              {/* Momentum arc — green for improving, red for worsening */}
              {showGreenArc && (
                <circle
                  cx={50} cy={50} r={42} fill="none"
                  stroke="url(#heroMomentumGreen)" strokeWidth={6}
                  strokeDasharray={`${(innerFillLength / C_INNER) * (2 * Math.PI * 42)} ${2 * Math.PI * 42}`}
                  strokeLinecap="round"
                  transform={`rotate(-90 50 50)`}
                  vectorEffect="non-scaling-stroke"
                  filter="url(#heroArcLift)"
                  style={{ transition: 'stroke-dasharray 320ms cubic-bezier(0.22, 0.61, 0.36, 1)' }}
                />
              )}
              {showRedArc && (
                <g transform={`scale(-1, 1) translate(-100, 0)`}>
                  <circle
                    cx={50} cy={50} r={42} fill="none"
                    stroke={RED} strokeWidth={6}
                    strokeDasharray={`${(innerFillLength / C_INNER) * (2 * Math.PI * 42)} ${2 * Math.PI * 42}`}
                    strokeLinecap="round"
                    transform={`rotate(-90 50 50)`}
                    vectorEffect="non-scaling-stroke"
                    filter="url(#heroArcLift)"
                    style={{ transition: 'stroke-dasharray 320ms cubic-bezier(0.22, 0.61, 0.36, 1)' }}
                  />
                </g>
              )}
            </svg>

            {/* Number inside the ring */}
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}>
              <span style={{
                fontSize: 'clamp(16px, 4.6vw, 19px)', fontWeight: 700, color: INK,
                letterSpacing: '-0.03em', lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {scrubValue.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Label stack BELOW the ring — matches FlankRing structure */}
          <div style={{ marginTop: 8, textAlign: 'center', maxWidth: '120%' }}>
            <div style={{
              fontSize: 'clamp(10px, 2.8vw, 10.5px)',
              fontWeight: 800, color: INK,
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>HANDICAP</div>
            <div style={{
              fontSize: 'clamp(9px, 2.6vw, 10px)',
              color: deltaTodayDir === 'down' ? '#15803D' : deltaTodayDir === 'up' ? RED : INK_40,
              marginTop: 2, fontWeight: deltaTodayDir === 'flat' ? 500 : 700,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              fontVariantNumeric: 'tabular-nums',
              opacity: isScrubbing ? 0 : 1,
              transition: 'opacity 200ms ease',
            }}>{deltaSubText}</div>
          </div>
        </div>

        {/* CENTRE — SCORING AVG */}
        <FlankRing metric="scoring" value={scoringAvgStr ?? '—'} fraction={scoringFraction} sub={scoringSub} />

        {/* RIGHT — FORM */}
        <FlankRing
          metric="form"
          formHasData={formHasData}
          formIsHot={formIsHot}
          formIsCold={formIsCold}
          formMagnitude={formMagnitude}
          formArcColor={formArcColor}
          formTitle={formLabel.title}
          formSub={formLabel.sub}
        />
      </div>

      {/* Sparkline section header */}
      <div style={{
        marginTop: 28,
        padding: '0 4px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span aria-hidden style={{
          display: 'inline-block',
          width: 3, height: 11, background: AMBER, borderRadius: 1,
        }} />
        <span style={{
          fontSize: 9, fontWeight: 800, color: AMBER,
          letterSpacing: '0.16em', textTransform: 'uppercase',
        }}>
          Index over time
        </span>
      </div>

      {/* Sparkline strip */}
      <div style={{ padding: '0 4px', marginTop: 8 }}>
        <svg
          ref={svgRef}
          width="100%"
          height="auto"
          viewBox={`0 0 ${W} ${H}`}
          style={{ display: 'block', touchAction: 'none', cursor: 'crosshair' }}
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerDown}
          onPointerLeave={clearScrub}
          onPointerCancel={clearScrub}
        >
          <defs>
            <linearGradient id="heroSparkStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#F7931E" />
              <stop offset="100%" stopColor="#FBBC2E" />
            </linearGradient>
            <linearGradient id="heroSparkFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FBBC2E" stopOpacity={0.32} />
              <stop offset="60%" stopColor="#F7931E" stopOpacity={0.12} />
              <stop offset="100%" stopColor="#F7931E" stopOpacity={0} />
            </linearGradient>
          </defs>

          {scratchBand && (
            <g>
              <rect
                x={0}
                y={scratchBand.yTop}
                width={W}
                height={scratchBand.height}
                fill={GREEN}
                opacity={0.05}
              />
              <text
                x={6}
                y={scratchBand.yTop + scratchBand.height - 4}
                fontSize={9}
                fontWeight={700}
                fill={GREEN}
                opacity={0.7}
                letterSpacing={1.3}
              >
                SCRATCH ZONE
              </text>
            </g>
          )}

          {coords.length >= 2 && (
            <>
              <path d={areaD} fill="url(#heroSparkFill)" />
              <path
                d={pathD}
                fill="none"
                stroke="url(#heroSparkStroke)"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                style={{
                  strokeDasharray: 2000,
                  strokeDashoffset: drawn ? 0 : 2000,
                  transition: 'stroke-dashoffset 1200ms cubic-bezier(0.22, 0.61, 0.36, 1)',
                }}
              />
            </>
          )}

          {coords.length === 1 && (
            <line
              x1={0} y1={coords[0].y} x2={W} y2={coords[0].y}
              stroke="url(#heroSparkStroke)" strokeWidth={2} strokeLinecap="round" opacity={0.7}
            />
          )}

          {!isScrubbing && zeroLineY !== null && (
            <g>
              <line
                x1={0} y1={zeroLineY} x2={W} y2={zeroLineY}
                stroke={INK_40}
                strokeWidth={0.5}
                strokeDasharray="3 3"
                opacity={0.4}
              />
              <text
                x={W - 4} y={zeroLineY - 3}
                fontSize={9}
                fontWeight={500}
                fill={INK_40}
                textAnchor="end"
              >
                0
              </text>
            </g>
          )}

          {!isScrubbing && bestPoint && coords.length > 1 && bestPoint.coord !== coords[coords.length - 1] && (
            <g>
              <circle
                cx={bestPoint.coord.x}
                cy={bestPoint.coord.y}
                r={3.5}
                fill={GREEN}
                stroke="#fff"
                strokeWidth={1.5}
              />
              <text
                x={bestPoint.coord.x}
                y={bestPoint.coord.y < 16 ? bestPoint.coord.y + 16 : bestPoint.coord.y - 8}
                fontSize={9}
                fontWeight={700}
                fill={GREEN}
                textAnchor="middle"
              >
                {formatDisplayedHcp(bestPoint.value)}
              </text>
            </g>
          )}

          {!isScrubbing && worstPoint && coords.length > 1 && worstPoint.coord !== coords[coords.length - 1] && worstPoint.coord !== bestPoint?.coord && (
            <g>
              <circle
                cx={worstPoint.coord.x}
                cy={worstPoint.coord.y}
                r={3.5}
                fill={RED_FORM_HOT}
                stroke="#fff"
                strokeWidth={1.5}
              />
              <text
                x={worstPoint.coord.x}
                y={worstPoint.coord.y < 16 ? worstPoint.coord.y + 16 : worstPoint.coord.y - 8}
                fontSize={9}
                fontWeight={700}
                fill={RED_FORM_HOT}
                textAnchor="middle"
              >
                {formatDisplayedHcp(worstPoint.value)}
              </text>
            </g>
          )}

          {!isScrubbing && coords.length > 0 && (() => {
            const last = coords[coords.length - 1];
            const lastValue = points[points.length - 1].handicap_index;
            const labelAbove = last.y > 18;
            return (
              <g>
                <circle cx={last.x} cy={last.y} r={5} fill={AMBER} stroke="#fff" strokeWidth={2} />
                <text
                  x={last.x - 10}
                  y={labelAbove ? last.y - 8 : last.y + 16}
                  fontSize={11}
                  fontWeight={700}
                  fill={INK}
                  textAnchor="end"
                >
                  {formatDisplayedHcp(lastValue)}
                </text>
              </g>
            );
          })()}

          {isScrubbing && coords[scrubIdx!] && (
            <g>
              <line
                x1={coords[scrubIdx!].x} y1={0}
                x2={coords[scrubIdx!].x} y2={H}
                stroke={INK} strokeWidth={1}
                strokeDasharray="3 3" opacity={0.4}
              />
              <circle
                cx={coords[scrubIdx!].x} cy={coords[scrubIdx!].y} r={5}
                fill="#fff" stroke={INK} strokeWidth={2}
              />
            </g>
          )}
        </svg>

        {/* Timeline */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 8, fontSize: 10.5, fontWeight: 700, color: INK_40,
          letterSpacing: '0.12em',
        }}>
          {isScrubbing && scrubPoint ? (
            <>
              <span />
              <span style={{ color: INK_55 }}>{shortDate(scrubPoint)}</span>
              <span />
            </>
          ) : points.length >= 2 ? (
            <>
              <span>{shortMonth(points[0])}</span>
              <span>{shortMonth(points[Math.floor(points.length / 2)])}</span>
              <span>{shortMonth(points[points.length - 1])}</span>
            </>
          ) : null}
        </div>
      </div>

      <style>{keyframes}</style>
    </section>
  );
};

function shortMonth(point: HandicapPoint): string {
  const d = new Date(point.observed_at);
  return MONTHS[d.getMonth()];
}
function shortDate(point: HandicapPoint): string {
  const d = new Date(point.observed_at);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

const keyframes = `
@keyframes liveDot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.3); }
}
`;

// ── FlankRing (FORM / SCORING AVG) ──────────────────────────────────────
interface FlankRingProps {
  metric: 'form' | 'scoring';
  // scoring
  value?: string;
  fraction?: number;
  sub?: string;
  // form (bidirectional, range-aware)
  formHasData?: boolean;
  formIsHot?: boolean;
  formIsCold?: boolean;
  formMagnitude?: number;
  formArcColor?: string;
  formTitle?: string;
  formSub?: string;
}

const FlankRing: React.FC<FlankRingProps> = ({
  metric, value, fraction, sub,
  formHasData, formIsHot, formIsCold, formMagnitude, formArcColor, formTitle, formSub,
}) => {
  const VIEWBOX = 100;
  const FCX = 50;
  const FCY = 50;
  const FR = 42;
  const FSTROKE = 6;
  const FC = 2 * Math.PI * FR;

  const isForm = metric === 'form';

  // Resolved label / sub
  const label = isForm ? 'FORM' : 'SCORING AVG';
  const subText = isForm
    ? (formHasData ? (formSub ?? '') : 'Awaiting data')
    : (sub ?? 'Over last 5');

  // Centre node
  const centre: React.ReactNode = isForm ? (
    formHasData ? (
      <Activity size={26} strokeWidth={2.5} color={formArcColor ?? INK_40} />
    ) : (
      <span style={{ fontSize: 'clamp(16px, 4.6vw, 22px)', color: INK_40, fontWeight: 800 }}>—</span>
    )
  ) : (
    <span style={{
      fontSize: value && value.length > 4 ? 'clamp(13px, 3.8vw, 16px)' : 'clamp(14px, 4.4vw, 18px)',
      fontWeight: 700, color: INK, lineHeight: 1,
      letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums',
    }}>{value ?? '—'}</span>
  );

  // Scoring single-direction frac
  const scoringFrac = !isForm ? (fraction ?? 0) : 0;
  const scoringColor = 'url(#flankScoringGradient)';

  // FORM bidirectional dasharray length — half the circumference scaled by magnitude
  const formArcLen = ((formMagnitude ?? 0) * FC) / 2;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      paddingBottom: 2, paddingTop: 14,
    }}>
      <div style={{
        position: 'relative',
        width: 'clamp(72px, 22vw, 100px)',
        aspectRatio: '1 / 1',
      }}>
        <svg
          width="100%" height="100%"
          viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="flankScoringGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={SCORING_BLUE_DEEP} />
              <stop offset="100%" stopColor={SCORING_BLUE} />
            </linearGradient>
            <filter id="flankArcLift" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="0.6" />
              <feOffset dx="0" dy="0.4" result="offsetblur" />
              <feComponentTransfer><feFuncA type="linear" slope="0.3" /></feComponentTransfer>
              <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <circle cx={FCX} cy={FCY} r={FR} fill="none"
            stroke={RING_TRACK} strokeWidth={FSTROKE}
            vectorEffect="non-scaling-stroke" />

          {/* Scoring single arc (clockwise from top) */}
          {!isForm && scoringFrac > 0 && (
            <circle cx={FCX} cy={FCY} r={FR} fill="none"
              stroke={scoringColor} strokeWidth={FSTROKE}
              strokeLinecap="round"
              strokeDasharray={`${scoringFrac * FC} ${FC}`}
              transform={`rotate(-90 ${FCX} ${FCY})`}
              vectorEffect="non-scaling-stroke"
              filter="url(#flankArcLift)" />
          )}

          {/* FORM hot arc — right side, clockwise from top */}
          {isForm && formIsHot && formArcLen > 0 && (
            <circle cx={FCX} cy={FCY} r={FR} fill="none"
              stroke={FORM_HOT} strokeWidth={FSTROKE}
              strokeLinecap="round"
              strokeDasharray={`${formArcLen} ${FC}`}
              transform={`rotate(-90 ${FCX} ${FCY})`}
              vectorEffect="non-scaling-stroke"
              filter="url(#flankArcLift)" />
          )}

          {/* FORM cold arc — left side, mirrored */}
          {isForm && formIsCold && formArcLen > 0 && (
            <circle cx={FCX} cy={FCY} r={FR} fill="none"
              stroke={FORM_COLD} strokeWidth={FSTROKE}
              strokeLinecap="round"
              strokeDasharray={`${formArcLen} ${FC}`}
              transform={`rotate(-90 ${FCX} ${FCY}) scale(-1, 1) translate(${-VIEWBOX}, 0)`}
              vectorEffect="non-scaling-stroke"
              filter="url(#flankArcLift)" />
          )}
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {centre}
        </div>
      </div>
      <div style={{ marginTop: 8, textAlign: 'center', maxWidth: '120%' }}>
        <div style={{
          fontSize: 'clamp(10px, 2.8vw, 10.5px)',
          fontWeight: 800, color: isForm && formHasData ? (formArcColor ?? INK) : INK,
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>{isForm ? (formHasData ? (formTitle ?? 'FORM') : 'FORM') : label}</div>
        <div style={{
          fontSize: 'clamp(9px, 2.6vw, 10px)',
          color: isForm && formHasData ? (formArcColor ?? INK_40) : INK_40,
          marginTop: 2, fontWeight: 500,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{subText}</div>
      </div>
    </div>
  );
};

// ── Metric rings row (CONSISTENCY / MOMENTUM / TRAJECTORY) ───────────────
const MR_SIZE = 52;
const MR_R = 23.5;
const MR_STROKE = 5;
const MR_C = 2 * Math.PI * MR_R;

interface MetricCellSpec {
  label: string;
  sub: string;
  centre: string;
  centreIcon?: 'flame' | 'minus' | 'snowflake' | null;
  fraction: number; // 0..1
  color: string;
  available: boolean;
}

const MetricRing: React.FC<{ spec: MetricCellSpec }> = ({ spec }) => {
  const dash = spec.available ? spec.fraction * MR_C : 0;
  const isShortText = spec.centre.length <= 3;
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '0 6px',
    }}>
      <div style={{ position: 'relative', width: MR_SIZE, height: MR_SIZE }}>
        <svg width={MR_SIZE} height={MR_SIZE} viewBox={`0 0 ${MR_SIZE} ${MR_SIZE}`}>
          <circle
            cx={MR_SIZE / 2} cy={MR_SIZE / 2} r={MR_R}
            fill="none" stroke={INK_06} strokeWidth={MR_STROKE}
            vectorEffect="non-scaling-stroke"
          />
          {dash > 0 && (
            <circle
              cx={MR_SIZE / 2} cy={MR_SIZE / 2} r={MR_R}
              fill="none" stroke={spec.color} strokeWidth={MR_STROKE}
              strokeLinecap="round"
              strokeDasharray={`${dash} ${MR_C}`}
              transform={`rotate(-90 ${MR_SIZE / 2} ${MR_SIZE / 2})`}
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          {spec.centreIcon === 'flame' ? (
            <Flame size={20} color="#DC2626" strokeWidth={2.4} fill="#DC2626" />
          ) : spec.centreIcon === 'minus' ? (
            <Minus size={22} color="#475569" strokeWidth={3} />
          ) : spec.centreIcon === 'snowflake' ? (
            <Snowflake size={20} color="#0EA5E9" strokeWidth={2.4} />
          ) : (
            <span style={{
              fontSize: isShortText ? 13 : 11,
              fontWeight: 700,
              color: spec.available ? INK : INK_40,
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1,
            }}>
              {spec.centre}
            </span>
          )}
        </div>
      </div>
      <div style={{
        marginTop: 8,
        fontSize: 9.5, fontWeight: 700, color: INK_55,
        letterSpacing: '0.10em', textTransform: 'uppercase',
        textAlign: 'center', whiteSpace: 'nowrap',
      }}>
        {spec.label}
      </div>
      <div style={{
        marginTop: 2, fontSize: 10.5, color: INK_40, textAlign: 'center',
      }}>
        {spec.sub}
      </div>
    </div>
  );
};

interface MetricRingsRowProps {
  currentHcp: number;
  last20: any[];
  history: HandicapPoint[];
  delta30d: number | null;
}

const MetricRingsRow: React.FC<MetricRingsRowProps> = ({ currentHcp, last20, history, delta30d }) => {
  const SLATE = '#475569';
  const HOT_RED = '#DC2626';
  const COLD_BLUE = '#0EA5E9';
  const MOM_GREEN = '#22C55E';
  const SCORE_BLUE = '#3B82F6';

  // FORM — direct port of the predictHandicap verdict from Trends.
  let form: MetricCellSpec;
  const formPrediction = predictHandicap(last20 ?? []);
  const verdict = formPrediction.verdict;
  if (verdict === 'unknown') {
    form = {
      label: 'FORM', sub: 'Awaiting data', centre: '—',
      fraction: 0, color: INK_40, available: false,
    };
  } else {
    // Collapse 5 verdicts into 3 simpler states:
    //   in_form, building → HOT
    //   steady           → STEADY
    //   slipping, cold   → COLD
    let state: 'hot' | 'steady' | 'cold';
    if (verdict === 'in_form' || verdict === 'building') state = 'hot';
    else if (verdict === 'steady') state = 'steady';
    else state = 'cold';

    const stateMap = {
      hot:    { fraction: 1.00, color: HOT_RED,   centre: 'Hot',    icon: 'flame' as const,     sub: 'Hot over last 5' },
      steady: { fraction: 0.50, color: SLATE,     centre: 'Steady', icon: 'minus' as const,     sub: 'Steady over last 5' },
      cold:   { fraction: 0.10, color: COLD_BLUE, centre: 'Cold',   icon: 'snowflake' as const, sub: 'Cold over last 5' },
    };
    const meta = stateMap[state];
    form = {
      label: 'FORM', sub: meta.sub,
      centre: meta.centre,
      centreIcon: meta.icon,
      fraction: meta.fraction, color: meta.color, available: true,
    };
  }

  // MOMENTUM
  let momentum: MetricCellSpec;
  if (delta30d == null) {
    momentum = {
      label: 'MOMENTUM', sub: 'Awaiting data', centre: '—',
      fraction: 0, color: INK_40, available: false,
    };
  } else {
    const fraction = Math.min(1, Math.abs(delta30d) * 0.5);
    const color =
      delta30d < -0.05 ? MOM_GREEN :
      delta30d > 0.05 ? RED :
      SLATE;
    const centre = delta30d < 0
      ? `\u2212${Math.abs(delta30d).toFixed(1)}`
      : delta30d > 0
        ? `+${delta30d.toFixed(1)}`
        : '0.0';
    momentum = {
      label: 'MOMENTUM', sub: '30d', centre,
      fraction, color, available: true,
    };
  }

  // SCORING AVG — average adjusted_gross over last 10 rounds.
  let scoringAvg: MetricCellSpec;
  const grossList = (last20 ?? [])
    .map((r: any) => (typeof r?.adjusted_gross === 'number' ? r.adjusted_gross : null))
    .filter((v: number | null): v is number => v != null);

  if (grossList.length < 5) {
    scoringAvg = {
      label: 'SCORING AVG', sub: 'Awaiting data', centre: '—',
      fraction: 0, color: INK_40, available: false,
    };
  } else {
    const last5 = grossList.slice(0, 5);
    const avg = last5.reduce((s, v) => s + v, 0) / last5.length;
    const last50 = grossList.slice(0, 50);
    const best = Math.min(...last50);
    const worst = Math.max(...last50);
    let fraction: number;
    if (worst === best) {
      fraction = 0.5;
    } else {
      fraction = Math.max(0, Math.min(1, (worst - avg) / (worst - best)));
    }
    scoringAvg = {
      label: 'SCORING AVG', sub: `Over last ${last5.length}`,
      centre: avg.toFixed(1),
      fraction, color: SCORE_BLUE, available: true,
    };
  }

  return (
    <div style={{
      margin: '16px 0 12px',
      background: '#fff',
      border: `0.5px solid ${'rgba(15,23,42,0.08)'}`,
      borderRadius: 14,
      padding: '16px 8px',
      display: 'flex',
      alignItems: 'stretch',
      position: 'relative',
    }}>
      <MetricRing spec={form} />
      <div style={{
        width: '0.5px', alignSelf: 'center', height: '60%',
        background: 'rgba(15,23,42,0.08)',
      }} />
      <MetricRing spec={momentum} />
      <div style={{
        width: '0.5px', alignSelf: 'center', height: '60%',
        background: 'rgba(15,23,42,0.08)',
      }} />
      <MetricRing spec={scoringAvg} />
    </div>
  );
};

export default HeroHandicapCard;
export { HeroHandicapCard };
