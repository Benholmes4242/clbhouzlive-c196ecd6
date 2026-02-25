/**
 * ConfidenceGauge — Circular SVG confidence ring
 * Arc color is driven by the parent's accentColor prop.
 * Animates from 0 → target on mount (once).
 */

import React, { useState, useEffect, useRef } from 'react';
import { ConfidenceTier } from '../types';

interface ConfidenceGaugeProps {
  tier: ConfidenceTier;
  /** The arc color — matches the card's accent */
  accentColor?: string;
  /** Delay before arc animation starts (ms) */
  animationDelay?: number;
  isWithdrawn?: boolean;
}

const tierToPercentage: Record<ConfidenceTier, number> = {
  elite: 92,
  high: 78,
  medium: 65,
};

const ConfidenceGauge: React.FC<ConfidenceGaugeProps> = ({
  tier,
  accentColor = '#9CA3AF',
  animationDelay = 500,
  isWithdrawn = false,
}) => {
  const percentage = isWithdrawn ? 0 : tierToPercentage[tier];
  const arcColor = isWithdrawn ? '#9CA3AF' : accentColor;
  const [animatedPct, setAnimatedPct] = useState(0);
  const hasAnimated = useRef(false);
  const gaugeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasAnimated.current) return;
    const el = gaugeRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          setTimeout(() => setAnimatedPct(percentage), animationDelay);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [percentage, animationDelay]);

  const size = 54;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (circumference * animatedPct) / 100;

  return (
    <div ref={gaugeRef} className="flex flex-col items-center gap-1">
      <span
        style={{
          fontSize: 9.5,
          fontWeight: 600,
          letterSpacing: '0.5px',
          textTransform: 'uppercase' as const,
          color: 'rgba(0,0,0,0.3)',
        }}
      >
        AI Confidence
      </span>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(0,0,0,0.06)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={arcColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dashoffset 800ms cubic-bezier(0.16, 1, 0.3, 1)' }}
          />
        </svg>
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ color: arcColor }}
        >
          <span style={{ fontSize: 15, fontWeight: 700, lineHeight: 1 }}>
            {isWithdrawn ? '—' : percentage}
          </span>
          {!isWithdrawn && (
            <span style={{ fontSize: 10, fontWeight: 600, marginTop: 1 }}>%</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfidenceGauge;
