/**
 * MuteButton — top-right mute/unmute toggle.
 * Global state: toggling applies to all videos in session.
 */
import { Volume2, VolumeX } from 'lucide-react';
import { useMediaStore } from './store/mediaStore';

export function MuteButton() {
  const { isMuted, toggleMute } = useMediaStore();

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggleMute();
      }}
      className="fixed z-30 flex items-center justify-center w-11 h-11 rounded-full"
      style={{
        top: 'calc(env(safe-area-inset-top, 16px) + 16px)',
        right: '16px',
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(24px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
      }}
      aria-label={isMuted ? 'Unmute' : 'Mute'}
    >
      {isMuted ? (
        <VolumeX className="w-5 h-5 text-white" />
      ) : (
        <Volume2 className="w-5 h-5 text-white" />
      )}
    </button>
  );
}
