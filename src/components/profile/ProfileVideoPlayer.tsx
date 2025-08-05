import React, { useRef, useEffect, useState } from 'react';
import { Play, Volume2, VolumeX } from 'lucide-react';
import FeedVideoPlayer from '@/components/feed/FeedVideoPlayer';
import { useExclusiveVideoAudio } from '@/hooks/useExclusiveVideoAudio';

interface ProfileVideoPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string;
  className?: string;
  onVideoEnd?: () => void;
  autoPlay?: boolean;
}

const ProfileVideoPlayer: React.FC<ProfileVideoPlayerProps> = ({
  videoUrl,
  thumbnailUrl,
  className = '',
  onVideoEnd,
  autoPlay = true
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showReplayButton, setShowReplayButton] = useState(false);
  
  const { isMuted, toggleMute, isActive } = useExclusiveVideoAudio(`profile-video-${videoUrl}`);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    console.log('ProfileVideoPlayer - Loading video:', videoUrl);

    const handleLoadedData = () => {
      console.log('ProfileVideoPlayer - Video loaded successfully');
      if (autoPlay && !hasPlayed) {
        video.play().then(() => {
          setIsPlaying(true);
          setHasPlayed(true);
          console.log('ProfileVideoPlayer - Video playing');
        }).catch((error) => {
          console.error('ProfileVideoPlayer - Play failed:', error);
        });
      }
    };

    const handleEnded = () => {
      console.log('ProfileVideoPlayer - Video ended');
      setIsPlaying(false);
      setShowReplayButton(true);
      onVideoEnd?.();
    };

    const handlePlay = () => {
      console.log('ProfileVideoPlayer - Video play event');
      setIsPlaying(true);
    };
    
    const handlePause = () => {
      console.log('ProfileVideoPlayer - Video pause event');
      setIsPlaying(false);
    };

    const handleError = (e: any) => {
      console.error('ProfileVideoPlayer - Video error:', e);
      console.error('ProfileVideoPlayer - Video error details:', video.error);
    };

    const handleLoadStart = () => {
      console.log('ProfileVideoPlayer - Video load started');
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('error', handleError);
    video.addEventListener('loadstart', handleLoadStart);

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('error', handleError);
      video.removeEventListener('loadstart', handleLoadStart);
    };
  }, [autoPlay, hasPlayed, onVideoEnd]);

  const handleReplay = () => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      video.play().then(() => {
        setIsPlaying(true);
        setShowReplayButton(false);
      }).catch(console.error);
    }
  };

  const handleVideoClick = () => {
    if (showReplayButton) {
      handleReplay();
    } else {
      // Allow clicking to replay even when video is playing/ended
      handleReplay();
    }
  };

  return (
    <div className={`relative rounded-full overflow-hidden ${className}`}>
      <FeedVideoPlayer
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-cover"
        muted={isMuted}
        playsInline
        preload="metadata"
        onClick={handleVideoClick}
      />
      
      {/* Replay Button Overlay */}
      {showReplayButton && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <button
            onClick={handleReplay}
            className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-full p-3 hover:bg-white/30 transition-all duration-200"
            aria-label="Replay video"
          >
            <Play className="w-6 h-6 text-white fill-white" />
          </button>
        </div>
      )}

      {/* Mute Toggle - only show when video is playing */}
      {isPlaying && (
        <button
          onClick={toggleMute}
          className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm rounded-full p-2 hover:bg-black/70 transition-all duration-200"
          aria-label={isMuted ? "Unmute video" : "Mute video"}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-white" />
          ) : (
            <Volume2 className="w-4 h-4 text-white" />
          )}
        </button>
      )}
    </div>
  );
};

export default ProfileVideoPlayer;