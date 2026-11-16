/** Responsive width is observed locally; chart data never triggers a read.
 * A key line above the chart names each line (board order); the plot runs edge to edge. */
import { useLayoutEffect, useRef, useState } from 'react';
import type { BoardEntry } from '../../leaderboard/BoardTable';
import { wonChart, type WeekFacts } from '../data/weekFactsRules';
import { score } from '../data/tournamentRules';

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
  void tourCode;
  return <><div className="cw-key" data-won-key>
    {chart.lines.map(line => {
      const end = line.points[line.points.length - 1];
      const tone = end && end.value < 0 ? 'under' : 'ink';
      return <span key={line.id} className="cw-key-item" data-won-key-item data-champion={line.champion} data-score-tone={tone}>
        <i aria-hidden="true" /><span className="cw-key-name">{line.name}</span><b className="cw-key-score">{` ${end ? score(end.value) : ''}`}</b>
      </span>;
    })}
  </div><div ref={ref} className="cw-chart" data-cw-section="path">
    <svg viewBox={`0 0 ${width} 126`} width="100%" height="126" role="img" aria-label="How it was won, to par after each round">
      {chart.rounds.map(round => <g key={round.label}><line className="cw-chart-guide" x1={round.x} x2={round.x} y1={12} y2={110} /><text className="cw-chart-round" x={round.x} y={124} textAnchor="middle">{round.label}</text></g>)}
      {[...chart.lines].sort((a, b) => Number(a.champion) - Number(b.champion)).map(line => {
        const end = line.points[line.points.length - 1];
        if (!end) return null;
        const tone = end.value < 0 ? 'under' : 'ink';
        return <g key={line.id} data-won-player={line.id} data-champion={line.champion} data-score-tone={tone}>
          <polyline className={line.champion ? 'cw-chart-champion' : 'cw-chart-other'} points={line.points.map(p => `${p.x},${p.y}`).join(' ')} />
          {line.champion && line.points.map((point, i) => <g key={i}><circle className="cw-chart-dot" cx={point.x} cy={point.y} r={4} />{point.position && <text className="cw-chart-position" x={point.x} y={point.y - 9} textAnchor="middle">{point.position.tied ? 'T' : ''}{point.position.position}</text>}</g>)}
        </g>;
      })}
    </svg>
  </div></>;
}