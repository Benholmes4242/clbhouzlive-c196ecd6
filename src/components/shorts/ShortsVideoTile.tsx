import React from 'react';

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
  const [ready, setReady] = React.useState(false);
  const timingsRef = React.useRef({
    mounted: 0,
    raf1: 0,
    raf2: 0,
    posterComputed: 0,
    posterLoaded: 0,
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

  // Preload aggressively to avoid black frames
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // 🔍 AUDIT: Log poster computation
    if (AUDIT_SHORTS_AUTOPLAY) {
      timingsRef.current.posterComputed = performance.now();
      console.log(`[ShortsAudit][${id}] Poster URL:`, posterUrl, 'Has poster:', !!posterUrl);
    }

    // Ensure attributes (critical for mobile autoplay)
    el.muted = true;
    el.loop = true;
    el.playsInline = true;
    el.preload = 'auto';

    const onCanPlay = () => {
      timingsRef.current.canplay = performance.now();
      setReady(true);
      if (AUDIT_SHORTS_AUTOPLAY) {
        console.log(`[ShortsAudit][${id}] canplay event fired`, {
          readyState: el.readyState,
          T_mount_to_canplay: (timingsRef.current.canplay - timingsRef.current.mounted).toFixed(0) + 'ms'
        });
      }
    };

    const onLoadedMetadata = () => {
      if (AUDIT_SHORTS_AUTOPLAY) {
        console.log(`[ShortsAudit][${id}] loadedmetadata`, { 
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
          T_playRequest_to_playing: T_playRequest_to_playing.toFixed(0) + 'ms'
        });
      }
    };

    el.addEventListener('canplay', onCanPlay);
    el.addEventListener('loadedmetadata', onLoadedMetadata);
    el.addEventListener('playing', onPlaying);

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
    };
  }, [id, posterUrl]);

  // Visibility + alternating policy → play/pause
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const canPlay = ready && inView && shouldAutoplay;
    
    if (AUDIT_SHORTS_AUTOPLAY && inView && !timingsRef.current.ioIntersect) {
      timingsRef.current.ioIntersect = performance.now();
      const T_mount_to_IO = timingsRef.current.ioIntersect - timingsRef.current.mounted;
      console.log(`[ShortsAudit][${id}] 👁️ IO intersect`, {
        inView,
        shouldAutoplay,
        ready,
        canPlay,
        T_mount_to_IO: T_mount_to_IO.toFixed(0) + 'ms'
      });
    }

    if (canPlay) {
      timingsRef.current.playRequested = performance.now();
      const T_IO_to_playRequest = timingsRef.current.ioIntersect > 0 
        ? timingsRef.current.playRequested - timingsRef.current.ioIntersect 
        : 0;
      
      if (AUDIT_SHORTS_AUTOPLAY) {
        console.log(`[ShortsAudit][${id}] ▶️ play() requested`, {
          muted: el.muted,
          playsInline: el.playsInline,
          preload: el.preload,
          T_IO_to_playRequest: T_IO_to_playRequest.toFixed(0) + 'ms'
        });
      }

      const p = el.play();
      if (p && p.catch) {
        p.catch((err) => {
          if (AUDIT_SHORTS_AUTOPLAY) {
            console.error(`[ShortsAudit][${id}] ❌ play() rejected:`, err);
          }
        });
      }
    } else {
      el.pause();
      if (AUDIT_SHORTS_AUTOPLAY && !inView) {
        console.log(`[ShortsAudit][${id}] ⏸️ paused (out of view)`);
      }
    }
  }, [ready, inView, shouldAutoplay, id]);

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
        src={hlsUrl}
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
