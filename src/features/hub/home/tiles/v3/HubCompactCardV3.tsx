/**
 * HubCompactCardV3 - Premium compact card for section items
 * 80-86px tall, stronger shadows, sport-status driven
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
  showDot?: boolean;
  dotColor?: string;
  onClick?: () => void;
  // For "Your World" calmer variant
  calmer?: boolean;
}

const pillVariants = {
  default: {
    background: 'rgba(15, 23, 42, 0.08)',
    color: 'var(--hub-text-dim)',
    border: 'rgba(15, 23, 42, 0.10)',
  },
  live: {
    background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
    color: '#fff',
    border: 'transparent',
  },
  success: {
    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    color: '#fff',
    border: 'transparent',
  },
  muted: {
    background: 'rgba(15, 23, 42, 0.05)',
    color: 'var(--hub-text-dimmer)',
    border: 'rgba(15, 23, 42, 0.08)',
  },
};

export function HubCompactCardV3({ 
  icon, 
  iconBg = 'var(--hub-surface-2)', 
  title, 
  subtitle, 
  rightPill,
  showDot,
  dotColor = '#22C55E',
  onClick,
  calmer = false,
}: HubCompactCardV3Props) {
  const pillStyle = rightPill ? pillVariants[rightPill.variant || 'default'] : null;
  const isGradientPill = rightPill?.variant === 'live' || rightPill?.variant === 'success';

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3.5 p-4 rounded-2xl text-left transition-all duration-150 active:scale-[0.99]"
      style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFBFC 100%)',
        border: '1px solid rgba(0, 0, 0, 0.04)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)',
        minHeight: '80px',
      }}
    >
      {/* Icon container - gradient backgrounds */}
      <div
        className="w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0"
        style={{
          background: calmer
            ? 'rgba(15, 23, 42, 0.05)'
            : iconBg || 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
        }}
      >
        {icon}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <p
          className="font-semibold text-[15px] line-clamp-1"
          style={{ color: '#1e293b' }}
        >
          {title}
        </p>
        {subtitle && (
          <p
            className="text-[13px] mt-0.5 line-clamp-1"
            style={{ color: '#64748b' }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Right side: pill + dot + chevron in circle */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        {/* Status pill with optional dot */}
        {rightPill && pillStyle && (
          <div className="flex items-center gap-1.5">
            {showDot && (
              <div 
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: dotColor }}
              />
            )}
            <div 
              className="px-2.5 py-1 rounded-full text-[11px] font-bold"
              style={{
                background: pillStyle.background,
                color: pillStyle.color,
                border: isGradientPill ? 'none' : `1px solid ${pillStyle.border}`,
                boxShadow: isGradientPill ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
              }}
            >
              {rightPill.text}
            </div>
          </div>
        )}
        
        {/* Chevron */}
        <ChevronRight className="h-5 w-5 text-slate-300" />
      </div>
    </button>
  );
}
