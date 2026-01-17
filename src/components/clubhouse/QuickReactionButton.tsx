import React, { useState, useRef, useCallback } from 'react';
import { EmojiReactionTray } from './EmojiReactionTray';

export interface PostReactions {
  [emoji: string]: number;
}

interface QuickReactionButtonProps {
  postId: string;
  userReaction?: string;
  onReact: (postId: string, emoji: string) => void;
  className?: string;
}

export const QuickReactionButton: React.FC<QuickReactionButtonProps> = ({
  postId,
  userReaction,
  onReact,
  className = ""
}) => {
  const [showTray, setShowTray] = useState(false);
  const [trayPosition, setTrayPosition] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleLongPressStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Long press started');
    
    
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const newPosition = {
        x: rect.left + rect.width / 2,
        y: rect.top
      };
      console.log('Tray position calculated:', newPosition);
      setTrayPosition(newPosition);
    }

    longPressTimer.current = setTimeout(() => {
      console.log('Long press timer fired, showing tray');
      setShowTray(true);
    }, 300); // 300ms long press threshold
  }, []);

  const handleLongPressEnd = useCallback(() => {
    console.log('🔥 BUTTON EVENT FIRED - Long press ended, showTray:', showTray);
    
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
      console.log('Cleared long press timer');
    }

    if (!showTray) {
      // Quick tap - default heart reaction or remove if already selected
      console.log('Quick tap detected, current reaction:', userReaction);
      if (userReaction === '❤️') {
        onReact(postId, ''); // Remove reaction
      } else {
        onReact(postId, '❤️'); // Add heart reaction
      }
    }
  }, [showTray, userReaction, postId, onReact]);

  const handleEmojiSelect = useCallback((emoji: string) => {
    if (userReaction === emoji) {
      onReact(postId, ''); // Remove reaction if same emoji selected
    } else {
      onReact(postId, emoji); // Set new reaction
    }
    setShowTray(false);
  }, [postId, onReact, userReaction]);

  const handleCancel = useCallback(() => {
    setShowTray(false);
  }, []);

  console.log('🔥 QuickReactionButton rendered with:', { postId, userReaction, showTray });
  
  return (
    <div className={`flex flex-col items-center ${className}`} style={{ border: '2px solid red' }}>
      {/* Debug overlay to see where the button is */}
      <div className="absolute inset-0 bg-yellow-500/30 pointer-events-none z-40 text-black text-xs p-1">
        QuickReactionButton
      </div>
      {/* Main Reaction Button */}
      <button
        ref={buttonRef}
        className="w-12 h-12 flex items-center justify-center rounded-full backdrop-blur-md bg-black/35 border border-white/10 hover:bg-black/50 transition-all duration-200 pointer-events-auto relative z-50"
        onTouchStart={(e) => {
          console.log('🔥 TOUCH START EVENT');
          handleLongPressStart(e);
        }}
        onTouchEnd={(e) => {
          console.log('🔥 TOUCH END EVENT');
          handleLongPressEnd();
        }}
        onMouseDown={(e) => {
          console.log('🔥 MOUSE DOWN EVENT');
          handleLongPressStart(e);
        }}
        onMouseUp={(e) => {
          console.log('🔥 MOUSE UP EVENT');
          handleLongPressEnd();
        }}
        onClick={() => {
          console.log('🔥 CLICK EVENT - This should not fire if touch/mouse events work');
        }}
        onMouseLeave={() => {
          console.log('🔥 MOUSE LEAVE EVENT');
          if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
          }
        }}
        aria-label="React to post"
      >
        {/* Current User's Reaction or Default Heart */}
        <span className={`text-xl transition-transform duration-200 ${
          showTray ? 'scale-110' : 'scale-100'
        } ${userReaction === '❤️' ? 'text-red-500' : userReaction ? 'text-white' : 'text-white'}`}>
          {userReaction || '❤️'}
        </span>
      </button>

      {/* Emoji Reaction Tray */}
      <EmojiReactionTray
        isVisible={showTray}
        onEmojiSelect={handleEmojiSelect}
        onCancel={handleCancel}
        position={trayPosition}
        selectedEmoji={userReaction}
      />
    </div>
  );
};