import React, { useState, useEffect } from 'react';
import { useOpenToPlay } from '../hooks/useOpenToPlay';
import { analyticsEvents } from '@/utils/analyticsEvents';

export function ProfileOpenToPlayStatus() {
  const { isActive, getRemainingMinutes } = useOpenToPlay();
  const [remainingMinutes, setRemainingMinutes] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setRemainingMinutes(0);
      return;
    }

    const updateRemaining = () => {
      const remaining = getRemainingMinutes();
      setRemainingMinutes(remaining);
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 60000); // Update every minute

    // Track analytics when displayed
    analyticsEvents.openToPlay.profileDisplayed(getRemainingMinutes());

    return () => clearInterval(interval);
  }, [isActive, getRemainingMinutes]);

  if (!isActive || remainingMinutes <= 0) {
    return null;
  }

  return (
    <div
      className="profile-open2play"
      style={{
        fontSize: '13px',
        fontWeight: 500,
        color: '#6e9277',
        marginTop: '4px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
      }}
    >
      <span style={{ fontSize: '16px' }}>🟢</span>
      Open to play • {remainingMinutes} min left
    </div>
  );
}
