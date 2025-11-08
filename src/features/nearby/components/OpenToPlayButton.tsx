import React, { useState, useEffect } from 'react';
import { TapButton } from '@/components/ui/TapButton';
import { haptic } from '@/utils/haptics';
import { useOpenToPlay } from '../hooks/useOpenToPlay';
import { analyticsEvents } from '@/utils/analyticsEvents';

export function OpenToPlayButton() {
  const { isActive, activate, cancel, getRemainingMinutes, getRemainingMs, durationMs } = useOpenToPlay();
  const [progress, setProgress] = useState(100);
  const [isSaving, setIsSaving] = useState(false);

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
    <div 
      className="mb-3 rounded-3xl bg-[var(--hub-glass-bg)]/60 backdrop-blur-md border border-[var(--hub-stroke)]/50 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset,0_8px_30px_rgba(0,0,0,0.35)] p-3"
    >
      <h2 className="sr-only">Open to Play</h2>
      
      <button
        aria-pressed={isActive}
        aria-label={isActive ? `Open to Play active, ${remainingMinutes} minutes remaining` : 'Activate Open to Play'}
        disabled={isSaving}
        onClick={handleToggle}
        className="w-full rounded-2xl py-3 text-[16px] font-medium bg-white/[0.06] hover:bg-white/[0.09] border border-[var(--hub-stroke)]/60 backdrop-blur-md transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/60 disabled:opacity-50"
      >
        <span className="inline-flex items-center justify-center gap-2">
          <span aria-hidden="true">🏌️</span>
          {isSaving ? (
            'Updating…'
          ) : isActive ? (
            <>Open to Play <span className="text-white/70 text-[13px]">• {remainingMinutes}m</span></>
          ) : (
            'Open to Play'
          )}
        </span>
      </button>

      {/* Helper copy */}
      <p className="mt-2 text-xs text-[var(--hub-text-dim)] text-center">
        {isActive ? (
          <>Nearby golfers can see you're available. <strong className="text-white/80">Tap again</strong> to turn off.</>
        ) : (
          <>Let nearby golfers know you're ready — tap to appear on their radar.</>
        )}
      </p>
    </div>
  );
}
