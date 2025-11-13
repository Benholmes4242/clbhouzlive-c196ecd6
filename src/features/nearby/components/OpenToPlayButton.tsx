import React, { useState } from 'react';
import { haptic } from '@/utils/haptics';
import { useOpenToPlay } from '../hooks/useOpenToPlay';
import { analyticsEvents } from '@/utils/analyticsEvents';
import '../../hub/pages/nearbyGolfers.css';

export function OpenToPlayButton() {
  const { isActive, activate, cancel, getRemainingMinutes } = useOpenToPlay();
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = async () => {
    setIsSaving(true);
    haptic('medium');
    
    try {
      if (isActive) {
        await cancel();
      } else {
        await activate();
        analyticsEvents.track('open2play_tap_activate', { duration: 30 });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const remainingMinutes = getRemainingMinutes();

  return (
    <button
      className={`ng-otp-banner ${isActive ? 'ng-otp-banner--active' : ''}`}
      onClick={handleToggle}
      disabled={isSaving}
      aria-pressed={isActive}
      aria-label={isActive ? `Open to Play active, ${remainingMinutes} minutes remaining` : 'Activate Open to Play'}
    >
      <span className="text-[16px]" aria-hidden="true">🏌️‍♂️</span>
      <span className="ng-otp-banner__text">
        {isSaving ? (
          'Updating…'
        ) : isActive ? (
          'Open to Play'
        ) : (
          'Open to Play'
        )}
      </span>
      {isActive && (
        <span className="ng-otp-banner__meta">{remainingMinutes}m</span>
      )}
    </button>
  );
}
