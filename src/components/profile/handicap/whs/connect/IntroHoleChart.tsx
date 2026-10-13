/**
 * THE CONNECT-INTRO CHART. This is NOT HowItPlays' LocalHoleChart and must not
 * be merged with it: this one is animated (the connect intro sells the idea).
 * Height carries the hole's difficulty (avg_to_par). Colour carries a DIFFERENT
 * variable: the hole's typical SCORE - the bucket it most often yields - taken
 * from the app's own hole-by-hole palette, RAMP_TOPAR. So no number is encoded
 * twice. The ScoringBand below is the course-wide version of the same four
 * buckets in the same four colours, so the band reads as the chart's key.
 * The amber example line is the member's colour on the chart.
 */
import React from 'react';
import type { CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import { courseBucketShares } from '@/features/courses/components/holes/analytical/HoleRowV2';
import { A, BAR_RADIUS, FIGS, RAMP_TOPAR, SANS } from '@/features/courses/components/holes/analytical/tokens';

const CHART_HEIGHT = 135;
const GAP = 3;

const ORDER = ['birdie', 'par', 'bogey', 'double'] as const;

/** Fill for one bar: the hole's dominant bucket, or flat A.DIM with no scored plays. */
function barFill(h: CourseHole): string {
  const seg = courseBucketShares([h]);
  if (!seg) return A.DIM;
  // Scan in BUCKETS order and keep only a STRICTLY greater share, so the first
  // maximum wins: an exact tie resolves to the better score, deterministically.
  let best: (typeof ORDER)[number] = ORDER[0];
  for (const k of ORDER) if (seg[k] > seg[best]) best = k;
  return RAMP_TOPAR[best];
}

const LINE_AMBER = '#F7931E';

const KEYFRAMES = `
@keyframes ciWipe { 0% { clip-path: inset(0 100% 0 0) } 24% { clip-path: inset(0 -2% 0 0) } 100% { clip-path: inset(0 -2% 0 0) } }
@keyframes ciLine { 0%, 78% { opacity: 1 } 88%, 100% { opacity: 0 } }
@keyframes ciScan { 0% { left: 0; opacity: 0 } 3% { opacity: .95 } 24% { left: 100%; opacity: .95 } 29% { left: 100%; opacity: 0 } 100% { left: 100%; opacity: 0 } }
@media (prefers-reduced-motion: reduce) { .ci-sweep, .ci-line { animation: none !important; clip-path: none !important; opacity: 1 !important } .ci-scan { display: none } }
`;

export const IntroHoleChart: React.FC<{ holes: CourseHole[] }> = ({ holes }) => {
  const boxRef = React.useRef<HTMLDivElement>(null);
  const [W, setW] = React.useState(0);

  React.useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => setW(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const maxField = Math.max(0.01, ...holes.map((h) => Math.max(0, h.avg_to_par)));
  const geo = holes.map((h) => {
    const barHeight = Math.max(2, (Math.max(0, h.avg_to_par) / maxField) * CHART_HEIGHT);
    const exampleToPar = Math.max(0, h.avg_to_par) * (0.6 + 0.08 * ((h.hole_no * 7) % 5));
    const markerBottom = Math.max(0, Math.min(barHeight - 2, (exampleToPar / maxField) * CHART_HEIGHT));
    return { h, barHeight, markerBottom, fill: barFill(h) };
  });

  const n = holes.length;
  const bw = n > 0 ? (W - (n - 1) * GAP) / n : 0;
  const points = geo
    .map((g, i) => `${(i * (bw + GAP) + bw / 2).toFixed(2)},${(CHART_HEIGHT - g.markerBottom - 1).toFixed(2)}`)
    .join(' ');

  return (
    <div>
      <style>{KEYFRAMES}</style>
      <div ref={boxRef} aria-hidden="true" style={{ position: 'relative', height: CHART_HEIGHT }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
            alignItems: 'end',
            gap: GAP,
            height: CHART_HEIGHT,
          }}
        >
          {geo.map((g) => (
            <span
              key={g.h.hole_no}
              style={{
                display: 'block',
                width: '100%',
                height: g.barHeight,
                borderRadius: BAR_RADIUS,
                overflow: 'hidden',
                background: g.fill,
              }}
            />
          ))}
        </div>
        <div
          className="ci-sweep"
          style={{ position: 'absolute', inset: 0, animation: 'ciWipe 9s cubic-bezier(.33, 0, .25, 1) infinite' }}
        >
          {W > 0 ? (
            <svg
              className="ci-line"
              viewBox={`0 0 ${W} ${CHART_HEIGHT}`}
              preserveAspectRatio="none"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                overflow: 'visible',
                animation: 'ciLine 9s linear infinite',
              }}
            >
              <polyline
                points={points}
                fill="none"
                stroke={LINE_AMBER}
                strokeWidth={1.75}
                strokeDasharray="4 3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          ) : null}
        </div>
        <div
          className="ci-scan"
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: 1.5,
            background: 'linear-gradient(to bottom, rgba(247,147,30,0), rgba(247,147,30,.85) 30%, #F7931E 100%)',
            boxShadow: '0 0 6px 0 rgba(247,147,30,.30)',
            animation: 'ciScan 9s cubic-bezier(.33, 0, .25, 1) infinite',
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 8,
          color: A.DIM,
          fontFamily: SANS,
          fontSize: 10,
          fontWeight: 700,
          ...FIGS,
        }}
      >
        <span>1</span>
        <span>{String(Math.ceil(n / 2))}</span>
        <span>{String(n)}</span>
      </div>
    </div>
  );
};

export default IntroHoleChart;
