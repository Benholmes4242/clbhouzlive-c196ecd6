/** All five scores share the same pointer/keyboard scale and segmented fill. */
import React from 'react';
import { useScoreRuler } from '../hooks/useScoreRuler';

export function ScoreBar({ value, onChange, ariaLabel }: {
  value: number | null; onChange: (value: number) => void; ariaLabel: string;
}) {
  const ruler = useScoreRuler(value, onChange);
  return <div className="review-score-bar-slot">
    <div ref={ruler.ref} role="slider" tabIndex={0} aria-valuemin={1} aria-valuemax={10}
      aria-valuenow={value ?? undefined} aria-valuetext={value == null ? 'Not scored' : undefined}
      aria-label={ariaLabel} onPointerDown={ruler.onPointerDown} onKeyDown={ruler.onKeyDown}
      className="review-score-bar" data-dragging={ruler.dragging}>
      {Array.from({ length: 10 }, (_, i) => {
        const fill = Math.round(Math.max(0, Math.min(1, (value ?? 0) - i)) * 100);
        return <i key={i} aria-hidden="true" className="review-score-segment">
          <span className="review-score-segment-fill" style={{ width: `${fill}%` }} />
        </i>;
      })}
    </div>
  </div>;
}