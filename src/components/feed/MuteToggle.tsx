/**
 * MuteToggle — in-feed global mute toggle (feed-active lane only).
 *
 * Writes clubhouseStore.isMuted (global feed mute; IG convention). Rendered
 * by InlineVideo when the card is the active playing video. Never on rails,
 * images, or fullscreen (viewer has its own control).
 */
import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { triggerHaptic } from '@/lib/ui/haptics';

export const MuteToggle: React.FC = () => {
  const isMuted = useClubhouseStore((s) => s.isMuted);
  const setIsMuted = useClubhouseStore((s) => s.setIsMuted);
  const markUserGestureUnmute = useClubhouseStore((s) => s.markUserGestureUnmute);

  const onTap = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try { triggerHaptic('light'); } catch {}
    if (isMuted) markUserGestureUnmute();
    setIsMuted(!isMuted);
  };

  const Icon = isMuted ? VolumeX : Volume2;

  return (
    <button
      type="button"
      onClick={onTap}
      onTouchEnd={onTap}
      aria-label={isMuted ? 'Unmute' : 'Mute'}
      style={{
        position: 'absolute',
        right: 10,
        bottom: 10,
        width: 28,
        height: 28,
        borderRadius: 9999,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        zIndex: 30,
        WebkitTapHighlightColor: 'transparent',
      }}
      className="active:scale-[0.95] transition-transform"
    >
      <Icon size={15} color="#ffffff" strokeWidth={2} />
    </button>
  );
};

MuteToggle.displayName = 'MuteToggle';
