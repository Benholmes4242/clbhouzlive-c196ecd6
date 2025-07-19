import React from 'react';
import { Heart, MessageCircle, Share, VolumeX, Volume2 } from 'lucide-react';
import { useGlobalAudio } from '@/contexts/GlobalAudioContext';
import { useVideoPlaybackManager } from '@/contexts/VideoPlaybackManager';

interface InteractionIconsOverlayProps {
  onInteractionClick: (e: React.MouseEvent, type: string) => void;
  currentMediaType?: 'image' | 'video';
}

export const InteractionIconsOverlay: React.FC<InteractionIconsOverlayProps> = ({
  onInteractionClick,
  currentMediaType = 'image'
}) => {
  const { isGloballyMuted, toggleGlobalMute } = useGlobalAudio();
  const { muteAllVideos } = useVideoPlaybackManager();

  const handleMuteToggle = (e: React.MouseEvent) => {
    console.log('🔍 DEBUG: Mute button clicked - event details:', {
      type: e.type,
      target: e.target,
      currentTarget: e.currentTarget,
      bubbles: e.bubbles,
      timeStamp: e.timeStamp
    });
    
    e.stopPropagation();
    e.preventDefault();
    e.nativeEvent?.stopImmediatePropagation?.();
    
    // Only toggle global mute state - no video interaction at all
    console.log('🔊 About to toggle global mute - current state:', isGloballyMuted);
    toggleGlobalMute();
    console.log('🔊 Mute button clicked - only toggling global state');
  };

  const handleInteractionClick = (e: React.MouseEvent, type: string) => {
    console.log(`🔍 DEBUG: ${type} button clicked - event details:`, {
      type: e.type,
      target: e.target,
      currentTarget: e.currentTarget,
      bubbles: e.bubbles,
      timeStamp: e.timeStamp
    });
    
    e.stopPropagation();
    e.preventDefault();
    e.nativeEvent?.stopImmediatePropagation?.();
    
    // Block any video interaction - just handle the overlay action
    console.log(`💫 ${type} button clicked - blocking video interaction`);
    
    // Call the original handler but ensure no video restart
    onInteractionClick(e, type);
  };

  return (
    <div className="absolute bottom-4 right-4 z-20">
      <div className="flex flex-col items-center gap-6 text-white text-lg opacity-90">
        {/* Mute/Unmute toggle button - only show for video posts */}
        {currentMediaType === 'video' && (
          <button 
            className="cursor-pointer hover:opacity-100 transition-opacity"
            onClick={handleMuteToggle}
            title={isGloballyMuted ? "Unmute all videos" : "Mute all videos"}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            {isGloballyMuted ? (
              <VolumeX className="w-8 h-8" />
            ) : (
              <Volume2 className="w-8 h-8" />
            )}
          </button>
        )}
        
        <button 
          className="cursor-pointer hover:opacity-100 transition-opacity"
          onClick={(e) => handleInteractionClick(e, 'like')}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <Heart className="w-8 h-8" />
        </button>
        <button 
          className="cursor-pointer hover:opacity-100 transition-opacity"
          onClick={(e) => handleInteractionClick(e, 'comment')}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <MessageCircle className="w-8 h-8" />
        </button>
        <button 
          className="cursor-pointer hover:opacity-100 transition-opacity"
          onClick={(e) => handleInteractionClick(e, 'share')}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <Share className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
};