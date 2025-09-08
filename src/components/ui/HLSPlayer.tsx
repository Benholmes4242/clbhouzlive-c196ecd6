import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

type Props = {
  src: string;              // https://videodelivery.net/<VIDEO_ID>/manifest/video.m3u8
  playing: boolean;         // parent decides play/pause
  muted: boolean;           // parent decides mute
  poster?: string;          // Stream thumbnail
  onReady?: (el: HTMLVideoElement) => void; // optional
};

export default function HLSPlayer({ src, playing, muted, poster, onReady }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const posterRef = useRef<HTMLImageElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isPosterLoaded, setIsPosterLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  console.log('🎥 HLSPlayer render:', { src, playing, muted });

  // attach source once video element exists
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    console.log('🎥 HLSPlayer attaching source:', src);

    // iOS/Safari: native HLS
    if (video.canPlayType("application/vnd.apple.mpegURL")) {
      if (video.src !== src) {
        video.src = src;
        console.log('🎥 Safari: Set video.src directly');
      }
    } else if (Hls.isSupported()) {
      // Chrome/Firefox: hls.js
      if (!hlsRef.current) {
        hlsRef.current = new Hls({ enableWorker: true, lowLatencyMode: true });
        hlsRef.current.on(Hls.Events.ERROR, (_, data) => {
          // surfacing errors is key when it "doesn't play"
          console.warn("HLS error", data.type, data.details, data);
        });
        hlsRef.current.attachMedia(video);
        hlsRef.current.on(Hls.Events.MEDIA_ATTACHED, () => {
          hlsRef.current?.loadSource(src);
          console.log('🎥 HLS.js: Source loaded');
        });
      } else {
        hlsRef.current.loadSource(src);
        console.log('🎥 HLS.js: Source reloaded');
      }
    } else {
      // (Optional) fallback: MP4 URL if you have one
      video.src = src;
      console.log('🎥 Fallback: Set video.src directly');
    }

    onReady?.(video);

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, onReady]);

  // Handle video ready state
  const handleVideoReady = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.readyState >= 3) { // HAVE_FUTURE_DATA
      setIsVideoReady(true);
    }
  };

  // Handle video play/pause events
  const handleVideoPlay = () => {
    setIsPlaying(true);
  };

  const handleVideoPause = () => {
    setIsPlaying(false);
  };

  // react to parent state
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    console.log('🎥 HLSPlayer mute change:', muted);
    v.muted = muted;
  }, [muted]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !isVideoReady) return;
    console.log('🎥 HLSPlayer playing state change:', playing);
    if (playing) {
      v.play().catch((err) => {
        console.warn("video.play() blocked/error", err);
      });
    } else {
      v.pause();
    }
  }, [playing, isVideoReady]);

  // Determine poster visibility: show until video is playing
  const showPoster = !isPlaying && poster && isPosterLoaded;

  return (
    <div className="relative w-full h-full">
      {/* Poster Image - stays visible until video starts playing */}
      {poster && (
        <img
          ref={posterRef}
          src={poster}
          alt="Video poster"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            showPoster ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
          onLoad={() => setIsPosterLoaded(true)}
          onError={() => setIsPosterLoaded(false)}
        />
      )}

      {/* Video Element */}
      <video
        ref={videoRef}
        playsInline
        preload="metadata"      // Load enough to show first frame
        controls={false}
        className={`w-full h-full object-cover ${isPlaying ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        onLoadedData={handleVideoReady}
        onCanPlay={handleVideoReady}
        onPlay={handleVideoPlay}
        onPause={handleVideoPause}
      />
    </div>
  );
}