/**
 * HLSVideoCard - DEPRECATED
 * 
 * This is a backward-compatibility wrapper around UnifiedVideoPlayer.
 * New code should import directly from '@/media':
 * 
 *   import { UnifiedVideoPlayer } from '@/media';
 * 
 * @deprecated Use UnifiedVideoPlayer from '@/media' instead
 */

import React, { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { UnifiedVideoPlayer, UnifiedVideoPlayerRef } from '@/media';

interface HLSVideoCardProps {
  hlsUrl: string;
  poster?: string;
  className?: string;
  aspectRatio?: string;
  fit?: 'cover' | 'contain';
  showControls?: boolean;
  showMuteButton?: boolean;
  showCenterSpinner?: boolean;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onClick?: () => void;
  onEnded?: () => void;
  externallyManaged?: boolean;
  shouldAttach?: boolean;
  isNearby?: boolean;
  isActive?: boolean;
}

/**
 * @deprecated Use UnifiedVideoPlayer from '@/media' instead
 */
const HLSVideoCard = forwardRef<HTMLVideoElement, HLSVideoCardProps>(({
  hlsUrl,
  poster,
  className = '',
  aspectRatio = '4/5',
  fit = 'cover',
  showControls = false,
  showMuteButton = false,
  autoplay = false,
  muted = true,
  loop = true,
  onPlay,
  onPause,
  onClick,
  onEnded,
  externallyManaged = false,
}, ref) => {
  const playerRef = useRef<UnifiedVideoPlayerRef>(null);

  // Expose video element to parent via ref
  useImperativeHandle(ref, () => {
    return playerRef.current?.getVideoElement() as HTMLVideoElement;
  }, []);

  // Map aspectRatio string to proper format
  const normalizedAspectRatio = aspectRatio.includes(':') 
    ? aspectRatio as '3:4' | '16:9' | '1:1' | '9:16'
    : aspectRatio.includes('/') 
      ? aspectRatio.replace('/', ':') as '3:4' | '16:9' | '1:1' | '9:16'
      : 'auto';

  return (
    <div
      className={`relative overflow-hidden bg-black ${className}`}
      style={{ aspectRatio: aspectRatio.includes(':') ? aspectRatio.replace(':', '/') : aspectRatio }}
    >
      <UnifiedVideoPlayer
        ref={playerRef}
        src={hlsUrl}
        posterUrl={poster}
        className="absolute inset-0 w-full h-full"
        objectFit={fit}
        autoplay={autoplay}
        muted={muted}
        loop={loop}
        controls={showControls}
        showMuteButton={showMuteButton}
        managedByMediaRuntime={externallyManaged}
        onClick={onClick}
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onEnded}
      />
    </div>
  );
});

HLSVideoCard.displayName = 'HLSVideoCard';

export default HLSVideoCard;
