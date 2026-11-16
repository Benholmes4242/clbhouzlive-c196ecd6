/** Responsive width is observed locally; chart data never triggers a read.
 * End labels use their reserved lane and share deterministic collision spacing. */
import { useLayoutEffect, useRef, useState } from 'react';
import type { BoardEntry } from '../../leaderboard/BoardTable';
import { wonChart, type WeekFacts } from '../data/weekFactsRules';
import { score } from '../data/tournamentRules';
import { recapPronoun } from '../../components/overview-v3/seasonRecapRules';
import type { TourId } from '../../hooks/useOverviewData';

export function WonChart({ facts, rows, tourCode }: { facts: WeekFacts; rows: BoardEntry[]; tourCode: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(335);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const measure = () => { if (node.clientWidth > 0) setWidth(node.clientWidth); };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const chart = wonChart(facts, rows, width);
  if (!chart) return null;
  const champion = chart.lines.find(line => line.champion);
  const pronoun = recapPronoun(tourCode as TourId);
  return <><div ref={ref} className="cw-chart" data-cw-section="path">
    <svg viewBox={`0 0 ${width} 150`} width="100%" height="150" role="img" aria-label="How it was won, to par after each round">
      {chart.rounds.map(round => <g key={round.label}><line className="cw-chart-guide" x1={round.x} x2={round.x} y1={16} y2={128} /><text className="cw-chart-round" x={round.x} y={146} textAnchor="middle">{round.label}</text></g>)}
      {[...chart.lines].sort((a, b) => Number(a.champion) - Number(b.champion)).map(line => {
        const end = line.points[line.points.length - 1];
        if (!end) return null;
        const tone = end.value < 0 ? 'under' : 'ink';
        return <g key={line.id} data-won-player={line.id} data-champion={line.champion} data-score-tone={tone}>
          <polyline className={line.champion ? 'cw-chart-champion' : 'cw-chart-other'} points={line.points.map(p => `${p.x},${p.y}`).join(' ')} />
          {line.champion && line.points.map((point, i) => <g key={i}><circle className="cw-chart-dot" cx={point.x} cy={point.y} r={4} />{point.position && <text className="cw-chart-position" x={point.x} y={point.y - 9} textAnchor="middle">{point.position.tied ? 'T' : ''}{point.position.position}</text>}</g>)}
          <text className={line.champion ? 'cw-chart-end cw-chart-end-champion' : 'cw-chart-end'} x={end.x + 8} y={line.labelY} data-won-end-label textLength={line.name.length > 12 ? 94 : undefined} lengthAdjust="spacingAndGlyphs">{line.name} <tspan className="cw-chart-score">{score(end.value)}</tspan></text>
        </g>;
      })}
    </svg>
  </div><p className="cw-chart-caption">{champion?.name} against the two who finished behind {pronoun === 'her' ? 'her' : 'him'}, to par after each round. {pronoun === 'her' ? 'Her' : 'His'} position sits on each round.</p></>;
}