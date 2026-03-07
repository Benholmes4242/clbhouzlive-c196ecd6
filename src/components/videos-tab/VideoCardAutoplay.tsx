import { useEffect, useRef, useCallback } from 'react';

// Module-level single-player tracker — NOT React state/context
let activeAutoplayRef: { pause: () => void } | null = null;

interface VideoCardAutoplayProps {
  hlsUrl: string;
  posterUrl: string;
  isEligible: boolean;
  cardIndex: number;
}

export function VideoCardAutoplay({ hlsUrl, posterUrl, isEligible, cardIndex }: VideoCardAutoplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<any>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isPlayingRef = useRef(false);
  const posterOverlayRef = useRef<HTMLDivElement>(null);

  const destroyHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
    }
    isPlayingRef.current = false;
    // Restore poster
    if (posterOverlayRef.current) {
      posterOverlayRef.current.style.opacity = '1';
    }
  }, []);

  const pause = useCallback(() => {
    destroyHls();
    if (activeAutoplayRef?.pause === pause) {
      activeAutoplayRef = null;
    }
  }, [destroyHls]);

  const startPlayback = useCallback(async () => {
    if (isPlayingRef.current || !videoRef.current) return;

    // Pause any other playing card
    activeAutoplayRef?.pause();

    const video = videoRef.current;
    video.muted = true;

    try {
      const { default: Hls } = await import('hls.js');
      const { createCachedLoader } = await import('@/components/media-system/utils/cachedHlsLoader');

      // Check if component unmounted during import
      if (!videoRef.current) return;

      if (Hls.isSupported()) {
        const hls = new Hls({
          startLevel: 0,
          maxBufferLength: 8,
          maxMaxBufferLength: 15,
          enableWorker: true,
          loader: createCachedLoader(Hls),
        });
        hlsRef.current = hls;

        hls.loadSource(hlsUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          hls.currentLevel = 0;
          video.play().catch((e) => console.warn('[VideoCardAutoplay] play() rejected:', e.message));
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native HLS
        video.src = hlsUrl;
        perf('VIDEOS', '<<< PLAYING tileIndex:', cardIndex);
        video.play().catch((e) => console.warn('[VideoCardAutoplay] play() rejected:', e.message));
      }

      video.addEventListener('canplay', () => {
        if (posterOverlayRef.current) {
          posterOverlayRef.current.style.opacity = '0';
        }
      }, { once: true });

      isPlayingRef.current = true;
      activeAutoplayRef = { pause };
    } catch {
      // hls.js import failed — silent fail, poster stays
    }
  }, [hlsUrl, pause, cardIndex]);

  useEffect(() => {
    if (!isEligible || !containerRef.current) {
      destroyHls();
      return;
    }

    const el = containerRef.current;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        if (entry.intersectionRatio >= 0.5 && !isPlayingRef.current) {
          startPlayback();
        } else if (entry.intersectionRatio < 0.1 && isPlayingRef.current) {
          destroyHls();
        }
      },
      { threshold: [0, 0.1, 0.5] }
    );

    observerRef.current.observe(el);

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      destroyHls();
      if (activeAutoplayRef?.pause === pause) {
        activeAutoplayRef = null;
      }
    };
  }, [isEligible, startPlayback, destroyHls, pause]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      <video
        ref={videoRef}
        muted
        playsInline
        loop
        // @ts-expect-error webkit attribute
        webkitPlaysinline="true"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Poster overlay for crossfade */}
      <div
        ref={posterOverlayRef}
        className="absolute inset-0 transition-opacity duration-200"
        style={{ opacity: 1 }}
      >
        {posterUrl && (
          <img
            src={posterUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        )}
      </div>
    </div>
  );
}
