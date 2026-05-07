import React from 'react';
import { ChevronRight } from 'lucide-react';

/**
 * <HeroCTA> — primary CTA button at the bottom of an editorial hero surface.
 * Ink #0F172A, 13px/800/0.02em, 14px radius, 13px padding, flex-shrink:0.
 */
export interface HeroCTAProps {
  label: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function HeroCTA({ label, onClick, style }: HeroCTAProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flexShrink: 0,
        width: '100%',
        padding: '13px',
        background: '#0F172A',
        border: 'none',
        borderRadius: 14,
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: 800,
        letterSpacing: '0.02em',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        cursor: 'pointer',
        ...style,
      }}
    >
      {label}
      <ChevronRight size={14} strokeWidth={2.4} />
    </button>
  );
}
