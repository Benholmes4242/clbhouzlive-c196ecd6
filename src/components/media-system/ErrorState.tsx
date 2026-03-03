/**
 * ErrorState — shown when a video fails to load after all recovery attempts.
 * Displays retry icon + message. Auto-retries once after 8 seconds.
 */
import { useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { TIMING } from './types/media';

interface ErrorStateProps {
  onRetry: () => void;
}

export function ErrorState({ onRetry }: ErrorStateProps) {
  const autoRetried = useRef(false);

  // Auto-retry once after 8 seconds
  useEffect(() => {
    if (autoRetried.current) return;
    const timer = setTimeout(() => {
      autoRetried.current = true;
      onRetry();
    }, TIMING.ERROR_AUTO_RETRY_MS);
    return () => clearTimeout(timer);
  }, [onRetry]);

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center cursor-pointer"
      style={{ background: 'rgba(13,13,13,0.85)' }}
      onClick={(e) => {
        e.stopPropagation();
        onRetry();
      }}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
        style={{
          background: 'rgba(255,255,255,0.1)',
          animation: 'error-pulse 2s ease-in-out infinite',
        }}
      >
        <RefreshCw className="w-6 h-6" style={{ color: 'rgba(255,255,255,0.6)' }} />
      </div>
      <p
        className="text-sm"
        style={{ color: 'rgba(255,255,255,0.5)' }}
      >
        Couldn't load this video
      </p>
      <p
        className="text-xs mt-1"
        style={{ color: 'rgba(255,255,255,0.3)' }}
      >
        Tap to retry
      </p>
      <style>{`
        @keyframes error-pulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
