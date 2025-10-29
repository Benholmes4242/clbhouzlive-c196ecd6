import React from 'react';
import type { VisibilityMode } from '../hooks/useVisibility';

interface VisibilitySegmentedControlProps {
  value: VisibilityMode;
  onChange: (mode: VisibilityMode) => void;
}

export function VisibilitySegmentedControl({ value, onChange }: VisibilitySegmentedControlProps) {

  const segments: { mode: VisibilityMode; label: string }[] = [
    { mode: 'all', label: 'Everyone' },
    { mode: 'friends', label: 'Friends' },
    { mode: 'hidden', label: 'Hidden' },
  ];

  return (
    <div className="w-full">
      <div className="mb-2 text-sm font-medium text-white text-center">Visibility</div>
      <div className="text-xs text-white/60 mb-3 text-center">Control who can see you nearby</div>
      
      <div 
        className="relative flex w-full rounded-full p-1 border border-white/[0.08]"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
        }}
      >
        {segments.map((segment, idx) => {
          const isActive = value === segment.mode;
          const isFirst = idx === 0;
          const isLast = idx === segments.length - 1;
          
          // Different styling per mode
          const getActiveStyle = () => {
            if (segment.mode === 'all') {
              return {
                background: 'linear-gradient(90deg, #6e9277, #81a88b)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                className: 'text-white shadow-[0_0_8px_rgba(110,146,119,0.4)]'
              };
            } else if (segment.mode === 'friends') {
              return {
                background: 'rgba(255, 255, 255, 0.07)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                className: 'text-white'
              };
            } else {
              return {
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                className: 'text-white/70'
              };
            }
          };
          
          const activeStyle = getActiveStyle();
          
          return (
            <React.Fragment key={segment.mode}>
              {!isFirst && (
                <div 
                  className="w-px self-stretch my-2"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
                />
              )}
              <button
                onClick={() => onChange(segment.mode)}
                className={`
                  flex-1 py-2.5 px-4 text-[13px] font-medium transition-all duration-150
                  ${isFirst ? 'rounded-l-full' : ''} 
                  ${isLast ? 'rounded-r-full' : ''}
                  ${isActive 
                    ? activeStyle.className
                    : 'text-white/60 hover:bg-white/[0.08]'
                  }
                `}
                style={
                  isActive
                    ? {
                        background: activeStyle.background,
                        border: activeStyle.border,
                      }
                    : undefined
                }
              >
                {segment.label}
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
