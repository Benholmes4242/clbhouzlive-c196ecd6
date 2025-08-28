import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { extractVideoId, generateEmbedUrl, isCloudflareStreamUrl } from '@/utils/cloudflareStreamTransform';

interface CloudflareIframePlayerProps {
  src: string;
  className?: string;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  poster?: string;
  onClick?: () => void;
  onLoad?: () => void;
  onError?: () => void;
  // Additional iframe-specific props
  allowFullscreen?: boolean;
  loading?: 'lazy' | 'eager';
  token?: string; // For signed URLs if needed later
}

export interface CloudflareIframePlayerRef {
  iframe: HTMLIFrameElement | null;
  play: () => void;
  pause: () => void;
  getCurrentTime: () => Promise<number>;
  setCurrentTime: (time: number) => void;
  getVolume: () => Promise<number>;
  setVolume: (volume: number) => void;
}

const CloudflareIframePlayer = forwardRef<CloudflareIframePlayerRef, CloudflareIframePlayerProps>(({
  src,
  className = '',
  autoplay = false,
  muted = true,
  loop = false,
  controls = true,
  poster,
  onClick,
  onLoad,
  onError,
  allowFullscreen = true,
  loading = 'lazy',
  token
}, ref) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Extract video ID and generate embed URL
  const videoId = extractVideoId(src);
  const embedUrl = videoId ? generateEmbedUrl(videoId, token) : null;

  // Build iframe src with parameters
  const buildIframeSrc = (baseUrl: string) => {
    const url = new URL(baseUrl);
    const params = new URLSearchParams();
    
    if (autoplay) params.set('autoplay', 'true');
    if (muted) params.set('muted', 'true');
    if (loop) params.set('loop', 'true');
    if (!controls) params.set('controls', 'false');
    if (poster) params.set('poster', poster);
    
    const paramString = params.toString();
    return paramString ? `${baseUrl}?${paramString}` : baseUrl;
  };

  const finalSrc = embedUrl ? buildIframeSrc(embedUrl) : null;

  // Expose iframe controls via ref
  useImperativeHandle(ref, () => ({
    iframe: iframeRef.current,
    play: () => {
      if (iframeRef.current) {
        iframeRef.current.contentWindow?.postMessage({ method: 'play' }, '*');
      }
    },
    pause: () => {
      if (iframeRef.current) {
        iframeRef.current.contentWindow?.postMessage({ method: 'pause' }, '*');
      }
    },
    getCurrentTime: async () => {
      return new Promise((resolve) => {
        if (iframeRef.current) {
          const handleMessage = (event: MessageEvent) => {
            if (event.data.method === 'getCurrentTime') {
              window.removeEventListener('message', handleMessage);
              resolve(event.data.value || 0);
            }
          };
          window.addEventListener('message', handleMessage);
          iframeRef.current.contentWindow?.postMessage({ method: 'getCurrentTime' }, '*');
        } else {
          resolve(0);
        }
      });
    },
    setCurrentTime: (time: number) => {
      if (iframeRef.current) {
        iframeRef.current.contentWindow?.postMessage({ method: 'setCurrentTime', value: time }, '*');
      }
    },
    getVolume: async () => {
      return new Promise((resolve) => {
        if (iframeRef.current) {
          const handleMessage = (event: MessageEvent) => {
            if (event.data.method === 'getVolume') {
              window.removeEventListener('message', handleMessage);
              resolve(event.data.value || 0);
            }
          };
          window.addEventListener('message', handleMessage);
          iframeRef.current.contentWindow?.postMessage({ method: 'getVolume' }, '*');
        } else {
          resolve(0);
        }
      });
    },
    setVolume: (volume: number) => {
      if (iframeRef.current) {
        iframeRef.current.contentWindow?.postMessage({ method: 'setVolume', value: volume }, '*');
      }
    }
  }), []);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      onLoad?.();
    };

    const handleError = () => {
      onError?.();
      console.error('CloudflareIframePlayer - Failed to load iframe:', finalSrc);
    };

    iframe.addEventListener('load', handleLoad);
    iframe.addEventListener('error', handleError);

    return () => {
      iframe.removeEventListener('load', handleLoad);
      iframe.removeEventListener('error', handleError);
    };
  }, [finalSrc, onLoad, onError]);

  // Handle non-Cloudflare URLs or invalid video IDs
  if (!isCloudflareStreamUrl(src) || !finalSrc) {
    console.warn('CloudflareIframePlayer - Not a valid Cloudflare Stream URL:', src);
    return (
      <div className={`${className} bg-muted flex items-center justify-center`}>
        <p className="text-muted-foreground text-sm">Invalid video source</p>
      </div>
    );
  }

  return (
    <iframe
      ref={iframeRef}
      src={finalSrc}
      className={`border-none w-full h-full ${className}`}
      loading={loading}
      allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
      allowFullScreen={allowFullscreen}
      onClick={onClick}
      style={{
        border: 'none',
        width: '100%',
        height: '100%'
      }}
      title="Cloudflare Stream Video Player"
    />
  );
});

CloudflareIframePlayer.displayName = 'CloudflareIframePlayer';

export default CloudflareIframePlayer;