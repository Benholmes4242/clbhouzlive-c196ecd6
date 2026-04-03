import React from 'react';

interface TimeModeToggleProps {
  value: 'seasonal' | 'all_time';
  onChange: (value: 'seasonal' | 'all_time') => void;
  seasonYear?: number;
}

/**
 * TimeModeToggle — Inline tab style that sits flush at the bottom of the green header.
 * Rounded-t corners, active tab matches page bg, inactive is translucent white.
 */
export const TimeModeToggle: React.FC<TimeModeToggleProps> = ({
  value,
  onChange,
  seasonYear,
}) => {
  const yearLabel = `${seasonYear ?? new Date().getFullYear()} Season`;

  const options = [
    { id: 'seasonal' as const, label: yearLabel },
    { id: 'all_time' as const, label: 'All-Time' },
  ];

  return (
    <div className="flex" style={{ gap: 0 }}>
      {options.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            flex: 1,
            padding: 'clamp(8px,2vw,10px) 0',
            borderRadius: '10px 10px 0 0',
            border: 'none',
            cursor: 'pointer',
            fontSize: 'clamp(12px,3vw,13px)',
            fontWeight: value === t.id ? 800 : 500,
            fontFamily: 'DM Sans,system-ui,sans-serif',
            background: value === t.id ? '#F0F2F5' : 'rgba(255,255,255,0.08)',
            color: value === t.id ? '#0C0C0E' : 'rgba(255,255,255,0.65)',
            transition: 'all 0.2s',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
};

export default TimeModeToggle;
