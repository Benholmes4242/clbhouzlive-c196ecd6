import React from 'react';
import { TapButton } from '@/components/ui/TapButton';
import { haptic } from '@/utils/haptics';
import type { VisibilityMode } from '../hooks/useVisibility';

interface VisibilitySegmentedControlProps {
  value: VisibilityMode;
  onChange: (mode: VisibilityMode) => void;
}

export function VisibilitySegmentedControl({ value, onChange }: VisibilitySegmentedControlProps) {
  const segments: { mode: VisibilityMode; label: string; icon: string }[] = [
    { mode: 'all', label: 'Everyone', icon: '✅' },
    { mode: 'friends', label: 'Friends', icon: '👥' },
    { mode: 'hidden', label: 'Hidden', icon: '⛔️' },
  ];

  const getSliderTransform = () => {
    switch (value) {
      case 'all': return 'translateX(0%)';
      case 'friends': return 'translateX(100%)';
      case 'hidden': return 'translateX(200%)';
    }
  };

  const getSliderStyle = () => {
    switch (value) {
      case 'all':
        return {
          background: 'radial-gradient(circle at 30% 30%, rgba(110, 146, 119, 0.35) 0%, rgba(110, 146, 119, 0.18) 100%)',
          border: '1px solid rgba(110, 146, 119, 0.5)',
          boxShadow: '0 0 20px rgba(110, 146, 119, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
        };
      case 'friends':
        return {
          background: 'radial-gradient(circle at 30% 30%, rgba(96, 96, 140, 0.35) 0%, rgba(96, 96, 140, 0.18) 100%)',
          border: '1px solid rgba(180, 180, 255, 0.45)',
          boxShadow: '0 0 20px rgba(96, 96, 140, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
        };
      case 'hidden':
        return {
          background: 'rgba(20, 20, 20, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 0 16px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
        };
    }
  };

  const getStatusText = () => {
    switch (value) {
      case 'all':
        return { text: 'Visible to all golfers nearby', color: '#4CD964' };
      case 'friends':
        return { text: 'Visible to friends nearby', color: '#6ea8ff' };
      case 'hidden':
        return { text: 'Hidden from nearby golfers', color: '#8E8E93' };
    }
  };

  const statusInfo = getStatusText();

  const handleChange = (mode: VisibilityMode) => {
    if (mode !== value) {
      haptic('light');
      onChange(mode);
    }
  };

  return (
    <div className="mb-2">
      <div 
        className="rounded-3xl bg-[var(--hub-glass-bg)]/60 backdrop-blur-md border border-[var(--hub-stroke)]/50 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset,0_8px_30px_rgba(0,0,0,0.35)] p-2"
      >
        <h2 className="sr-only">Visibility</h2>
        
        {/* Segmented control */}
        <div 
          role="group" 
          aria-label="Visibility mode"
          className="flex gap-2"
        >
          {segments.map((segment) => {
            const isActive = value === segment.mode;
            
            return (
              <button
                key={segment.mode}
                aria-pressed={isActive}
                onClick={() => handleChange(segment.mode)}
                className={`
                  flex-1 rounded-xl px-4 py-2 text-[13px] font-medium
                  transition-colors
                  focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/60
                  ${isActive 
                    ? 'bg-white/8 border border-[var(--hub-stroke)]/60 shadow-inner text-[var(--hub-text)]' 
                    : 'bg-transparent border border-transparent text-[var(--hub-text-sub)]'
                  }
                `.trim().replace(/\s+/g, ' ')}
              >
                <span className="inline-flex items-center justify-center gap-1.5">
                  <span className="text-[14px]" aria-hidden="true">{segment.icon}</span>
                  <span>{segment.label}</span>
                </span>
              </button>
            );
          })}
        </div>
        
        {/* Dynamic status text with ARIA live region */}
        <p 
          aria-live="polite" 
          aria-atomic="true"
          className="mt-2 text-xs text-[var(--hub-text-dim)] text-center"
        >
          {value === 'all' && "Visible to all golfers nearby"}
          {value === 'friends' && "Visible to friends nearby"}
          {value === 'hidden' && "Hidden from nearby golfers"}
        </p>
      </div>
    </div>
  );
}
