import React from 'react';
import { haptic } from '@/utils/haptics';
import '../../hub/pages/nearbyGolfers.css';

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
    <div>
      {/* Segmented control */}
      <div className="ng-segmented">
        {(['all', 'friends', 'hidden'] as const).map((mode) => (
          <button
            key={mode}
            className={`ng-segmented__item ${value === mode ? 'ng-segmented__item--active' : ''}`}
            onClick={() => handleChange(mode)}
            aria-pressed={value === mode}
          >
            {mode === 'all' && 'Everyone'}
            {mode === 'friends' && 'Friends'}
            {mode === 'hidden' && 'Hidden'}
          </button>
        ))}
      </div>

      {/* Visibility label */}
      <p className="ng-visibility-label">
        {helper.text}
      </p>
    </div>
  );
}
