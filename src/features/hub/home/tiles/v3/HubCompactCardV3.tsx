/**
 * HubCompactCardV3 - Reusable compact card for section items
 * 76-92px tall, full width, rounded 18-22px
 * Left: icon badge, Main: title + subtitle, Right: status pill
 */

import React from 'react';
import { ChevronRight } from 'lucide-react';

interface HubCompactCardV3Props {
  icon: React.ReactNode;
  iconBg?: string;
  title: string;
  subtitle?: string;
  rightPill?: {
    text: string;
    variant?: 'default' | 'live' | 'success' | 'muted';
  };
  onClick?: () => void;
}

const pillVariants = {
  default: {
    background: 'rgba(15, 23, 42, 0.06)',
    color: 'var(--hub-text-dim)',
    border: 'rgba(15, 23, 42, 0.08)',
  },
  live: {
    background: 'rgba(239, 68, 68, 0.12)',
    color: '#DC2626',
    border: 'rgba(239, 68, 68, 0.20)',
  },
  success: {
    background: 'var(--hub-badge-green-bg)',
    color: 'var(--hub-badge-green-text)',
    border: 'var(--hub-badge-green-border)',
  },
  muted: {
    background: 'rgba(15, 23, 42, 0.04)',
    color: 'var(--hub-text-dimmer)',
    border: 'rgba(15, 23, 42, 0.06)',
  },
};

export function HubCompactCardV3({ 
  icon, 
  iconBg = 'var(--hub-surface-2)', 
  title, 
  subtitle, 
  rightPill,
  onClick 
}: HubCompactCardV3Props) {
  const pillStyle = rightPill ? pillVariants[rightPill.variant || 'default'] : null;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3.5 rounded-[20px] text-left transition-all duration-150 active:scale-[0.99]"
      style={{
        background: 'var(--hub-card)',
        border: '1px solid var(--hub-card-border)',
        boxShadow: 'var(--hub-shadow-soft)',
        minHeight: '76px',
      }}
    >
      {/* Icon badge */}
      <div 
        className="h-10 w-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
        style={{ background: iconBg }}
      >
        {icon}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div 
          className="text-[15px] font-semibold line-clamp-1"
          style={{ color: 'var(--hub-text)' }}
        >
          {title}
        </div>
        {subtitle && (
          <div 
            className="text-[12px] mt-0.5 line-clamp-1"
            style={{ color: 'var(--hub-text-dim)' }}
          >
            {subtitle}
          </div>
        )}
      </div>

      {/* Right pill or chevron */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {rightPill && pillStyle && (
          <div 
            className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
            style={{
              background: pillStyle.background,
              color: pillStyle.color,
              border: `1px solid ${pillStyle.border}`,
            }}
          >
            {rightPill.text}
          </div>
        )}
        <ChevronRight 
          className="h-4 w-4" 
          style={{ color: 'var(--hub-text-dimmer)' }} 
        />
      </div>
    </button>
  );
}
