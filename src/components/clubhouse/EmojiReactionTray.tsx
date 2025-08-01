import React, { useState, useEffect } from 'react';
import { HeartIcon } from '@heroicons/react/24/solid';

interface EmojiReactionTrayProps {
  isVisible: boolean;
  onEmojiSelect: (emoji: string) => void;
  onCancel: () => void;
  position: { x: number; y: number };
}

const EMOJIS = [
  { emoji: '😂', label: 'Laughing' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '👏', label: 'Clap' },
  { emoji: '❤️', label: 'Love' }
];

export const EmojiReactionTray: React.FC<EmojiReactionTrayProps> = ({
  isVisible,
  onEmojiSelect,
  onCancel,
  position
}) => {
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);

  useEffect(() => {
    if (!isVisible) {
      setSelectedEmoji(null);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop to catch outside clicks */}
      <div 
        className="fixed inset-0 z-40"
        onTouchEnd={onCancel}
        onMouseUp={onCancel}
      />
      
      {/* Emoji Tray */}
      <div
        className={`
          fixed z-50 bg-black/80 backdrop-blur-sm rounded-2xl px-3 py-2
          flex items-center gap-2
          transition-all duration-200 ease-out
          ${isVisible ? 'animate-scale-in opacity-100' : 'opacity-0 scale-95'}
        `}
        style={{
          left: position.x - 80, // Center the tray
          top: position.y - 60,   // Position above the button
          transform: 'translateX(-50%)'
        }}
      >
        {EMOJIS.map((item) => (
          <button
            key={item.emoji}
            className={`
              w-10 h-10 flex items-center justify-center
              rounded-full transition-all duration-150
              ${selectedEmoji === item.emoji 
                ? 'bg-white/20 scale-110' 
                : 'hover:bg-white/10 active:scale-95'
              }
            `}
            onTouchStart={() => setSelectedEmoji(item.emoji)}
            onMouseEnter={() => setSelectedEmoji(item.emoji)}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEmojiSelect(item.emoji);
            }}
            onMouseUp={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEmojiSelect(item.emoji);
            }}
            aria-label={`React with ${item.label}`}
          >
            {item.emoji === '❤️' ? (
              <HeartIcon className="w-6 h-6 text-red-500" />
            ) : (
              <span className="text-2xl select-none">
                {item.emoji}
              </span>
            )}
          </button>
        ))}
      </div>
    </>
  );
};