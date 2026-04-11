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

  const DOT_AREA = 31;
  const SPARK_H = 44;
  const TOTAL_H = DOT_AREA + SPARK_H;

  const allHoles: (LeaderHoleScore | null)[] = [
    ...holes,
    ...Array(Math.max(0, totalHoles - holes.length)).fill(null),
  ];

  const svgWidth = totalHoles * 20;
  const INSET = 6;

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
              <stop offset="0%" stopColor="rgba(255,255,255,0.20)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
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
              const x = (i / (totalHoles - 1)) * (svgWidth - INSET);
              const y = SPARK_H - ((v - min) / range) * (SPARK_H - 6) - 3;
              return `${x},${y}`;
            }).join(' ');
            const lastX = ((running.length - 1) / (totalHoles - 1)) * (svgWidth - INSET);
            const baseY = SPARK_H - ((-min) / range) * (SPARK_H - 6) - 3;
            return (
              <polygon points={`${pts} ${lastX},${baseY} 0,${baseY}`} fill="url(#sparkGrad)" />
            );
          })()}

          {/* Line */}
          {running.length > 1 && (() => {
            const pts = running.map((v, i) => {
              const x = (i / (totalHoles - 1)) * (svgWidth - INSET);
              const y = SPARK_H - ((v - min) / range) * (SPARK_H - 6) - 3;
              return `${x},${y}`;
            }).join(' ');
            return (
              <polyline points={pts} fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
            );
          })()}

          {/* Live dot */}
          {running.length > 0 && (() => {
            const lastIdx = running.length - 1;
            const x = (lastIdx / (totalHoles - 1)) * (svgWidth - INSET);
            const y = SPARK_H - ((running[lastIdx] - min) / range) * (SPARK_H - 6) - 3;
            return <circle cx={x} cy={y} r={3} fill="#ffffff" stroke="rgba(0,0,0,0.4)" strokeWidth="1" />;
          })()}
        </svg>

        {/* Hole dots */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          display: 'flex', justifyContent: 'space-between',
          height: DOT_AREA,
        }}>
          {allHoles.map((h, i) => {
            const isPlayed  = h !== null && h.strokes > 0;
            const score     = isPlayed ? h.scoreToPar : null;
            const isHIO     = isPlayed && h.strokes === 1;
            const isCircle  = isPlayed && score! <= -1;
            const isSquare  = isPlayed && score! >= 1;
            const isPar     = isPlayed && score === 0;

            const dotStyle = (() => {
              if (!isPlayed) return {
                background: 'transparent',
                border: '1px dashed rgba(255,255,255,0.10)',
                borderRadius: '50%',
              };
              if (isHIO) return {
                background: 'rgba(255,215,0,0.22)',
                border: '1.5px solid #FFD700',
                borderRadius: '50%',
              };
              // Eagle or better — red double-ring circle
              if (score! <= -2) return {
                background: 'rgba(248,113,113,0.06)',
                border: '1px solid #f87171',
                borderRadius: '50%',
                outline: '1px solid #f87171',
                outlineOffset: '1px',
              } as React.CSSProperties;
              // Birdie — red square
              if (score === -1) return {
                background: 'rgba(248,113,113,0.08)',
                border: '1px solid #f87171',
                borderRadius: 2,
              };
              // Par — white circle (like old birdie)
              if (isPar) return {
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.6)',
                borderRadius: '50%',
              };
              // Bogey — muted grey square
              if (score === 1) return {
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 2,
              };
              // Double bogey+ — muted grey double-border square
              return {
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 2,
                outline: '1px solid rgba(255,255,255,0.18)',
                outlineOffset: '1px',
              } as React.CSSProperties;
            })();

            const textColor = (() => {
              if (!isPlayed) return 'transparent';
              if (isHIO)        return '#FFD700';
              if (score! <= -2) return '#f87171';
              if (score === -1) return '#f87171';
              if (isPar)        return '#ffffff';
              if (score === 1)  return 'rgba(255,255,255,0.35)';
              return 'rgba(255,255,255,0.35)';
            })();

            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flex: 1 }}>
                <span style={{ fontSize: 8.5, fontWeight: 600, color: 'rgba(255,255,255,0.25)', lineHeight: 1 }}>
                  {i + 1}
                </span>
                <div style={{ width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', ...dotStyle }}>
                  {isPlayed && (
                    <span style={{ fontSize: 8, fontWeight: 800, color: textColor, lineHeight: 1 }}>
                      {isHIO ? '①' : h!.strokes}
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
