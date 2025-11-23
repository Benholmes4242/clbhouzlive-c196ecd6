import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';

const REACTION_EMOJIS = ['😂', '🔥', '👏', '❤️'];

interface VideoReactionTrayProps {
  isVisible: boolean;
  position: { x: number; y: number };
  onEmojiSelect: (emoji: string) => void;
  onCancel: () => void;
}

export const VideoReactionTray: React.FC<VideoReactionTrayProps> = ({
  isVisible,
  position,
  onEmojiSelect,
  onCancel,
}) => {
  useEffect(() => {
    if (!isVisible) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.video-reaction-tray')) onCancel();
    };
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isVisible, onCancel]);

  if (!isVisible) return null;

  return (
    <div
      className="video-reaction-tray fixed z-[200] flex items-center gap-2 px-3 py-2 rounded-full animate-in fade-in zoom-in duration-200"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%)',
        background: 'rgba(15, 15, 15, 0.9)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {REACTION_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={(e) => {
            e.stopPropagation();
            onEmojiSelect(emoji);
          }}
          className="flex items-center justify-center w-12 h-12 rounded-full hover:bg-white/10 transition-all duration-200 hover:scale-110 active:scale-95 text-2xl"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};
