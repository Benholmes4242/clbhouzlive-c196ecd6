import React from 'react';
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

  const getStatusText = () => {
    switch (value) {
      case 'all':
        return "You're visible to golfers nearby 🌍";
      case 'friends':
        return "Only friends can see you 👥";
      case 'hidden':
        return "You're hidden right now ⛔️";
    }
  };

  return (
    <div className="w-full">
      <div className="mb-2 text-sm font-medium text-white text-center">Visibility</div>
      <div className="text-xs text-white/60 mb-3 text-center">Control who can see you nearby</div>
      
      <div className="flex gap-0.5 w-full p-1 rounded-full bg-white/5 border border-white/[0.08]">
        {segments.map((segment) => {
          const isActive = value === segment.mode;
          
          const getActiveStyle = () => {
            if (segment.mode === 'all') {
              return {
                background: 'rgba(110, 146, 119, 0.22)',
                border: '1px solid rgba(110, 146, 119, 0.5)',
                shadow: '0 0 8px rgba(110, 146, 119, 0.5)',
                textColor: 'text-white/90'
              };
            } else if (segment.mode === 'friends') {
              return {
                background: 'rgba(120, 120, 180, 0.18)',
                border: '1px solid rgba(255, 255, 255, 0.22)',
                shadow: 'none',
                textColor: 'text-white'
              };
            } else {
              return {
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                shadow: 'none',
                textColor: 'text-white/70'
              };
            }
          };
          
          const activeStyle = getActiveStyle();
          
          return (
            <button
              key={segment.mode}
              onClick={() => onChange(segment.mode)}
              className={`
                flex-1 py-2.5 px-3 text-[13px] font-medium rounded-full transition-all duration-150
                ${isActive 
                  ? `${activeStyle.textColor} active:scale-[0.98]`
                  : 'text-white/60 hover:bg-white/[0.07]'
                }
              `}
              style={
                isActive
                  ? {
                      background: activeStyle.background,
                      border: activeStyle.border,
                      boxShadow: activeStyle.shadow,
                    }
                  : undefined
              }
            >
              <span className="inline-flex items-center justify-center gap-1.5">
                <span className="text-[12px]">{segment.icon}</span>
                <span>{segment.label}</span>
              </span>
            </button>
          );
        })}
      </div>
      
      {/* Dynamic status text */}
      <div 
        key={value}
        className="mt-2 text-center text-[12px] text-white/60 animate-fade-in"
      >
        {getStatusText()}
      </div>
    </div>
  );
}
