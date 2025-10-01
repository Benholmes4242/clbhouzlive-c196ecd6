import React, { useRef, useEffect } from 'react';
import EnhancedVideoPlayer from '@/components/ui/enhanced-video-player';

interface KeyframePlayerProps {
  videoUrl: string;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
}

export const KeyframePlayer: React.FC<KeyframePlayerProps> = ({
  videoUrl,
  currentTime,
  onTimeUpdate
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && Math.abs(videoRef.current.currentTime - currentTime) > 0.5) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      onTimeUpdate(videoRef.current.currentTime);
    }
  };

  return (
    <div className="w-full">
      <h3 className="text-sm font-medium mb-3">Swing Video</h3>
      <div className="aspect-video bg-muted rounded-lg overflow-hidden">
        <EnhancedVideoPlayer
          ref={videoRef}
          src={videoUrl}
          controls
          className="w-full h-full"
          onTimeUpdate={handleTimeUpdate}
          objectFit="contain"
        />
      </div>
    </div>
  );
};