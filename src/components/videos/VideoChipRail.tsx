import React from 'react';
import '../../styles/video-chips.css';

export type LengthKey = 'all' | 'under4' | '4to20' | 'over20';

const MAP: Record<LengthKey, string> = {
  all: 'All',
  under4: 'Under 4 mins',
  '4to20': '4–20 mins',
  over20: 'Over 20 mins',
};

export default function VideoChipRail({
  value,
  onChange,
}: {
  value: LengthKey;
  onChange: (v: LengthKey) => void;
}) {
  return (
    <div className="chip-rail">
      {Object.entries(MAP).map(([k, label]) => (
        <button
          key={k}
          className={['chip', value === k ? 'chip--active' : ''].join(' ')}
          onClick={() => onChange(k as LengthKey)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
