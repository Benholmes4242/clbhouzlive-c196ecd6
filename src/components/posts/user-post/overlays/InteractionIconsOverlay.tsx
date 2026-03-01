import React from 'react';
import { Heart, MessageCircle, Share, VolumeX, Volume2 } from 'lucide-react';
import { useGlobalAudio } from '@/contexts/GlobalAudioContext';

interface InteractionIconsOverlayProps {
  onInteractionClick: (e: React.MouseEvent, type: string) => void;
  currentMediaType?: 'image' | 'video';
}

/**
 * InteractionIconsOverlay - Social interaction buttons for posts
 * 
 * REFACTORED: Removed useVideoPlaybackManager dependency.
 * Mute state is handled via GlobalAudioContext only.
 * MediaRuntime is the single playback authority.
 */
export const InteractionIconsOverlay: React.FC<InteractionIconsOverlayProps> = ({
  onInteractionClick,
  currentMediaType = 'image'
}) => {
  const { isGloballyMuted, toggleGlobalMute, markUserGestureUnmute } = useGlobalAudio();

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isGloballyMuted) markUserGestureUnmute();
    toggleGlobalMute();
  };

  return (
    <div className="absolute bottom-4 right-4 z-20">
      {/* Glassmorphic Container for Action Buttons */}
      <div 
        className="rounded-2xl backdrop-blur-md border border-white/20 p-3"
        style={{
          background: 'rgba(255, 255, 255, 0.18)',
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)'
        }}
      >
        <div className="flex flex-col items-center gap-3 text-white">
          {/* Mute/Unmute toggle button - only show for video posts */}
          {currentMediaType === 'video' && (
            <button 
              className="group relative w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 
                       flex items-center justify-center hover:bg-white/20 hover:scale-110 active:scale-95 
                       transition-all duration-200 overflow-hidden"
              onClick={handleMuteToggle}
              title={isGloballyMuted ? "Unmute all videos" : "Mute all videos"}
            >
              {/* Pulse animation on hover */}
              <div className="absolute inset-0 bg-white/20 rounded-full scale-0 group-hover:scale-150 
                           opacity-0 group-hover:opacity-30 transition-all duration-300" />
              
              {/* Ripple effect on tap */}
              <div className="absolute inset-0 bg-white/30 rounded-full scale-0 group-active:scale-150 
                           opacity-0 group-active:opacity-50 transition-all duration-200" />
              
              {isGloballyMuted ? (
                <VolumeX className="relative w-5 h-5 z-10" />
              ) : (
                <Volume2 className="relative w-5 h-5 z-10" />
              )}
            </button>
          )}
          
          <button 
            className="group relative w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 
                     flex items-center justify-center hover:bg-white/20 hover:scale-110 active:scale-95 
                     transition-all duration-200 overflow-hidden"
            onClick={(e) => onInteractionClick(e, 'like')}
          >
            {/* Pulse animation on hover */}
            <div className="absolute inset-0 bg-white/20 rounded-full scale-0 group-hover:scale-150 
                         opacity-0 group-hover:opacity-30 transition-all duration-300" />
            
            {/* Ripple effect on tap */}
            <div className="absolute inset-0 bg-white/30 rounded-full scale-0 group-active:scale-150 
                         opacity-0 group-active:opacity-50 transition-all duration-200" />
            
            <Heart className="relative w-5 h-5 z-10" />
          </button>
          
          <button 
            className="group relative w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 
                     flex items-center justify-center hover:bg-white/20 hover:scale-110 active:scale-95 
                     transition-all duration-200 overflow-hidden"
            onClick={(e) => onInteractionClick(e, 'comment')}
          >
            {/* Pulse animation on hover */}
            <div className="absolute inset-0 bg-white/20 rounded-full scale-0 group-hover:scale-150 
                         opacity-0 group-hover:opacity-30 transition-all duration-300" />
            
            {/* Ripple effect on tap */}
            <div className="absolute inset-0 bg-white/30 rounded-full scale-0 group-active:scale-150 
                         opacity-0 group-active:opacity-50 transition-all duration-200" />
            
            <MessageCircle className="relative w-5 h-5 z-10" />
          </button>
          
          <button 
            className="group relative w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 
                     flex items-center justify-center hover:bg-white/20 hover:scale-110 active:scale-95 
                     transition-all duration-200 overflow-hidden"
            onClick={(e) => onInteractionClick(e, 'share')}
          >
            {/* Pulse animation on hover */}
            <div className="absolute inset-0 bg-white/20 rounded-full scale-0 group-hover:scale-150 
                         opacity-0 group-hover:opacity-30 transition-all duration-300" />
            
            {/* Ripple effect on tap */}
            <div className="absolute inset-0 bg-white/30 rounded-full scale-0 group-active:scale-150 
                         opacity-0 group-active:opacity-50 transition-all duration-200" />
            
            <Share className="relative w-5 h-5 z-10" />
          </button>
        </div>
      </div>
    </div>
  );
};
