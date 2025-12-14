/**
 * QuestIntroOverlay - Premium one-time arrival moment for Quest
 * Sets tone without teaching mechanics
 */

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface QuestIntroOverlayProps {
  onBegin: () => void;
  onSkip: () => void;
}

export const QuestIntroOverlay: React.FC<QuestIntroOverlayProps> = ({
  onBegin,
  onSkip,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Fade in on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = (callback: () => void) => {
    setIsVisible(false);
    setTimeout(callback, 300);
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex items-center justify-center p-6',
        'transition-opacity duration-300',
        isVisible ? 'opacity-100' : 'opacity-0'
      )}
      style={{
        background: 'rgba(11, 15, 13, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      <div
        className={cn(
          'max-w-sm w-full text-center',
          'transition-all duration-500',
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        )}
      >
        {/* Accent line */}
        <div
          className="w-12 h-0.5 mx-auto mb-8"
          style={{ background: 'var(--dgp-accent-gold)' }}
        />

        {/* Title */}
        <h1
          className="text-3xl font-bold mb-6"
          style={{ color: 'var(--dgp-text-primary)' }}
        >
          The Quest
        </h1>

        {/* Body */}
        <p
          className="text-base leading-relaxed mb-8"
          style={{ color: 'var(--dgp-text-secondary)' }}
        >
          A personal journey through the world's greatest golf courses.
          <br />
          <span style={{ color: 'var(--dgp-text-muted)' }}>
            Progress is earned. Milestones matter.
          </span>
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => handleDismiss(onBegin)}
            className="w-full py-3.5 rounded-xl font-medium text-sm transition-all duration-200 active:scale-[0.98]"
            style={{
              background: 'var(--dgp-accent-green)',
              color: '#fff',
            }}
          >
            Begin
          </button>

          <button
            onClick={() => handleDismiss(onSkip)}
            className="w-full py-2 text-xs font-medium transition-opacity"
            style={{ color: 'var(--dgp-text-muted)' }}
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestIntroOverlay;
