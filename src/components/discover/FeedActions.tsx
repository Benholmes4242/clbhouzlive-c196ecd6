import React, { useState } from 'react';
import { HeartIcon, ChatBubbleOvalLeftEllipsisIcon, PaperAirplaneIcon, SpeakerXMarkIcon, SpeakerWaveIcon } from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';
import { CountPop, SuccessPulse } from '@/hooks/useDoubleTap';

interface FeedActionsProps {
  isLiked: boolean;
  likeCount: number;
  commentCount: number;
  isMuted: boolean;
  mediaType: 'video' | 'image';
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onToggleMute: () => void;
  isLiking?: boolean;
  likeCountChanged?: boolean;
  shareSuccess?: boolean;
  commentSuccess?: boolean;
}

const FeedActions: React.FC<FeedActionsProps> = ({
  isLiked,
  likeCount,
  commentCount,
  isMuted,
  mediaType,
  onLike,
  onComment,
  onShare,
  onToggleMute,
  isLiking = false,
  likeCountChanged = false,
  shareSuccess = false,
  commentSuccess = false
}) => {
  const ActionButton: React.FC<{
    icon: React.ReactNode;
    count?: number;
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    className?: string;
  }> = ({ icon, count, onClick, isActive = false, disabled = false, className }) => (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "relative w-12 h-12 rounded-full flex items-center justify-center",
          "backdrop-blur-md border shadow-lg",
          "text-white transition-all duration-200",
          "hover:scale-105 active:scale-95",
          "bg-[var(--hud-bg)] border-[var(--hud-border)]",
          isActive && "bg-red-500/20 border-red-400/40",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        style={{
          boxShadow: 'var(--hud-shadow)',
          backdropFilter: 'blur(40px) saturate(180%)'
        }}
      >
        {icon}
        
        {/* Tap feedback overlay */}
        <div className="absolute inset-0 rounded-full bg-white/10 opacity-0 transition-opacity duration-150 active:opacity-100" />
      </button>
      
      {/* Count display with pop animation */}
      {count !== undefined && (
        <CountPop isActive={isActive && count > 0} className="text-white/90 text-xs font-medium min-w-[20px] text-center">
          <span style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
            {count >= 1000 ? `${Math.floor(count / 1000)}k` : count}
          </span>
        </CountPop>
      )}
    </div>
  );

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-6 animate-slide-enter-ui">
      {/* Like Button */}
      <ActionButton
        icon={
          <HeartIcon 
            className={cn(
              "w-6 h-6 transition-colors",
              isLiked ? "text-red-500 fill-red-500" : "text-white"
            )}
          />
        }
        count={likeCount}
        onClick={onLike}
        isActive={likeCountChanged}
        disabled={isLiking}
      />

      {/* Comment Button */}
      <SuccessPulse isActive={commentSuccess}>
        <ActionButton
          icon={<ChatBubbleOvalLeftEllipsisIcon className="w-6 h-6 text-white" />}
          count={commentCount}
          onClick={onComment}
        />
      </SuccessPulse>

      {/* Share Button */}
      <SuccessPulse isActive={shareSuccess}>
        <ActionButton
          icon={<PaperAirplaneIcon className="w-6 h-6 text-white" />}
          onClick={onShare}
        />
      </SuccessPulse>

      {/* Mute Button - only show for videos */}
      {mediaType === 'video' && (
        <ActionButton
          icon={
            isMuted ? (
              <SpeakerXMarkIcon className="w-6 h-6 text-white" />
            ) : (
              <SpeakerWaveIcon className="w-6 h-6 text-white" />
            )
          }
          onClick={onToggleMute}
          isActive={!isMuted}
        />
      )}
    </div>
  );
};

export default FeedActions;