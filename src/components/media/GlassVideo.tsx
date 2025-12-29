import React, { useRef, useCallback, useId } from 'react';
import './GlassVideo.css';
import { MediaRuntime } from '@/media/runtime/MediaRuntime';

type Props = {
  src: string;           // direct MP4/HLS URL (H.264 if MP4)
  poster?: string;       // thumbnail URL
  ratio?: number;        // e.g. 16/9 = 1.777…
  onPlayTap?: () => void;
};

/**
 * Glass-styled video player with overlay play button.
 * Uses MediaRuntime for playback control.
 */
export function GlassVideo({ src, poster, ratio = 16/9, onPlayTap }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaId = useId();
  
  const handlePlayClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    // Route through MediaRuntime for user-tap playback
    MediaRuntime.requestPlay({ id: mediaId, surface: 'fullscreen', reason: 'user' });
    onPlayTap?.();
  }, [onPlayTap, mediaId]);

  return (
    <div className="video-frame">
      {/* aspect-ratio reserves height on iOS before metadata */}
      <div className="video-sizer" style={{ aspectRatio: String(ratio) }}>
        <video
          ref={videoRef}
          className="video-el"
          src={src}
          controls
          playsInline               // iOS Safari inline rendering
          webkit-playsinline="true"
          preload="metadata"
          controlsList="nodownload"
          disablePictureInPicture
        />
      </div>

      {/* Optional overlay play button (click-through fixed) */}
      <button
        className="video-play"
        aria-label="Play video"
        onClick={handlePlayClick}
      >
        ▶
      </button>
    </div>
  );
}
