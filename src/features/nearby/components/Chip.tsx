import React from 'react';
import './Chip.css';

type Props = {
  leading?: React.ReactNode;
  label: string;
  valueText?: string;
  active?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
};

export function Chip({ 
  leading, 
  label, 
  valueText, 
  active, 
  onClick, 
  ariaLabel 
}: Props) {
  return (
    <button
      type="button"
      className={`chip ${active ? 'is-active' : ''}`}
      aria-pressed={!!active}
      aria-label={ariaLabel ?? label}
      onClick={() => { 
        onClick?.(); 
        (navigator as any)?.vibrate?.(4); 
      }}
    >
      {leading && <span className="chipIcon">{leading}</span>}
      <span className="chipText">
        <span className="chipLabel">{label}</span>
        {valueText && <span className="chipValue">{valueText}</span>}
      </span>
    </button>
  );
}
