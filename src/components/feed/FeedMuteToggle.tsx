import React from 'react';
import { VolumeX, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGlobalAudio } from '@/contexts/GlobalAudioContext';

interface FeedMuteToggleProps {
  isVideoPost?: boolean;
}

const FeedMuteToggle: React.FC<FeedMuteToggleProps> = ({ isVideoPost = false }) => {
  const { isGloballyMuted, toggleGlobalMute } = useGlobalAudio();

  // Only show for video posts
  if (!isVideoPost) {
    return null;
  }

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="text-muted-foreground hover:text-primary"
      onClick={toggleGlobalMute}
      title={isGloballyMuted ? "Unmute all videos" : "Mute all videos"}
    >
      {isGloballyMuted ? (
        <VolumeX className="h-4 w-4 mr-1" />
      ) : (
        <Volume2 className="h-4 w-4 mr-1" />
      )}
      {isGloballyMuted ? 'Unmute' : 'Mute'}
    </Button>
  );
};

export default FeedMuteToggle;