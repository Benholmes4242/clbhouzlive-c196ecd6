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
    <section aria-labelledby="otp-title" className="flex flex-col items-center">
      <h2 id="otp-title" className="sr-only">Open to Play</h2>
      
      <TapButton
        aria-pressed={isActive}
        aria-label={isActive ? `Open to Play active, ${remainingMinutes} minutes remaining` : 'Activate Open to Play'}
        disabled={isSaving}
        onPointerDown={handleToggle}
        className="relative inline-flex items-center justify-center gap-2.5 transition-all duration-100 active:scale-[0.97] rounded-[14px] bg-white/[0.04] border border-white/10"
        style={{
          minWidth: '240px',
          height: '42px',
          fontWeight: 600,
          fontSize: '16px',
          color: '#fff',
          padding: '12px 16px',
          ...(isActive && {
            background: 'linear-gradient(to bottom, rgba(78, 199, 120, 0.16), rgba(78, 199, 120, 0.10))',
            borderColor: 'rgba(78, 199, 120, 0.28)',
          }),
        }}
      >
        <span className="text-[16px]" aria-hidden="true">🏌️‍♂️</span>
        {isSaving ? (
          'Updating…'
        ) : isActive ? (
          <>Open to Play <span className="text-white/70 text-[13px]">• {remainingMinutes}m</span></>
        ) : (
          'Open to Play'
        )}
      </TapButton>

      {/* Helper copy */}
      <p className="mt-1 text-body-sm font-medium leading-snug text-center max-w-xs mx-auto" style={{ color: 'var(--hub-text-muted)' }}>
        {isActive ? (
          <>Nearby golfers can see you're available. <span className="font-medium">Tap again</span> to turn off.</>
        ) : (
          <>Let nearby golfers know you're ready to play — tap <span className="font-medium">Open to Play</span> to show up on their radar.</>
        )}
      </p>
    </section>
  );
}
