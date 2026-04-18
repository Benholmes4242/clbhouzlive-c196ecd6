/**
 * BreathingRoomMuteToggle - Small floating glass mute button for video posts.
 *
 * Anchored bottom-left, just above the caption area. Reads isMuted state
 * directly from clubhouseStore. Matches Instagram/TikTok convention.
 *
 * Only renders when the active post is a video (controlled by parent).
 * Uses the same glass treatment as the identity bar and course chip.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { Z } from '@/config/zIndex';

interface BreathingRoomMuteToggleProps {
  isVisible: boolean;
}

export const BreathingRoomMuteToggle: React.FC<BreathingRoomMuteToggleProps> = ({
  isVisible,
}) => {
  const isMuted = useClubhouseStore((s) => s.isMuted);
  const toggleMute = useClubhouseStore((s) => s.toggleMute);
  const markUserGestureUnmute = useClubhouseStore((s) => s.markUserGestureUnmute);

  const handleClick = () => {
    if (isMuted) markUserGestureUnmute();
    toggleMute();
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      aria-label={isMuted ? 'Unmute video' : 'Mute video'}
      initial={false}
      animate={{
        opacity: isVisible ? 1 : 0,
        scale: isVisible ? 1 : 0.92,
      }}
      whileTap={{ scale: 0.9 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        bottom: 'calc(var(--bottom-nav-height, 88px) + 170px)',
        left: 16,
        width: 44,
        height: 44,
        borderRadius: 14,
        background: 'rgba(0, 0, 0, 0.50)',
        border: '1px solid rgba(255, 255, 255, 0.10)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        zIndex: Z.echo,
        pointerEvents: isVisible ? 'auto' : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        padding: 0,
        fontFamily: 'Geist, system-ui, sans-serif',
      }}
    >
      {isMuted ? (
        <VolumeX size={20} stroke="#fff" strokeWidth={2} />
      ) : (
        <Volume2 size={20} stroke="#fff" strokeWidth={2} />
      )}
    </motion.button>
  );
};

export default BreathingRoomMuteToggle;
