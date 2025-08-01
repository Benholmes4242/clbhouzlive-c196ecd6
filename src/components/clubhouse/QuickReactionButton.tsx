import React, { useState, useRef, useCallback } from 'react';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { EmojiReactionTray } from './EmojiReactionTray';

export interface PostReactions {
  [emoji: string]: number;
}

interface QuickReactionButtonProps {
  postId: string;
  reactions: PostReactions;
  userReaction?: string;
  onReact: (postId: string, emoji: string) => void;
  className?: string;
}

export const QuickReactionButton: React.FC<QuickReactionButtonProps> = ({
  postId,
  reactions,
  userReaction,
  onReact,
  className = ""
}) => {
  const [showTray, setShowTray] = useState(false);
  const [trayPosition, setTrayPosition] = useState({ x: 0, y: 0 });
  const [floatingEmoji, setFloatingEmoji] = useState<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Calculate total reactions
  const totalReactions = Object.values(reactions).reduce((sum, count) => sum + count, 0);

  const handleLongPressStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setTrayPosition({
        x: rect.left + rect.width / 2,
        y: rect.top
      });
    }

    longPressTimer.current = setTimeout(() => {
      setShowTray(true);
    }, 300); // 300ms long press threshold
  }, []);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (!showTray) {
      // Quick tap - default heart reaction
      handleEmojiSelect('❤️');
    }
  }, [showTray]);

  const handleEmojiSelect = useCallback((emoji: string) => {
    onReact(postId, emoji);
    setShowTray(false);
    
    // Show floating emoji animation
    setFloatingEmoji(emoji);
    setTimeout(() => setFloatingEmoji(null), 1000);
  }, [postId, onReact]);

  const handleCancel = useCallback(() => {
    setShowTray(false);
  }, []);

  // Format reaction counts for display
  const getReactionDisplay = () => {
    const entries = Object.entries(reactions).filter(([_, count]) => count > 0);
    if (entries.length === 0) return null;

    return entries.map(([emoji, count]) => (
      <span key={emoji} className="inline-flex items-center gap-1">
        {emoji === '❤️' ? (
          <HeartSolidIcon className="w-3 h-3 text-red-500" />
        ) : (
          <span className="text-xs">{emoji}</span>
        )}
        <span className="text-xs">{count}</span>
      </span>
    ));
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Main Reaction Button */}
      <button
        ref={buttonRef}
        className="cursor-pointer hover:opacity-100 transition-all duration-200 relative"
        onTouchStart={handleLongPressStart}
        onTouchEnd={handleLongPressEnd}
        onMouseDown={handleLongPressStart}
        onMouseUp={handleLongPressEnd}
        onMouseLeave={() => {
          if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
          }
        }}
        aria-label="React to post"
      >
        {/* Current User's Reaction or Default Heart */}
        <div className="relative">
          {userReaction && userReaction !== '❤️' ? (
            <span className={`text-2xl transition-transform duration-200 ${
              showTray ? 'scale-110' : 'scale-100'
            }`}>
              {userReaction}
            </span>
          ) : userReaction === '❤️' ? (
            <HeartSolidIcon className={`w-8 h-8 text-red-500 transition-transform duration-200 ${
              showTray ? 'scale-110' : 'scale-100'
            }`} />
          ) : (
            <HeartIcon className={`w-8 h-8 text-white transition-transform duration-200 ${
              showTray ? 'scale-110' : 'scale-100'
            }`} />
          )}
          
          {/* Floating Emoji Animation */}
          {floatingEmoji && (
            <div 
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{
                animation: 'float-up 1s ease-out forwards'
              }}
            >
              {floatingEmoji === '❤️' ? (
                <HeartSolidIcon className="w-6 h-6 text-red-500" />
              ) : (
                <span className="text-2xl">{floatingEmoji}</span>
              )}
            </div>
          )}
        </div>
      </button>

      {/* Reaction Count */}
      {totalReactions > 0 && (
        <div className="flex flex-col items-center mt-1 text-white text-xs font-medium w-full max-w-[56px]" 
             style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
          <div className="flex flex-wrap items-center justify-center gap-1">
            {getReactionDisplay()}
          </div>
        </div>
      )}

      {/* Emoji Reaction Tray */}
      <EmojiReactionTray
        isVisible={showTray}
        onEmojiSelect={handleEmojiSelect}
        onCancel={handleCancel}
        position={trayPosition}
      />

      {/* Custom keyframes for floating animation */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes float-up {
            0% { 
              transform: translateY(0) scale(1); 
              opacity: 1; 
            }
            100% { 
              transform: translateY(-20px) scale(1.2); 
              opacity: 0; 
            }
          }
        `
      }} />
    </div>
  );
};