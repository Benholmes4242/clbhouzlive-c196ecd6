/**
 * THE CONNECT-INTRO CHART. This is NOT HowItPlays' LocalHoleChart and must not
 * be merged with it. It is coloured and animated because the connect intro is a
 * sales surface rather than a data surface. LocalHoleChart in HowItPlays stays
 * neutral and must not be changed to match this one. Geometry is identical.
 */
import React from 'react';
import type { CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import { A, BAR_RADIUS, FIGS, SANS } from '@/features/courses/components/holes/analytical/tokens';

const CHART_HEIGHT = 82;
const GAP = 3;

/**
 * Four discrete difficulty bands, hardest first. The third band is deliberately
 * '#EC6C2A' and NOT the brand amber '#F7931E': the amber example line is drawn
 * across these bars and over an amber bar it would lose almost all contrast.
 */
const INTRO_BANDS = {
  hardest: '#F2422E',
  hard: '#EC6C2A',
  middle: '#E8B94A',
  easy: '#2FBF6B',
} as const;

const LINE_AMBER = '#F7931E';

function bandFor(t: number): string {
  if (t > 0.78) return INTRO_BANDS.hardest;
  if (t > 0.55) return INTRO_BANDS.hard;
  if (t > 0.32) return INTRO_BANDS.middle;
  return INTRO_BANDS.easy;
}

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
    return { h, barHeight, markerBottom, color: bandFor(h.avg_to_par / maxField) };
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
                background: `linear-gradient(180deg, ${g.color}, ${g.color}66)`,
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
        <span>9</span>
        <span>18</span>
      </div>
    </div>
  );
};

export default IntroHoleChart;
