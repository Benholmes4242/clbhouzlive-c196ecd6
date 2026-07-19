/**
 * MuteButton — canonical glass speaker toggle used across every feed
 * surface. Uncontrolled (session-wired) by default; pass `muted`+`onToggle`
 * for LOCAL mode (composer previews) where the button must NOT touch the
 * global session store.
 *
 * Chassis: circular glass button, black-45 fill, 8px blur, white glyph.
 * Tap target is always >=44pt (sm size wraps the 34px visual in a 44px
 * transparent hit area). Icon is Volume2 when unmuted, VolumeX when muted.
 *
 * TapForSoundPill — same glass chassis, pill shape. Consumed in B4.
 */
import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useSessionAudio } from '@/audio/sessionAudioStore';
import * as audioDbg from '@/perf/audioDebug';

type Size = 'sm' | 'md';

interface MuteButtonProps {
  size?: Size;
  /** LOCAL mode: when provided, the button is controlled and never touches session audio. */
  muted?: boolean;
  onToggle?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const GLASS_BG = 'rgba(0,0,0,0.45)';
const GLASS_BLUR = 'blur(8px)';

export const MuteButton: React.FC<MuteButtonProps> = ({
  size = 'sm',
  muted,
  onToggle,
  className,
  style,
}) => {
  const sessionMuted = useSessionAudio((s) => s.isMuted);
  const controlled = muted !== undefined;
  const isMuted = controlled ? !!muted : sessionMuted;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioDbg.audioDebugEnabled()) {
      audioDbg.logAudio('viewer.mute.tap', {
        controlled, before: { sessionMuted, isMuted },
      });
    }
    if (controlled) {
      onToggle?.();
    } else {
      useSessionAudio.getState().toggle();
    }
  };

  const visual = size === 'md' ? 44 : 34;
  const iconSize = size === 'md' ? 22 : 18;
  const Icon = isMuted ? VolumeX : Volume2;

  const circle = (
    <span
      aria-hidden
      style={{
        width: visual,
        height: visual,
        borderRadius: '50%',
        background: GLASS_BG,
        backdropFilter: GLASS_BLUR,
        WebkitBackdropFilter: GLASS_BLUR,
        color: '#fff',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'transform 120ms ease',
      }}
    >
      <Icon size={iconSize} strokeWidth={2} />
    </span>
  );

  // For sm, wrap circle in a 44x44 transparent hit area (padding trick).
  // For md, the visual IS the hit area.
  const wrapperSize = 44;

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isMuted ? 'Unmute' : 'Mute'}
      aria-pressed={!isMuted}
      className={className}
      style={{
        width: wrapperSize,
        height: wrapperSize,
        padding: 0,
        margin: 0,
        border: 'none',
        background: 'transparent',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: '#fff',
        WebkitTapHighlightColor: 'transparent',
        ...style,
      }}
      onPointerDown={(e) => {
        const el = e.currentTarget.firstElementChild as HTMLElement | null;
        if (el) el.style.transform = 'scale(0.92)';
      }}
      onPointerUp={(e) => {
        const el = e.currentTarget.firstElementChild as HTMLElement | null;
        if (el) el.style.transform = 'scale(1)';
      }}
      onPointerLeave={(e) => {
        const el = e.currentTarget.firstElementChild as HTMLElement | null;
        if (el) el.style.transform = 'scale(1)';
      }}
    >
      {circle}
    </button>
  );
};

MuteButton.displayName = 'MuteButton';

interface TapForSoundPillProps {
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const TapForSoundPill: React.FC<TapForSoundPillProps> = ({
  onClick,
  className,
  style,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) onClick();
    else useSessionAudio.getState().unmute();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Unmute"
      className={className}
      style={{
        height: 34,
        borderRadius: 999,
        padding: '0 14px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        background: GLASS_BG,
        backdropFilter: GLASS_BLUR,
        WebkitBackdropFilter: GLASS_BLUR,
        color: '#fff',
        border: 'none',
        cursor: 'pointer',
        transition: 'transform 120ms ease',
        WebkitTapHighlightColor: 'transparent',
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
          color: '#fff',
          lineHeight: 1,
        }}
      >
        Tap for sound
      </span>
    </button>
  );
};

TapForSoundPill.displayName = 'TapForSoundPill';

export default MuteButton;
