import React from 'react';
import { VolumeX, Volume2, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGlobalAudio } from '@/contexts/GlobalAudioContext';

interface FeedMuteToggleProps {
  isVideoPost?: boolean;
  /** When true, shows music-specific labeling since original video audio is always muted */
  postHasMusic?: boolean;
}

/**
 * FeedMuteToggle - Mute/unmute toggle for video posts
 * 
 * REFACTORED: Removed useVideoPlaybackManager dependency.
 * Global mute is now handled via GlobalAudioContext only.
 * MediaRuntime is the single playback authority - no direct mute control needed here.
 * 
 * When postHasMusic=true: Controls music track audio (original video audio is always muted)
 * When postHasMusic=false: Controls global audio for videos
 */
const FeedMuteToggle: React.FC<FeedMuteToggleProps> = ({ 
  isVideoPost = false,
  postHasMusic = false 
}) => {
  const { isGloballyMuted, toggleGlobalMute } = useGlobalAudio();

  // Only show for video posts
  if (!isVideoPost) {
    return null;
  }

  const handleToggle = () => {
    toggleGlobalMute();
  };

  // When post has music, show music-specific labeling
  if (postHasMusic) {
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-muted-foreground hover:text-primary"
        onClick={handleToggle}
        title={isGloballyMuted ? "Unmute track" : "Mute track"}
      >
        {isGloballyMuted ? (
          <VolumeX className="h-3 w-3 mr-1" />
        ) : (
          <Music className="h-3 w-3 mr-1" />
        )}
        {isGloballyMuted ? 'Unmute' : 'Track'}
      </Button>
    );
  }

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="text-muted-foreground hover:text-primary"
      onClick={handleToggle}
      title={isGloballyMuted ? "Unmute all videos" : "Mute all videos"}
    >
      {isGloballyMuted ? (
        <VolumeX className="h-3 w-3 mr-1" fill="currentColor" />
      ) : (
        <Volume2 className="h-3 w-3 mr-1" fill="currentColor" />
      )}
      {isGloballyMuted ? 'Unmute' : 'Mute'}
    </Button>
  );
};

export default FeedMuteToggle;
