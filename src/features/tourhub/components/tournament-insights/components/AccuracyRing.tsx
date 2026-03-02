/**
 * AccuracyRing - SVG circular progress ring with IntersectionObserver animation
 */

import React, { useState, useEffect, useRef } from 'react';

interface AccuracyRingProps {
  hit: number;
  total: number;
  size?: number;
}

const AccuracyRing: React.FC<AccuracyRingProps> = ({ hit, total, size = 120 }) => {
  const [animated, setAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const percentage = total > 0 ? (hit / total) * 100 : 0;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = animated ? circumference - (circumference * percentage) / 100 : circumference;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#16A34A"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center"
      >
        <span
          className="text-foreground"
          style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em' }}
        >
          {hit}/{total}
        </span>
      </div>
    </div>
  );
};

export default AccuracyRing;
