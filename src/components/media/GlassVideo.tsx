import React from 'react';
import './GlassVideo.css';

type Props = {
  src: string;           // direct MP4/HLS URL (H.264 if MP4)
  poster?: string;       // thumbnail URL
  ratio?: number;        // e.g. 16/9 = 1.777…
  onPlayTap?: () => void;
};

export function GlassVideo({ src, poster, ratio = 16/9, onPlayTap }: Props) {
  return (
    <div className="video-frame">
      {/* aspect-ratio reserves height on iOS before metadata */}
      <div className="video-sizer" style={{ aspectRatio: String(ratio) }}>
        <video
          className="video-el"
          src={src}
          poster={poster}
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
        onClick={(e) => {
          e.preventDefault();
          const v = (e.currentTarget.parentElement as HTMLElement)
            .querySelector('video') as HTMLVideoElement | null;
          v?.play();
          onPlayTap?.();
        }}
      >
        ▶
      </button>
    </div>
  );
}
