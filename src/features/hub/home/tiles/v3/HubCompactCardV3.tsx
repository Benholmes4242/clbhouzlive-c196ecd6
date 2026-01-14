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
      className="w-full flex items-center gap-3.5 p-4 rounded-[20px] text-left transition-all duration-150 active:scale-[0.99]"
      style={{
        background: 'var(--hub-card)',
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
        minHeight: '82px',
      }}
    >
      {/* Icon badge - solid chip style */}
      <div 
        className="h-10 w-10 rounded-[14px] flex items-center justify-center flex-shrink-0 relative"
        style={{ 
          background: calmer ? 'rgba(15, 23, 42, 0.06)' : iconBg,
        }}
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
            className="text-[13px] mt-0.5 line-clamp-1"
            style={{ color: 'var(--hub-text-dim)' }}
          >
            {subtitle}
          </div>
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
        
        {/* Chevron in faint circle */}
        <div 
          className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(15, 23, 42, 0.04)' }}
        >
          <ChevronRight 
            className="h-4 w-4" 
            style={{ color: 'var(--hub-text-dimmer)' }} 
          />
        </div>
      </div>
    </button>
  );
}
