import React from 'react';
import { TapButton } from '@/components/ui/TapButton';
import { haptic } from '@/utils/haptics';

export type VisibilityMode = 'all' | 'friends' | 'hidden';

interface GolferStatusBarProps {
  value: VisibilityMode;
  onChange: (mode: VisibilityMode) => void;
}

export function GolferStatusBar({ value, onChange }: GolferStatusBarProps) {
  const handleChange = (newMode: VisibilityMode) => {
    haptic('light');
    onChange(newMode);
  };

  const getSliderPosition = () => {
    switch (value) {
      case 'all': return '0%';
      case 'friends': return '33.33%';
      case 'hidden': return '66.66%';
    }
  };

  const getHelperText = () => {
    switch (value) {
      case 'all':
        return { text: 'Visible to all golfers nearby', color: '#72ff8d' };
      case 'friends':
        return { text: 'Visible to your friends only', color: '#72ff8d' };
      case 'hidden':
        return { text: 'Hidden from nearby golfers', color: 'rgba(255,255,255,0.78)' };
    }
  };

  const helper = getHelperText();

  return (
    <div className="mx-3">
      {/* Segmented control - PRIMARY hierarchy */}
      <div
        className="relative rounded-xl backdrop-blur-[20px] border p-1.5 flex"
        style={{
          background: 'rgba(255,255,255,0.08)',
          borderColor: 'rgba(255,255,255,0.12)',
          height: '48px',
        }}
      >
        {/* Animated slider with spring bounce */}
        <div
          className="absolute inset-1.5 rounded-lg"
          style={{
            width: 'calc(33.33% - 6px)',
            transform: `translateX(calc(${getSliderPosition()} / 0.3333))`,
            background: 'rgba(255,255,255,0.20)',
            transition: 'transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}
        />

        {/* Buttons */}
        {(['all', 'friends', 'hidden'] as const).map((mode) => (
          <TapButton
            key={mode}
            className="relative flex-1 font-semibold transition-colors duration-200"
            style={{
              color: value === mode ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.65)',
              fontSize: '17px',
              padding: '12px 16px',
            }}
            onPointerDown={() => handleChange(mode)}
            aria-pressed={value === mode}
          >
            {mode === 'all' && 'Everyone'}
            {mode === 'friends' && 'Friends'}
            {mode === 'hidden' && 'Hidden'}
          </TapButton>
        ))}
      </div>

      {/* Helper text with fade transition */}
      <p
        className="text-[13px] mt-3 text-center transition-all duration-200 font-normal"
        style={{ 
          color: helper.color,
          opacity: 1,
          lineHeight: '1.4'
        }}
        key={value}
      >
        {helper.text}
      </p>
    </div>
  );
}
