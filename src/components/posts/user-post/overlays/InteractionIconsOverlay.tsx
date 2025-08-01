import React from 'react';
import { MessageCircle, Share, VolumeX, Volume2 } from 'lucide-react';
import { useGlobalAudio } from '@/contexts/GlobalAudioContext';
import { useVideoPlaybackManager } from '@/contexts/VideoPlaybackManager';
import { QuickReactionButton } from '@/components/clubhouse/QuickReactionButton';
import { usePostReactions } from '@/hooks/usePostReactions';

interface InteractionIconsOverlayProps {
  postId: string;
  onInteractionClick: (e: React.MouseEvent, type: string) => void;
  currentMediaType?: 'image' | 'video';
}

export const InteractionIconsOverlay: React.FC<InteractionIconsOverlayProps> = ({
  postId,
  onInteractionClick,
  currentMediaType = 'image'
}) => {
  const { isGloballyMuted, toggleGlobalMute } = useGlobalAudio();
  const { muteAllVideos } = useVideoPlaybackManager();
  const { getPostReactions, getUserReaction, handleReaction } = usePostReactions();

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleGlobalMute();
    // When globally muting, ensure all videos are immediately muted
    if (!isGloballyMuted) {
      muteAllVideos();
    }
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
          >
            {isGloballyMuted ? (
              <VolumeX className="w-8 h-8" />
            ) : (
              <Volume2 className="w-8 h-8" />
            )}
          </button>
        )}
        
        <QuickReactionButton
          postId={postId}
          reactions={getPostReactions(postId)}
          userReaction={getUserReaction(postId)}
          onReact={handleReaction}
          className=""
        />
        <button 
          className="cursor-pointer hover:opacity-100 transition-opacity"
          onClick={(e) => onInteractionClick(e, 'comment')}
        >
          <MessageCircle className="w-8 h-8" />
        </button>
        <button 
          className="cursor-pointer hover:opacity-100 transition-opacity"
          onClick={(e) => onInteractionClick(e, 'share')}
        >
          <Share className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
};