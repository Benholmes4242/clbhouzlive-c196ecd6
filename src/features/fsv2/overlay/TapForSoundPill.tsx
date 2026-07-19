/**
 * TapForSoundPill — visual match to the canonical `src/audio/MuteButton.tsx`
 * TapForSoundPill (height 34, radius 999, glass chassis, VolumeX icon,
 * "Tap for sound" copy 12/700). Not imported to keep the fsv2 module
 * self-contained; if the canonical pill ever changes, mirror the update.
 */

import React from 'react';
import { VolumeX } from 'lucide-react';

import { FSV2 } from '../tokens';

interface Props {
  onClick: () => void;
  style?: React.CSSProperties;
}

export const Fsv2TapForSoundPill: React.FC<Props> = ({ onClick, style }) => {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      aria-label="Unmute"
      style={{
        height: 34,
        borderRadius: 999,
        padding: '0 14px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        background: FSV2.GLASS_BG,
        backdropFilter: FSV2.GLASS_BLUR,
        WebkitBackdropFilter: FSV2.GLASS_BLUR,
        color: FSV2.INK,
        border: 'none',
        cursor: 'pointer',
        transition: 'transform 120ms ease',
        WebkitTapHighlightColor: 'transparent',
        fontFamily: FSV2.FONT_FAMILY,
        ...style,
      }}
      onPointerDown={(e) => { e.currentTarget.style.transform = 'scale(0.96)'; }}
      onPointerUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      onPointerLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      <VolumeX size={16} strokeWidth={2} />
      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.01em',
          color: FSV2.INK,
          lineHeight: 1,
        }}
      >
        Tap for sound
      </span>
    </button>
  );
};
