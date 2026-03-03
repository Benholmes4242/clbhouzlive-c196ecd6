/**
 * LoadingSkeleton — poster-first loading with shimmer overlay.
 *
 * Layer 1: Dark background fallback
 * Layer 2: Poster/thumbnail (CSS background-image for GPU compositing)
 * Layer 3: Shimmer overlay (only visible while poster is loading)
 */
import { useState, useEffect } from 'react';

interface LoadingSkeletonProps {
  visible: boolean;
  posterUrl?: string;
}

export function LoadingSkeleton({ visible, posterUrl }: LoadingSkeletonProps) {
  const [posterLoaded, setPosterLoaded] = useState(false);

  // Pre-load poster image in useEffect (not render body)
  useEffect(() => {
    if (!posterUrl) return;
    setPosterLoaded(false);

    const img = new Image();
    img.onload = () => setPosterLoaded(true);
    img.onerror = () => setPosterLoaded(false);
    img.src = posterUrl;
    // If already cached by browser, onload fires synchronously
    if (img.complete) setPosterLoaded(true);

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [posterUrl]);

  return (
    <div
      className="absolute inset-0 z-10 pointer-events-none transition-opacity duration-200"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {/* Layer 1: Dark background */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)' }}
      />

      {/* Layer 2: Poster thumbnail (GPU-composited via background-image) */}
      {posterUrl && (
        <div
          className="absolute inset-0 transition-opacity duration-150"
          style={{
            backgroundImage: `url(${posterUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: posterLoaded ? 1 : 0,
          }}
        />
      )}

      {/* Layer 3: Shimmer overlay (only shows while poster hasn't loaded) */}
      {!posterLoaded && (
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(255,255,255,0.0) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.0) 75%)',
            backgroundSize: '200% 100%',
            animation: 'media-shimmer 1.5s infinite ease-in-out',
          }}
        />
      )}

      <style>{`
        @keyframes media-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
