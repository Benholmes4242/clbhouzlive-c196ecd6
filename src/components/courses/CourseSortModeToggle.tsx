import React from 'react';

export type CourseSortMode = 'rating' | 'personal';

interface Props {
  mode: CourseSortMode;
  onChange: (mode: CourseSortMode) => void;
  disabled?: boolean;
}

const baseBtn = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: '8px 12px',
  background: active ? '#FFFFFF' : 'transparent',
  border: 'none',
  borderRadius: 999,
  fontFamily: '"Geist", sans-serif',
  fontSize: 11,
  fontWeight: 600,
  color: active ? '#0F172A' : '#475569',
  boxShadow: active ? '0 1px 2px rgba(15,23,42,0.06)' : 'none',
  cursor: 'pointer',
  letterSpacing: '0.01em',
  transition: 'background 120ms ease, color 120ms ease',
});

/**
 * Two-position pill toggle for the courses tab: By Rating vs My Order.
 */
const CourseSortModeToggle: React.FC<Props> = ({ mode, onChange, disabled }) => {
  return (
    <div
      style={{
        display: 'flex',
        background: '#F1F5F9',
        borderRadius: 999,
        padding: 3,
        gap: 2,
        opacity: disabled ? 0.6 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
      }}
      role="tablist"
      aria-label="Course sort mode"
    >
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'rating'}
        onClick={() => onChange('rating')}
        style={baseBtn(mode === 'rating')}
      >
        By Rating
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'personal'}
        onClick={() => onChange('personal')}
        style={baseBtn(mode === 'personal')}
      >
        My Order
      </button>
    </div>
  );
};

export default CourseSortModeToggle;
