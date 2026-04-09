import { memo } from 'react';
import { getScoreColorSet } from '../../utils/scoreColors';
import type { LeaderHoleScore } from '../../hooks/useLeaderHoleScores';

interface HoleStripWithSparklineProps {
  holes: LeaderHoleScore[];
  totalHoles?: number;
  label?: string;
}

export const HoleStripWithSparkline = memo(function HoleStripWithSparkline({
  holes,
  totalHoles = 18,
  label,
}: HoleStripWithSparklineProps) {
  const running = holes.reduce<number[]>((acc, h, i) => {
    acc.push((acc[i - 1] ?? 0) + h.scoreToPar);
    return acc;
  }, []);

  const min = Math.min(...running, 0);
  const max = Math.max(...running, 0);
  const range = max - min || 1;

  const DOT_AREA = 32;
  const SPARK_H = 48;
  const TOTAL_H = DOT_AREA + SPARK_H;

  const allHoles: (LeaderHoleScore | null)[] = [
    ...holes,
    ...Array(Math.max(0, totalHoles - holes.length)).fill(null),
  ];

  const svgWidth = totalHoles * 20;

  return (
    <div style={{ width: '100%' }}>
      {label && (
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.30)', marginBottom: 6 }}>
          {label}
        </div>
      )}

      <div style={{ position: 'relative', height: TOTAL_H, width: '100%', overflowX: 'auto', overflowY: 'hidden', scrollbarWidth: 'none' as const }}>
        {/* Sparkline SVG */}
        <svg
          viewBox={`0 0 ${svgWidth} ${SPARK_H}`}
          preserveAspectRatio="none"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: SPARK_H, overflow: 'visible' }}
        >
          <defs>
            <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(34,197,94,0.30)" />
              <stop offset="100%" stopColor="rgba(34,197,94,0)" />
            </linearGradient>
          </defs>

          {/* Par baseline */}
          {(() => {
            const y = SPARK_H - ((-min) / range) * (SPARK_H - 6) - 3;
            return (
              <line x1="0" y1={y} x2={svgWidth} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="3,3" />
            );
          })()}

          {/* Area fill */}
          {running.length > 1 && (() => {
            const pts = running.map((v, i) => {
              const x = (i / (totalHoles - 1)) * svgWidth;
              const y = SPARK_H - ((v - min) / range) * (SPARK_H - 6) - 3;
              return `${x},${y}`;
            }).join(' ');
            const lastX = ((running.length - 1) / (totalHoles - 1)) * svgWidth;
            const baseY = SPARK_H - ((-min) / range) * (SPARK_H - 6) - 3;
            return (
              <polygon points={`${pts} ${lastX},${baseY} 0,${baseY}`} fill="url(#sparkGrad)" />
            );
          })()}

          {/* Line */}
          {running.length > 1 && (() => {
            const pts = running.map((v, i) => {
              const x = (i / (totalHoles - 1)) * svgWidth;
              const y = SPARK_H - ((v - min) / range) * (SPARK_H - 6) - 3;
              return `${x},${y}`;
            }).join(' ');
            return (
              <polyline points={pts} fill="none" stroke="#22C55E" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            );
          })()}

          {/* Live dot */}
          {running.length > 0 && (() => {
            const lastIdx = running.length - 1;
            const x = (lastIdx / (totalHoles - 1)) * svgWidth;
            const y = SPARK_H - ((running[lastIdx] - min) / range) * (SPARK_H - 6) - 3;
            return <circle cx={x} cy={y} r={3.5} fill="#22C55E" stroke="rgba(0,0,0,0.4)" strokeWidth="1" />;
          })()}
        </svg>

        {/* Hole dots */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          display: 'flex', justifyContent: 'space-between',
          height: DOT_AREA,
        }}>
          {allHoles.map((h, i) => {
            const isPlayed = h !== null;
            const score = h?.scoreToPar ?? 0;
            const colors = isPlayed ? getScoreColorSet(score) : null;
            const isCircle = isPlayed && score <= -1;
            const isSquare = isPlayed && score >= 1;

            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flex: 1 }}>
                <span style={{ fontSize: 8, fontWeight: 600, color: isPlayed ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.18)', lineHeight: 1 }}>
                  {i + 1}
                </span>
                <div style={{
                  width: 16, height: 16,
                  borderRadius: isCircle ? '50%' : isSquare ? 3 : '50%',
                  background: isPlayed
                    ? (score === 0 ? 'rgba(255,255,255,0.10)' : colors!.bg)
                    : 'transparent',
                  border: isPlayed
                    ? (score !== 0 ? `1.5px solid ${colors!.ring}` : '1.5px solid rgba(255,255,255,0.10)')
                    : '1.5px dashed rgba(255,255,255,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: isPlayed && score !== 0 ? `0 0 6px ${colors!.ring}` : 'none',
                }}>
                  {isPlayed && score !== 0 && (
                    <span style={{ fontSize: 7, fontWeight: 800, color: colors!.text, lineHeight: 1 }}>
                      {score <= -2 ? `${score}` : score === -1 ? '−1' : `+${score}`}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
