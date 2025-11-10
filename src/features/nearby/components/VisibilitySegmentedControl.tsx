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
    <section aria-labelledby="vis-title" className="w-full">
      <h2 id="vis-title" className="sr-only">Visibility</h2>
      
      {/* Segmented control */}
      <div 
        role="group" 
        aria-label="Visibility mode"
        className="relative flex gap-1.5 w-full p-1.5 rounded-2xl bg-white/[0.04] border border-white/10 shadow-[0_20px_48px_rgba(0,0,0,.5)]"
      >
        {/* Animated pill slider */}
        <div
          aria-hidden="true"
          className="absolute top-1.5 bottom-1.5 rounded-[14px] transition-transform duration-200 ease-out pointer-events-none"
          style={{
            width: 'calc(33.333% - 4px)',
            left: '6px',
            transform: getSliderTransform(),
            ...getSliderStyle(),
          }}
        />

        {/* Buttons */}
        {segments.map((segment) => {
          const isActive = value === segment.mode;
          
          return (
            <TapButton
              key={segment.mode}
              aria-pressed={isActive}
              onPointerDown={() => handleChange(segment.mode)}
              className={`
                relative flex-1 py-2.5 px-2 text-[13px] font-semibold rounded-[14px] 
                transition-colors duration-100
                ${isActive ? 'text-white' : 'text-white/60'}
              `}
              style={{ minHeight: '40px', zIndex: 1 }}
            >
              <span className="inline-flex items-center justify-center gap-1.5">
                <span className="text-[14px]" aria-hidden="true">{segment.icon}</span>
                <span>{segment.label}</span>
              </span>
            </TapButton>
          );
        })}
      </div>
      
      {/* Dynamic status text with ARIA live region */}
      <p 
        aria-live="polite" 
        aria-atomic="true"
        className="mt-2.5 text-center text-[13px] transition-colors duration-200"
        style={{ color: statusInfo.color }}
      >
        {statusInfo.text}
      </p>
    </section>
  );
}
