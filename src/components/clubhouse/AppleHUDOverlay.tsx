/**
 * AppleHUDOverlay - Complete Apple-style HUD
 * Combines metadata capsule and engagement rail in pointer-events-aware wrapper
 */

import React, { useState, useEffect } from 'react';

interface AppleHUDOverlayProps {
  // Metadata
  authorName: string;
  caption?: string;
  avatarUrl?: string;
  onAuthorPress?: () => void;

  // Actions
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onMuteToggle: () => void;
  isMuted: boolean;

  // Visuals
  accentColor?: string;
  progress?: number;
  isActive?: boolean;
}

export const AppleHUDOverlay = ({
  authorName,
  caption = "",
  avatarUrl,
  onAuthorPress,
  onLike,
  onComment,
  onShare,
  onMuteToggle,
  isMuted,
  accentColor = "#6e9277",
  progress = 0,
  isActive = false,
}: AppleHUDOverlayProps) => {
  const [isVisible, setIsVisible] = useState(false);

  // Slide up + fade in animation when active
  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isActive]);

  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      {/* Right rail */}
      <div className="pointer-events-auto absolute right-3 md:right-4 top-1/2 -translate-y-1/2 flex">
        <div className="backdrop-blur-xl bg-[rgba(30,30,30,0.35)] rounded-2xl shadow-xl px-2.5 py-3 flex flex-col items-center gap-5">
          <button 
            aria-label="Mute" 
            onClick={onMuteToggle} 
            className="size-9 grid place-items-center text-white/90 hover:scale-110 transition-transform"
          >
            {isMuted ? "🔇" : "🔊"}
          </button>
          <div className="h-px w-6 bg-white/10 self-center" />
          <button 
            aria-label="Like" 
            onClick={onLike} 
            className="size-9 grid place-items-center text-white/90 hover:scale-110 transition-transform"
          >
            ♡
          </button>
          <button 
            aria-label="Comment" 
            onClick={onComment} 
            className="size-9 grid place-items-center text-white/90 hover:scale-110 transition-transform"
          >
            💬
          </button>
          <button 
            aria-label="Share" 
            onClick={onShare} 
            className="size-9 grid place-items-center text-white/90 hover:scale-110 transition-transform"
          >
            ↗
          </button>
        </div>
      </div>

      {/* Metadata capsule (bottom-left) */}
      <div 
        className={`absolute left-3 right-3 md:left-4 md:right-4 transition-all duration-300 ease-out ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
        style={{
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + max(72px, var(--bottom-nav-height, 72px) + 10px))',
        }}
      >
        {/* Only render if we have content */}
        {(authorName || caption) && (
          <div className="pointer-events-auto max-w-[88%] md:max-w-[66%] flex items-start gap-3 backdrop-blur-2xl bg-[rgba(30,30,30,0.35)] rounded-2xl p-3 shadow-lg border border-white/10">
            <button onClick={onAuthorPress} className="shrink-0 relative">
              <img 
                src={avatarUrl || '/placeholder.svg'} 
                alt={authorName} 
                className="size-10 rounded-full object-cover ring-2 ring-white/80" 
              />
              {/* Accent ring */}
              <span
                className="absolute inset-0 rounded-full"
                style={{ boxShadow: `0 0 0 2px ${accentColor}` }}
              />
            </button>
            <div className="min-w-0 flex-1">
              <div 
                className="font-semibold text-white text-[15px] leading-tight"
                style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
              >
                {authorName}
              </div>
              {caption && (
                <div 
                  className="text-white/85 text-[14px] leading-snug line-clamp-3 mt-0.5"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.35)' }}
                >
                  {caption}
                </div>
              )}
              {/* Liquid progress line */}
              <div className="mt-2 h-[2px] rounded bg-white/15 overflow-hidden">
                <div
                  className="h-full rounded transition-all duration-75 ease-linear"
                  style={{
                    width: `${Math.min(100, Math.max(0, progress * 100))}%`,
                    background: `linear-gradient(90deg, ${accentColor}, rgba(255,255,255,0.9))`,
                    boxShadow: `0 0 4px ${accentColor}80`,
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
