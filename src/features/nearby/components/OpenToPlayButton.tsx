import React, { useState, useEffect } from 'react';
import { useOpenToPlay } from '../hooks/useOpenToPlay';
import { analyticsEvents } from '@/utils/analyticsEvents';

export function OpenToPlayButton() {
  const { isActive, activate, cancel, getRemainingMinutes, getRemainingMs, durationMs } = useOpenToPlay();
  const [progress, setProgress] = useState(100);

  // Update progress every second
  useEffect(() => {
    if (!isActive) {
      setProgress(100);
      return;
    }

    const updateProgress = () => {
      const remaining = getRemainingMs();
      const percentage = (remaining / durationMs) * 100;
      setProgress(percentage);
    };

    updateProgress();
    const interval = setInterval(updateProgress, 1000);

    return () => clearInterval(interval);
  }, [isActive, getRemainingMs, durationMs]);

  const handleClick = () => {
    if (isActive) {
      cancel();
    } else {
      activate();
      analyticsEvents.track('open2play_tap_activate', { duration: 20 });
    }
  };

  const remainingMinutes = getRemainingMinutes();

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleClick}
        className={`btn-open2play ${isActive ? 'active' : 'inactive'}`}
        style={{
          width: '180px',
          height: '46px',
          borderRadius: '23px',
          fontWeight: 600,
          fontSize: '15px',
          position: 'relative',
          overflow: 'visible',
          background: isActive ? 'var(--accent-green-bg)' : 'var(--pill-inactive-bg)',
          color: isActive ? 'var(--accent-green-text)' : 'var(--pill-inactive-text)',
          border: isActive ? '1px solid var(--accent-green-bg)' : '1px solid var(--border-low)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
        }}
      >
        {isActive && (
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              border: '3px solid rgba(255,255,255,0.8)',
              clipPath: 'polygon(0 0, ' + progress + '% 0, ' + progress + '% 100%, 0 100%)',
              transition: 'clip-path 1s linear',
            }}
          />
        )}
        <span style={{ position: 'relative', zIndex: 1 }}>
          {isActive ? '⏱ ' + remainingMinutes + ' min left' : 'Open to Play'}
        </span>
      </button>

      <div
        className="tooltip-subtext"
        style={{
          fontSize: '12px',
          color: 'var(--text-secondary)',
          textAlign: 'center',
          lineHeight: '1.3',
          maxWidth: '240px',
        }}
      >
        {isActive
          ? "We've let nearby golfers know you're available. Your ping will last 20 minutes — tap to stop."
          : "Let nearby golfers know you're available to play now."}
      </div>
    </div>
  );
}
