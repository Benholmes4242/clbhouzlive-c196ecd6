import { memo } from 'react';
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

  const DOT_AREA = 26;
  const SPARK_H = 44;
  const TOTAL_H = DOT_AREA + SPARK_H;

  const allHoles: (LeaderHoleScore | null)[] = [
    ...holes,
    ...Array(Math.max(0, totalHoles - holes.length)).fill(null),
  ];

  const svgWidth = totalHoles * 20;

  return (
    <div style={{ width: '100%' }}>
      {label && (
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>
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
              <stop offset="0%" stopColor="rgba(34,197,94,0.25)" />
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
              <polyline points={pts} fill="none" stroke="#22C55E" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
            );
          })()}

          {/* Live dot */}
          {running.length > 0 && (() => {
            const lastIdx = running.length - 1;
            const x = (lastIdx / (totalHoles - 1)) * svgWidth;
            const y = SPARK_H - ((running[lastIdx] - min) / range) * (SPARK_H - 6) - 3;
            return <circle cx={x} cy={y} r={3} fill="#22C55E" stroke="rgba(0,0,0,0.4)" strokeWidth="1" />;
          })()}
        </svg>

        {/* Hole dots */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          display: 'flex', justifyContent: 'space-between',
          height: DOT_AREA,
        }}>
          {allHoles.map((h, i) => {
            const isPlayed = h !== null && h.strokes > 0;
            const score    = isPlayed ? h.scoreToPar : null;
            const isHIO    = isPlayed && h.strokes === 1;

            const dotStyle = (() => {
              if (!isPlayed) return {
                background: 'transparent',
                border: '1px dashed rgba(255,255,255,0.22)',
                borderRadius: '50%',
              };
              if (isHIO) return {
                background: 'rgba(255,215,0,0.22)',
                border: '1.5px solid #FFD700',
                borderRadius: '50%',
                boxShadow: '0 0 7px rgba(255,215,0,0.55)',
              };
              if (score! <= -2) return {       // Eagle or better — green
                background: 'rgba(34,197,94,0.20)',
                border: '1.5px solid #22C55E',
                borderRadius: '50%',
                boxShadow: '0 0 6px rgba(34,197,94,0.40)',
              };
              if (score === -1) return {       // Birdie — amber
                background: 'rgba(247,147,30,0.18)',
                border: '1.5px solid #F7931E',
                borderRadius: '50%',
                boxShadow: '0 0 5px rgba(247,147,30,0.35)',
              };
              if (score === 0) return {        // Par — dashed outline only, no fill
                background: 'transparent',
                border: '1px dashed rgba(255,255,255,0.35)',
                borderRadius: '50%',
              };
              if (score === 1) return {        // Bogey — red square
                background: 'rgba(239,68,68,0.15)',
                border: '1.5px solid #EF4444',
                borderRadius: 3,
                boxShadow: '0 0 5px rgba(239,68,68,0.30)',
              };
              return {                         // Double bogey or worse — dark red square
                background: 'rgba(153,27,27,0.20)',
                border: '1.5px solid #991B1B',
                borderRadius: 3,
              };
            })();

            const textColor = (() => {
              if (!isPlayed || score === null) return 'rgba(255,255,255,0.5)';
              if (isHIO)        return '#FFD700';
              if (score <= -2)  return '#22C55E';
              if (score === -1) return '#F7931E';
              if (score === 1)  return '#EF4444';
              if (score >= 2)   return '#991B1B';
              return 'rgba(255,255,255,0.5)';
            })();

            const label = (() => {
              if (!isPlayed || score === null) return null;
              if (isHIO)       return 'HIO';
              if (score === 0) return null;      // par — no label, dashed circle is enough
              return score < 0 ? `${score}` : `+${score}`;
            })();

            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flex: 1 }}>
                <span style={{ fontSize: 7, fontWeight: 600, color: 'rgba(255,255,255,0.25)', lineHeight: 1 }}>
                  {i + 1}
                </span>
                <div style={{ width: 13, height: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', ...dotStyle }}>
                  {label && (
                    <span style={{ fontSize: isHIO ? 4.5 : 6, fontWeight: 800, color: textColor, lineHeight: 1 }}>
                      {label}
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
