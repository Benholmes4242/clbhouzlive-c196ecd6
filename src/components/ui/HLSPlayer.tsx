import { useEffect, useRef } from "react";
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
  const hlsRef = useRef<Hls | null>(null);

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

  // react to parent state
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    console.log('🎥 HLSPlayer mute change:', muted);
    v.muted = muted;
  }, [muted]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    console.log('🎥 HLSPlayer playing state change:', playing);
    if (playing) {
      v.play().catch((err) => {
        console.warn("video.play() blocked/error", err);
      });
    } else {
      v.pause();
    }
  }, [playing]);

  return (
    <video
      ref={videoRef}
      poster={poster}
      playsInline
      preload="none"      // Don't prebuffer inactive cards
      controls={false}
      className="w-full h-full object-cover"
    />
  );
}