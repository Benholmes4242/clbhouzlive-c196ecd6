/** Signed-off Step 2 ruler; score ink follows courseSubScoreTone's white rule. */
import React from 'react';
import { useScoreRuler } from '../hooks/useScoreRuler';
import { scorePercent } from '../lib/scoreStepRules';

interface Props {
  value: number | null;
  onChange: (value: number) => void;
  caption: string;
  ariaLabel: string;
  calibration?: string | null;
}
export function OverallScrubber({ value, onChange, caption, ariaLabel, calibration }: Props) {
  const ruler = useScoreRuler(value, onChange);
  const pct = value == null ? 0 : scorePercent(value);
  return <div>
    <div className="review-overall-number-row">
      <div className="review-score-number review-overall-number" data-empty={value == null}>{value == null ? '—' : value.toFixed(1)}</div>
      <div className="review-overall-denominator">/ 10</div>
    </div>
    <div className="review-overall-caption" data-empty={value == null}>{value == null ? caption : calibration}</div>
    <div ref={ruler.ref} role="slider" tabIndex={0} aria-valuemin={1} aria-valuemax={10}
      aria-valuenow={value ?? undefined} aria-valuetext={value == null ? 'Not scored' : undefined}
      aria-label={ariaLabel} onPointerDown={ruler.onPointerDown} onKeyDown={ruler.onKeyDown} className="review-score-ruler">
      <div className="review-score-track" />
      {value != null && <div className="review-score-fill" style={{ width: `${pct}%` }} />}
      {Array.from({ length: 10 }, (_, i) => <div key={i} aria-hidden className="review-score-tick" data-end={i === 0 || i === 9}
        data-filled={value != null && i / 9 * 100 <= pct} style={{ left: `${i / 9 * 100}%` }} />)}
      {value != null && <div aria-hidden data-score-thumb className="review-score-thumb" style={{ left: `${pct}%` }} />}
    </div>
    <div aria-hidden className="review-score-axis review-score-number">{Array.from({ length: 10 }, (_, i) => <span key={i}>{i + 1}</span>)}</div>
  </div>;
}
