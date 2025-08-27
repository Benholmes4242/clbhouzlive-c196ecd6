import React from 'react';
import { VolumeX, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGlobalAudio } from '@/contexts/GlobalAudioContext';
import { useVideoPlaybackManager } from '@/contexts/VideoPlaybackManager';

interface FeedMuteToggleProps {
  isVideoPost?: boolean;
}

const FeedMuteToggle: React.FC<FeedMuteToggleProps> = ({ isVideoPost = false }) => {
  const { isGloballyMuted, toggleGlobalMute } = useGlobalAudio();
  const { muteAllVideos } = useVideoPlaybackManager();

  // Only show for video posts
  if (!isVideoPost) {
    return null;
  }

  const handleToggle = () => {
    toggleGlobalMute();
    // When globally muting, ensure all videos are muted
    if (!isGloballyMuted) {
      muteAllVideos();
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="text-muted-foreground hover:text-primary"
      onClick={handleToggle}
      title={isGloballyMuted ? "Unmute all videos" : "Mute all videos"}
    >
      {isGloballyMuted ? (
        <VolumeX className="h-4 w-4 mr-1" fill="currentColor" />
      ) : (
        <Volume2 className="h-4 w-4 mr-1" fill="currentColor" />
      )}
      {isGloballyMuted ? 'Unmute' : 'Mute'}
    </Button>
  );
};

export default FeedMuteToggle;