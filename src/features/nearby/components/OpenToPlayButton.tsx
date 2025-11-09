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
    <section aria-labelledby="otp-title" className="flex flex-col items-center mt-6 mb-2">
      <h2 id="otp-title" className="sr-only">Open to Play</h2>
      
      <TapButton
        aria-pressed={isActive}
        aria-label={isActive ? `Open to Play active, ${remainingMinutes} minutes remaining` : 'Activate Open to Play'}
        disabled={isSaving}
        onPointerDown={handleToggle}
        className="relative inline-flex items-center justify-center gap-2.5 transition-all duration-100 active:scale-[0.97] rounded-2xl bg-white/[0.04] border border-white/10 shadow-[0_20px_48px_rgba(0,0,0,.5)]"
        style={{
          minWidth: '240px',
          height: '44px',
          fontWeight: 600,
          fontSize: '15px',
          color: '#fff',
          ...(isActive && {
            background: 'linear-gradient(to bottom, rgba(78, 199, 120, 0.16), rgba(78, 199, 120, 0.10))',
            borderColor: 'rgba(78, 199, 120, 0.28)',
            boxShadow: '0 20px 48px rgba(0,0,0,.5)',
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
      <p className="mt-2.5 text-[13px] text-[#9b9b9b] text-center leading-[1.35] max-w-[280px]">
        {isActive ? (
          <>Nearby golfers can see you're available. <strong className="text-white/80">Tap again</strong> to turn off.</>
        ) : (
          <>Let nearby golfers know you're ready to play — tap <strong className="text-white/80">Open to Play</strong> to show up on their radar.</>
        )}
      </p>
    </section>
  );
}
