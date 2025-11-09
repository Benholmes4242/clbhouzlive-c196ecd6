/**
 * AppleMetadataCapsule - Bottom-left glass capsule with user info
 * Part of the Apple-style Clubhouse redesign
 */

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface AppleMetadataCapsuleProps {
  user: {
    name: string;
    avatar?: string;
    username?: string;
  };
  caption?: string;
  onUserClick?: () => void;
  isActive?: boolean;
  className?: string;
}

export const AppleMetadataCapsule = ({
  user,
  caption,
  onUserClick,
  isActive = false,
  className
}: AppleMetadataCapsuleProps) => {
  const [isVisible, setIsVisible] = useState(false);

  // Slide up + fade in animation when active
  useEffect(() => {
    if (isActive) {
      // Small delay to let video settle
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isActive]);

  return (
    <div 
      className={cn(
        "fixed z-[50] transition-all duration-300 ease-out",
        isVisible 
          ? "translate-y-0 opacity-100" 
          : "translate-y-8 opacity-0",
        className
      )}
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + clamp(82px, var(--bottom-nav-height, 72px) + 22px, calc(var(--bottom-nav-height, 72px) + 22px)))',
        left: 'calc(env(safe-area-inset-left, 0px) + 16px)',
      }}
    >
      {/* Glass capsule */}
      <button
        onClick={onUserClick}
        className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl backdrop-blur-[18px] border border-white/10 hover:opacity-90 transition-opacity"
        style={{
          background: 'rgba(30,30,30,0.35)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }}
        aria-label={`View ${user.name}'s profile`}
      >
        {/* Avatar with subtle ring */}
        <div 
          className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
          style={{
            boxShadow: '0 0 4px rgba(255,255,255,0.5), inset 0 0 0 1px #6e9277',
          }}
        >
          <img 
            src={user.avatar || '/placeholder.svg'} 
            alt={user.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Text */}
        <div className="flex flex-col items-start">
          <span 
            className="text-[15px] font-semibold text-white leading-tight"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
          >
            {user.name}
          </span>
          {caption && (
            <span 
              className="text-[14px] text-white/85 leading-tight max-w-[200px] truncate"
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
            >
              {caption}
            </span>
          )}
        </div>
      </button>
    </div>
  );
};
