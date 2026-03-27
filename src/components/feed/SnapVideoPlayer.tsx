import React, { useRef, useEffect, useCallback, useState, memo } from 'react';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { loadHlsJs } from '@/utils/hlsLoader';
import { haptic } from '@/utils/haptics';
import { HLSPoolManager } from '@/media/HLSPoolManager';
import { registerAudioSource, unregisterAudioSource } from '@/utils/globalVideoMute';

import { isPrefetchComplete } from '@/utils/hlsPreload';
import { extractCloudflareUid } from '@/utils/videoIdUtils';
import { getSharedBandwidth, saveSharedBandwidth } from '@/utils/sharedBandwidth';
import type HlsType from 'hls.js';

const HLS_CONFIG = {
  enableWorker: true,
  lowLatencyMode: false,
  backBufferLength: 10,
  maxBufferLength: 30,
  maxMaxBufferLength: 60,
  startLevel: -1,
  capLevelToPlayerSize: false,
  abrEwmaDefaultEstimate: getSharedBandwidth(),
};



interface SnapVideoPlayerProps {
  hlsUrl: string;
  mp4Url?: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number;
  isActive: boolean;
  activeIndex: number;
  feedIndex: number;
  isSuggestedFeed: boolean;
  onDoubleTapLike?: () => void;
  onFirstFrameReady?: () => void;
}

export const SnapVideoPlayer = memo(function SnapVideoPlayer({
  hlsUrl,
  mp4Url,
  thumbnailUrl,
  width,
  height,
  duration,
  isActive,
  activeIndex,
  feedIndex,
  isSuggestedFeed,
  onDoubleTapLike,
  onFirstFrameReady,
}: SnapVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<HlsType | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [showReplay, setShowReplay] = useState(false);
  
  const lastTapRef = useRef(0);
  const firstFrameFiredRef = useRef(false);

  const isMuted = useClubhouseStore(s => s.isMuted);
  const userPaused = useClubhouseStore(s => s.userPaused);

  // Register with global audio mutex
  useEffect(() => {
    const id = `snap-video-${feedIndex}`;
    registerAudioSource(id, () => {
      const video = videoRef.current;
      if (video) {
        video.muted = true;
      }
      // Do NOT call setIsMuted(true) — this would wipe the user's global preference.
      // The mutex only silences this specific element; the global preference is unchanged.
    });
    return () => unregisterAudioSource(id);
  }, [feedIndex]);

  const isLandscape = (width ?? 0) > (height ?? 1);
  const objectFit = isLandscape ? 'contain' : 'cover';

  // ── Attach/detach HLS ──
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!isActive) {
      video.pause();
      const distance = Math.abs(feedIndex - activeIndex);
      if (distance <= 2) {
        // Adjacent slide — stop loading but keep buffer intact
        if (hlsRef.current) {
          hlsRef.current.stopLoad();
        }
        
      } else {
        // Far away — fully destroy to free memory
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
        video.removeAttribute('src');
        video.load();
        setVideoReady(false);
        setShowReplay(false);
        
      }
      useClubhouseStore.getState().setActiveVideoElement(null, null);
      return;
    }

    // Active — attach
    let cancelled = false;

    const attach = async () => {
      

      // If HLS instance already exists (was stopped, not destroyed), resume it
      if (hlsRef.current) {
        hlsRef.current.startLoad();
        video.muted = useClubhouseStore.getState().isMuted;
        try {
          await video.play();
        } catch {
        // Autoplay blocked — mute this element only to recover playback.
        video.muted = true;
        useClubhouseStore.getState().setIsMuted(true);
        video.play().catch(() => {});
        }
        useClubhouseStore.getState().setActiveVideoElement(video, videoRef);
        return;
      }

      const Hls = await loadHlsJs();

      if (cancelled) return;

      // Low-memory: use native HLS
      const deviceMemory = (navigator as any).deviceMemory;
      const useNative = (deviceMemory && deviceMemory <= 2) || !Hls || !Hls.isSupported();

      if (useNative) {
        video.src = hlsUrl || mp4Url || '';
      } else {
        // Prefetch status check — use Cloudflare UID to match hlsPreload's key
        const videoId = extractCloudflareUid(hlsUrl) || hlsUrl;
        const prefetchStatus = isPrefetchComplete(videoId) ? 'hit' : 'miss';

        // Check pool for a pre-buffered instance first
        const pooledHls = HLSPoolManager.promote(hlsUrl, video);

        if (pooledHls) {
          hlsRef.current = pooledHls;
          pooledHls.startLoad();

          pooledHls.on(Hls.Events.FRAG_LOADED, (_, data) => {
            if (data.frag?.stats?.bwEstimate && data.frag.stats.bwEstimate > 0) {
              saveSharedBandwidth(data.frag.stats.bwEstimate);
            }
          });
        } else {
          const hls = new Hls(HLS_CONFIG);
          hlsRef.current = hls;
          hls.loadSource(hlsUrl || mp4Url || '');
          hls.attachMedia(video);

          hls.on(Hls.Events.FRAG_LOADED, (_, data) => {
            if (data.frag?.stats?.bwEstimate && data.frag.stats.bwEstimate > 0) {
              saveSharedBandwidth(data.frag.stats.bwEstimate);
            }
          });
        }
      }

      video.muted = useClubhouseStore.getState().isMuted;
      
      try {
        await video.play();
      } catch {
        // Autoplay blocked — mute this element and sync store so UI matches.
        video.muted = true;
        useClubhouseStore.getState().setIsMuted(true);
        video.play().catch(() => {});
      }

      useClubhouseStore.getState().setActiveVideoElement(video, videoRef);
    };

    attach();

    return () => {
      cancelled = true;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [isActive, activeIndex, feedIndex, hlsUrl, mp4Url]);

  // ── Sync muted state ──
  useEffect(() => {
    const video = videoRef.current;
    if (video && isActive) {
      video.muted = isMuted;
    }
  }, [isMuted, isActive]);

  // ── Sync userPaused ──
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isActive) return;
    if (userPaused) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  }, [userPaused, isActive]);

  // ── First frame detection + crossfade ──
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlaying = () => {
      setVideoReady(true);
      if (!firstFrameFiredRef.current) {
        firstFrameFiredRef.current = true;
        onFirstFrameReady?.();
      }
    };

    const handleWaiting = () => {};
    const handlePlayingRecovery = () => {};

    video.addEventListener('playing', handlePlaying);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlayingRecovery);
    return () => {
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlayingRecovery);
    };
  }, [onFirstFrameReady]);

  // ── Gapless loop ──
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnded = () => {
      // All videos loop continuously in the feed
      video.currentTime = 0;
      video.play().catch(() => {});
    };

    video.addEventListener('ended', handleEnded);
    return () => video.removeEventListener('ended', handleEnded);
  }, [duration]);

  // ── Tap handling (single = play/pause, double = like) ──
  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap
      lastTapRef.current = 0;
      onDoubleTapLike?.();
      haptic('medium');
    } else {
      lastTapRef.current = now;
      setTimeout(() => {
        if (lastTapRef.current !== 0 && Date.now() - lastTapRef.current >= 280) {
          // Single tap — toggle play/pause
          const store = useClubhouseStore.getState();
          store.setUserPaused(!store.userPaused);
          lastTapRef.current = 0;
        }
      }, 310);
    }
  }, [onDoubleTapLike]);

  // ── Replay handler ──
  const handleReplay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setShowReplay(false);
    
    video.currentTime = 0;
    video.play().catch(() => {});
  }, []);

  return (
    <div
      className="absolute inset-0 w-full h-full overflow-hidden"
      style={{ background: '#111' }}
      onClick={handleTap}
    >
      {/* Blurred background for letterboxing */}
      {thumbnailUrl && (
        <>
          <img
            src={thumbnailUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: 'blur(40px)', transform: 'scale(1.15)', opacity: 0.6 }}
            draggable={false}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-black/55" />
        </>
      )}
      {/* Poster / thumbnail */}
      {thumbnailUrl && (
        <img
          src={thumbnailUrl}
          alt=""
          className="absolute inset-0 w-full h-full"
          style={{ objectFit, zIndex: 1 }}
          loading="eager"
        />
      )}

      {/* Video element */}
      <video
        ref={videoRef}
        playsInline
        preload="metadata"
        poster={thumbnailUrl || undefined}
        className="absolute inset-0 w-full h-full"
        style={{
          objectFit,
          zIndex: 2,
          opacity: videoReady ? 1 : 0,
          transition: 'opacity 0.2s ease',
        }}
      />

      {/* Buffering indicator — subtle bottom bar */}
      {isActive && !videoReady && (
        <div
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{
            zIndex: 3,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      )}

      {/* Replay overlay */}
      {showReplay && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ zIndex: 10, background: 'rgba(0,0,0,0.3)' }}
          onClick={(e) => { e.stopPropagation(); handleReplay(); }}
        >
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
});

export default SnapVideoPlayer;
