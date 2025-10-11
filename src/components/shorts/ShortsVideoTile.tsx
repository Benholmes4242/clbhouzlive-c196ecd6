import React from 'react';
import Hls from 'hls.js';
import { 
  MAX_ACTIVE_PLAYERS, 
  activePlayers, 
  attachedHls, 
  evictFurthestHls 
} from '@/utils/playerRegistry';

// 🔍 AUDIT FLAG - Remove after diagnosis
const AUDIT_SHORTS_AUTOPLAY = true;

type Props = {
  id: string;
  hlsUrl: string;
  posterUrl?: string;
  shouldAutoplay: boolean;
  inView: boolean;
  onClick?: () => void;
};

export default function ShortsVideoTile({
  id,
  hlsUrl,
  posterUrl,
  shouldAutoplay,
  inView,
  onClick
}: Props) {
  const ref = React.useRef<HTMLVideoElement | null>(null);
  const hlsRef = React.useRef<Hls | null>(null);
  const [ready, setReady] = React.useState(false);
  const [hlsAttached, setHlsAttached] = React.useState(false);
  const rafPlayHandle = React.useRef<number | null>(null);
  const timingsRef = React.useRef({
    mounted: 0,
    raf1: 0,
    raf2: 0,
    posterComputed: 0,
    posterLoaded: 0,
    hlsAttachStart: 0,
    hlsAttached: 0,
    canplay: 0,
    ioIntersect: 0,
    playRequested: 0,
    playing: 0
  });

  // 🔍 AUDIT: Log mount timing
  React.useEffect(() => {
    timingsRef.current.mounted = performance.now();
    if (AUDIT_SHORTS_AUTOPLAY) {
      performance.mark(`${id}:card-mounted`);
      requestAnimationFrame(() => {
        timingsRef.current.raf1 = performance.now();
        performance.mark(`${id}:raf-1`);
      });
      requestAnimationFrame(() => {
        timingsRef.current.raf2 = performance.now();
        performance.mark(`${id}:raf-2`);
      });
    }
  }, [id]);

  // HLS attachment - attach early when card is "nearby" (via inView from grid with generous rootMargin)
  React.useEffect(() => {
    const el = ref.current;
    if (!el || hlsAttached) return;

    // 🔍 AUDIT: Log poster computation
    if (AUDIT_SHORTS_AUTOPLAY) {
      timingsRef.current.posterComputed = performance.now();
      console.log(`[ShortsAudit][${id}] Poster URL:`, posterUrl, 'Has poster:', !!posterUrl);
    }

    // Ensure attributes (critical for mobile autoplay)
    el.muted = true;
    el.loop = true;
    el.playsInline = true;
    el.preload = 'metadata'; // Changed from 'auto' to be less aggressive
    el.setAttribute('playsinline', ''); // iOS compatibility
    el.setAttribute('webkit-playsinline', ''); // Older iOS

    timingsRef.current.hlsAttachStart = performance.now();

    const attachHls = () => {
      if (Hls.isSupported()) {
        // Evict furthest HLS instance if at capacity
        evictFurthestHls(id);
        
        const hls = new Hls({
          maxBufferLength: 10,
          backBufferLength: 5,
          enableWorker: true,
          lowLatencyMode: false
        });
        
        hlsRef.current = hls;
        attachedHls.set(id, hls);

        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          hls.loadSource(hlsUrl);
          timingsRef.current.hlsAttached = performance.now();
          setHlsAttached(true);
          
          if (AUDIT_SHORTS_AUTOPLAY) {
            const T_mount_to_hlsAttach = timingsRef.current.hlsAttached - timingsRef.current.mounted;
            console.log(`[ShortsAudit][${id}] 🔌 HLS attached`, {
              T_mount_to_hlsAttach: T_mount_to_hlsAttach.toFixed(0) + 'ms',
              hlsUrl
            });
          }
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            if (AUDIT_SHORTS_AUTOPLAY) {
              console.error(`[ShortsAudit][${id}] ❌ HLS fatal error:`, data.type, data.details);
            }
            hls.destroy();
            attachedHls.delete(id);
            hlsRef.current = null;
            setHlsAttached(false);
            setReady(false);
          }
        });

        hls.attachMedia(el);
      } else if (el.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari, iOS)
        el.src = hlsUrl;
        setHlsAttached(true);
        
        if (AUDIT_SHORTS_AUTOPLAY) {
          console.log(`[ShortsAudit][${id}] 🍎 Native HLS (Safari/iOS)`, { hlsUrl });
        }
      }
    };

    const onCanPlay = () => {
      timingsRef.current.canplay = performance.now();
      setReady(true);
      if (AUDIT_SHORTS_AUTOPLAY) {
        const T_mount_to_canplay = timingsRef.current.canplay - timingsRef.current.mounted;
        const T_hlsAttach_to_canplay = timingsRef.current.hlsAttached > 0 
          ? timingsRef.current.canplay - timingsRef.current.hlsAttached 
          : 0;
        console.log(`[ShortsAudit][${id}] ✅ canplay event fired`, {
          readyState: el.readyState,
          T_mount_to_canplay: T_mount_to_canplay.toFixed(0) + 'ms',
          T_hlsAttach_to_canplay: T_hlsAttach_to_canplay > 0 ? T_hlsAttach_to_canplay.toFixed(0) + 'ms' : 'N/A'
        });
      }
    };

    const onLoadedMetadata = () => {
      if (AUDIT_SHORTS_AUTOPLAY) {
        console.log(`[ShortsAudit][${id}] 📊 loadedmetadata`, { 
          duration: el.duration,
          videoWidth: el.videoWidth,
          videoHeight: el.videoHeight
        });
      }
    };

    const onPlaying = () => {
      timingsRef.current.playing = performance.now();
      if (AUDIT_SHORTS_AUTOPLAY) {
        const T_mount_to_playing = timingsRef.current.playing - timingsRef.current.mounted;
        const T_playRequest_to_playing = timingsRef.current.playRequested > 0 
          ? timingsRef.current.playing - timingsRef.current.playRequested 
          : 0;
        console.log(`[ShortsAudit][${id}] ✅ PLAYING`, {
          T_mount_to_playing: T_mount_to_playing.toFixed(0) + 'ms',
          T_playRequest_to_playing: T_playRequest_to_playing.toFixed(0) + 'ms',
          activePlayers: activePlayers.size
        });
      }
    };

    const onError = (e: Event) => {
      if (AUDIT_SHORTS_AUTOPLAY) {
        console.error(`[ShortsAudit][${id}] ❌ Video error:`, el.error);
      }
    };

    el.addEventListener('canplay', onCanPlay);
    el.addEventListener('loadedmetadata', onLoadedMetadata);
    el.addEventListener('playing', onPlaying);
    el.addEventListener('error', onError);

    // Attach HLS immediately
    attachHls();

    // Check if already ready (cached/preloaded)
    if (el.readyState >= 2) {
      timingsRef.current.canplay = performance.now();
      setReady(true);
      if (AUDIT_SHORTS_AUTOPLAY) {
        console.log(`[ShortsAudit][${id}] Already ready (readyState >= 2)`);
      }
    }

    return () => {
      el.removeEventListener('canplay', onCanPlay);
      el.removeEventListener('loadedmetadata', onLoadedMetadata);
      el.removeEventListener('playing', onPlaying);
      el.removeEventListener('error', onError);
      
      // Cleanup HLS
      if (hlsRef.current) {
        hlsRef.current.destroy();
        attachedHls.delete(id);
        hlsRef.current = null;
      }
      
      // Remove from active players
      activePlayers.delete(el);
      
      // Cancel any pending play request
      if (rafPlayHandle.current) {
        cancelAnimationFrame(rafPlayHandle.current);
        rafPlayHandle.current = null;
      }
    };
  }, [id, hlsUrl, posterUrl, hlsAttached]);

  // Visibility + alternating policy → play/pause with concurrent limit
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const canPlay = inView && shouldAutoplay;
    
    if (AUDIT_SHORTS_AUTOPLAY && inView && !timingsRef.current.ioIntersect) {
      timingsRef.current.ioIntersect = performance.now();
      const T_mount_to_IO = timingsRef.current.ioIntersect - timingsRef.current.mounted;
      console.log(`[ShortsAudit][${id}] 👁️ IO intersect`, {
        inView,
        shouldAutoplay,
        ready,
        hlsAttached,
        canPlay,
        T_mount_to_IO: T_mount_to_IO.toFixed(0) + 'ms',
        activePlayers: activePlayers.size
      });
    }

    // Helper: request play with rAF debounce to avoid thrash
    const requestPlay = () => {
      if (rafPlayHandle.current) cancelAnimationFrame(rafPlayHandle.current);
      rafPlayHandle.current = requestAnimationFrame(() => {
        rafPlayHandle.current = null;
        
        // Pause other players if we're at the limit
        if (activePlayers.size >= MAX_ACTIVE_PLAYERS) {
          if (AUDIT_SHORTS_AUTOPLAY) {
            console.log(`[ShortsAudit][${id}] 🚫 Pausing ${activePlayers.size} active players (limit: ${MAX_ACTIVE_PLAYERS})`);
          }
          activePlayers.forEach(video => {
            if (video !== el) {
              video.pause();
              const otherHls = hlsRef.current;
              if (otherHls) otherHls.stopLoad();
              activePlayers.delete(video);
            }
          });
        }

        timingsRef.current.playRequested = performance.now();
        const T_IO_to_playRequest = timingsRef.current.ioIntersect > 0 
          ? timingsRef.current.playRequested - timingsRef.current.ioIntersect 
          : 0;
        
        if (AUDIT_SHORTS_AUTOPLAY) {
          console.log(`[ShortsAudit][${id}] ▶️ play() requested`, {
            muted: el.muted,
            playsInline: el.playsInline,
            preload: el.preload,
            readyState: el.readyState,
            T_IO_to_playRequest: T_IO_to_playRequest.toFixed(0) + 'ms'
          });
        }

        // Start network load before playing
        if (hlsRef.current) hlsRef.current.startLoad();

        const playPromise = el.play();
        if (playPromise) {
          playPromise
            .then(() => {
              activePlayers.add(el);
              if (AUDIT_SHORTS_AUTOPLAY) {
                console.log(`[ShortsAudit][${id}] ✅ play() succeeded, added to active players (${activePlayers.size}/${MAX_ACTIVE_PLAYERS})`);
              }
            })
            .catch((err) => {
              if (AUDIT_SHORTS_AUTOPLAY) {
                console.error(`[ShortsAudit][${id}] ❌ play() rejected:`, err.name, err.message);
              }
              // Handle autoplay policy rejection
              if (err?.name === 'NotAllowedError') {
                // Could show a play overlay here; for now just log
                if (AUDIT_SHORTS_AUTOPLAY) {
                  console.log(`[ShortsAudit][${id}] 🚫 Autoplay blocked by policy - needs user gesture`);
                }
              }
            });
        }
      });
    };

    // Helper: request pause with cleanup
    const requestPause = () => {
      if (rafPlayHandle.current) {
        cancelAnimationFrame(rafPlayHandle.current);
        rafPlayHandle.current = null;
      }
      if (!el.paused) {
        el.pause();
        activePlayers.delete(el);
        // Stop network load to save bandwidth
        if (hlsRef.current) hlsRef.current.stopLoad();
        if (AUDIT_SHORTS_AUTOPLAY && !inView) {
          console.log(`[ShortsAudit][${id}] ⏸️ paused (out of view), removed from active players (${activePlayers.size}/${MAX_ACTIVE_PLAYERS})`);
        }
      }
    };

    if (canPlay) {
      requestPlay();
    } else {
      requestPause();
    }
  }, [ready, inView, shouldAutoplay, id]);

  // Handle page visibility - pause all when tab hidden
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      const el = ref.current;
      if (!el) return;
      
      if (document.hidden) {
        if (!el.paused) {
          el.pause();
          activePlayers.delete(el);
          if (hlsRef.current) hlsRef.current.stopLoad();
        }
      }
      // When visible again, let the visibility effect above handle resume
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return (
    <div
      className="group relative aspect-[9/16] overflow-hidden rounded bg-muted cursor-pointer"
      onClick={onClick}
      style={AUDIT_SHORTS_AUTOPLAY ? { 
        // 🔍 AUDIT: Highlight container background for diagnosis
        backgroundColor: posterUrl ? 'var(--muted)' : '#ff000020' 
      } : undefined}
    >
      {/* Poster underneath as a safety net */}
      {posterUrl && (
        <img
          src={posterUrl}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-150
                      ${ready ? 'opacity-0' : 'opacity-100'}`}
          draggable={false}
          loading="eager"
          onLoad={() => {
            timingsRef.current.posterLoaded = performance.now();
            if (AUDIT_SHORTS_AUTOPLAY) {
              const T_mount_to_posterLoad = timingsRef.current.posterLoaded - timingsRef.current.mounted;
              console.log(`[ShortsAudit][${id}] 🖼️ Poster loaded`, {
                T_mount_to_posterLoad: T_mount_to_posterLoad.toFixed(0) + 'ms'
              });
            }
          }}
          onError={() => {
            if (AUDIT_SHORTS_AUTOPLAY) {
              console.error(`[ShortsAudit][${id}] ❌ Poster failed to load:`, posterUrl);
            }
          }}
        />
      )}

      <video
        ref={ref}
        poster={posterUrl}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-150
                    ${ready ? 'opacity-100' : 'opacity-0'}`}
        playsInline
        muted
        loop
        controls={false}
      />

      {/* Hover overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-active:opacity-10 group-hover:opacity-10 bg-black" />
    </div>
  );
}
