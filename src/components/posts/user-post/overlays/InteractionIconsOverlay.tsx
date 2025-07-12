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
    e.stopPropagation();
    toggleGlobalMute();
    // When globally muting, ensure all videos are immediately muted
    if (!isGloballyMuted) {
      muteAllVideos();
    }
  };

  return (
    <div className="absolute bottom-5 right-3 z-20">
      <div className="flex items-center gap-2.5 text-white text-lg opacity-90">
        {/* Mute toggle button - only show for video posts */}
        {currentMediaType === 'video' && (
          <button 
            className="cursor-pointer hover:opacity-100 transition-opacity"
            onClick={handleMuteToggle}
            title={isGloballyMuted ? "Unmute all videos" : "Mute all videos"}
          >
            {isGloballyMuted ? (
              <VolumeX className="w-6 h-6" />
            ) : (
              <Volume2 className="w-6 h-6" />
            )}
          </button>
        )}
        
        <button 
          className="cursor-pointer hover:opacity-100 transition-opacity"
          onClick={(e) => onInteractionClick(e, 'like')}
        >
          <Heart className="w-6 h-6" />
        </button>
        <button 
          className="cursor-pointer hover:opacity-100 transition-opacity"
          onClick={(e) => onInteractionClick(e, 'comment')}
        >
          <MessageCircle className="w-6 h-6" />
        </button>
        <button 
          className="cursor-pointer hover:opacity-100 transition-opacity"
          onClick={(e) => onInteractionClick(e, 'share')}
        >
          <Share className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};