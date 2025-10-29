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
      <div className="mb-2 text-sm font-medium text-white">Visibility</div>
      <div className="text-xs text-white/60 mb-3">Control who can see you nearby</div>
      
      <div 
        className="relative flex w-full rounded-full p-1"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
        }}
      >
        {segments.map((segment, idx) => {
          const isActive = value === segment.mode;
          const isFirst = idx === 0;
          const isLast = idx === segments.length - 1;
          
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
                    ? 'text-white shadow-[0_0_8px_rgba(110,146,119,0.4)]' 
                    : 'text-white/60 hover:bg-white/10'
                  }
                `}
                style={
                  isActive
                    ? {
                        background: 'linear-gradient(90deg, #6e9277, #81a88b)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
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
