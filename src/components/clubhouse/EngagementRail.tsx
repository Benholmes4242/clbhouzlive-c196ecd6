import React, { useState } from 'react';
import { Heart, MessageCircle, Share, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useGlobalAudio } from '@/contexts/GlobalAudioContext';

interface EngagementRailProps {
  postId: string;
  stats: {
    likes: number;
    comments: number;
    shares: number;
  };
  isLiked?: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  className?: string;
}

const formatCount = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
};

const EngagementButton = ({ 
  icon: Icon, 
  count, 
  isActive, 
  onClick, 
  className 
}: {
  icon: any;
  count: number;
  isActive?: boolean;
  onClick: () => void;
  className?: string;
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = () => {
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 200);
    onClick();
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        className={cn(
          "relative w-12 h-12 rounded-full flex items-center justify-center",
          "bg-hud-bg backdrop-blur-md border border-hud-border",
          "text-white transition-all duration-200 overflow-hidden",
          "hover:bg-hud-bg/80 active:scale-95",
          isPressed && "animate-bounce",
          className
        )}
        onClick={handlePress}
        style={{ minWidth: '48px', minHeight: '48px' }}
      >
        {/* Ripple effect */}
        {isPressed && (
          <div 
            className="absolute inset-0 bg-white/20 rounded-full animate-ping"
            style={{ animationDuration: '250ms' }}
          />
        )}
        
        <Icon 
          className={cn(
            "w-6 h-6 transition-colors duration-200",
            isActive ? "text-accent fill-accent" : "text-white"
          )}
        />
      </button>
      
      {count > 0 && (
        <span className="text-white text-xs font-medium">
          {formatCount(count)}
        </span>
      )}
    </div>
  );
};

const EngagementRail = ({
  postId,
  stats,
  isLiked = false,
  onLike,
  onComment,
  onShare,
  className
}: EngagementRailProps) => {
  const isMobile = useIsMobile();
  const gap = isMobile ? 'gap-4' : 'gap-5'; // 16px mobile, 20px desktop
  const { isGloballyMuted, toggleGlobalMute } = useGlobalAudio();

  const handleAudioToggle = () => {
    toggleGlobalMute();
  };

  return (
    <div className={cn(
      "fixed right-4 bottom-32 z-overlay flex flex-col items-center",
      gap,
      className
    )}>
      <EngagementButton
        icon={Heart}
        count={stats.likes}
        isActive={isLiked}
        onClick={onLike}
      />
      
      <EngagementButton
        icon={MessageCircle}
        count={stats.comments}
        onClick={onComment}
      />
      
      <EngagementButton
        icon={Share}
        count={stats.shares}
        onClick={onShare}
      />
      
      <EngagementButton
        icon={isGloballyMuted ? VolumeX : Volume2}
        count={0}
        isActive={!isGloballyMuted}
        onClick={handleAudioToggle}
      />
    </div>
  );
};

export default EngagementRail;