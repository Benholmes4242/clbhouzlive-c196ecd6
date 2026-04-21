import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useLongPressTip } from './hooks/useLongPressTip';

/**
 * One-shot tooltip pointing out the long-press affordance on tiles.
 * Renders only on the first visit; persists dismissal in user_profiles
 * (with a localStorage fallback for logged-out users).
 */
export default function LongPressTipBanner() {
  const { hasSeen, dismiss } = useLongPressTip();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!hasSeen) {
      // Slight delay so it doesn't pop on initial load
      const t = window.setTimeout(() => setVisible(true), 1200);
      return () => window.clearTimeout(t);
    }
  }, [hasSeen]);

  const handleDismiss = () => {
    setVisible(false);
    dismiss();
  };

  if (hasSeen || !visible) return null;

  return (
    <div
      style={{
        margin: '0 16px 12px',
        padding: '10px 12px',
        borderRadius: 12,
        background: '#0F172A',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontSize: 13,
        fontWeight: 500,
        lineHeight: 1.35,
      }}
    >
      <span style={{ color: '#F7931E', fontSize: 16 }}>✨</span>
      <span style={{ flex: 1 }}>Long-press any tile for more options.</span>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss tip"
        style={{
          width: 24,
          height: 24,
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255,255,255,0.1)',
          flexShrink: 0,
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
