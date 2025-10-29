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
        return { text: "You're visible to golfers nearby", color: 'rgba(180, 255, 190, 0.9)' };
      case 'friends':
        return { text: "Only friends can see you", color: 'rgba(200, 200, 255, 0.9)' };
      case 'hidden':
        return { text: "You're hidden right now", color: 'rgba(255, 160, 160, 0.9)' };
    }
  };

  const statusInfo = getStatusText();

  return (
    <div className="w-full">
      <div className="mb-1 text-[15px] font-semibold text-white/90 text-center">Visibility</div>
      <div className="text-[13px] text-white/60 mb-4 text-center leading-relaxed">Control who can see you nearby</div>
      
      <div className="flex gap-0 w-full p-1 rounded-full bg-white/[0.05] border border-white/[0.12]">
        {segments.map((segment) => {
          const isActive = value === segment.mode;
          
          const getActiveStyle = () => {
            if (segment.mode === 'all') {
              return {
                background: 'radial-gradient(circle at 0% 0%, rgba(110, 146, 119, 0.28) 0%, rgba(110, 146, 119, 0.14) 60%, rgba(110, 146, 119, 0.08) 100%)',
                border: '1px solid rgba(110, 146, 119, 0.5)',
                shadow: '0 0 16px rgba(110, 146, 119, 0.45)',
                textColor: 'text-white'
              };
            } else if (segment.mode === 'friends') {
              return {
                background: 'radial-gradient(circle at 0% 0%, rgba(96, 96, 140, 0.28) 0%, rgba(96, 96, 140, 0.12) 100%)',
                border: '1px solid rgba(180, 180, 255, 0.4)',
                shadow: '0 0 16px rgba(96, 96, 140, 0.45)',
                textColor: 'text-white'
              };
            } else {
              return {
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                shadow: '0 0 16px rgba(0, 0, 0, 0.9)',
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
                flex-1 py-2.5 px-3 text-[13px] font-semibold rounded-[22px] transition-all duration-120
                ${isActive 
                  ? `${activeStyle.textColor} active:scale-[0.98]`
                  : 'text-white/70 hover:bg-white/[0.08] active:bg-white/[0.08]'
                }
              `}
              style={
                isActive
                  ? {
                      background: activeStyle.background,
                      border: activeStyle.border,
                      boxShadow: activeStyle.shadow,
                    }
                  : { minHeight: '44px' }
              }
            >
              <span className="inline-flex items-center justify-center gap-1.5">
                <span className="text-[13px]">{segment.icon}</span>
                <span>{segment.label}</span>
              </span>
            </button>
          );
        })}
      </div>
      
      {/* Dynamic status text */}
      <div 
        key={value}
        className="mt-2 text-center text-[13px] animate-in fade-in duration-100"
        style={{ color: statusInfo.color }}
      >
        {statusInfo.text}
      </div>
    </div>
  );
}
