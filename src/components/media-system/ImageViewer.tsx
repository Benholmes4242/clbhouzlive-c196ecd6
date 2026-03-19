/**
 * ImageViewer — portrait: full-bleed cover. Landscape: contain + blurred backdrop.
 * Threshold: ratio > 1.0 (anything wider than tall gets the cinematic treatment).
 */
import { useState, useEffect } from 'react';

interface ImageViewerProps {
  imageUrl: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  onFirstFrameReady?: () => void;
}

export function ImageViewer({ imageUrl, thumbnailUrl, width, height, onFirstFrameReady }: ImageViewerProps) {
  const firstFrameFiredRef = useState(() => ({ current: false }))[0];
  const [loaded, setLoaded] = useState(false);
  const aspectRatio = width && height ? width / height : 0;

  // > 1.0 = landscape → contain + blur backdrop
  // ≤ 1.0 or unknown → cover (portrait / square)
  const isLandscape = aspectRatio > 1.0;

  useEffect(() => {
    setLoaded(false);
    const img = new Image();
    img.onload = () => {
      setLoaded(true);
      if (!firstFrameFiredRef.current && onFirstFrameReady) {
        firstFrameFiredRef.current = true;
        onFirstFrameReady();
      }
    };
    img.src = imageUrl;
    if (img.complete) {
      setLoaded(true);
      if (!firstFrameFiredRef.current && onFirstFrameReady) {
        firstFrameFiredRef.current = true;
        onFirstFrameReady();
      }
    }
    return () => { img.onload = null; };
  }, [imageUrl]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black flex items-center justify-center">
      {/* ── Blurred backdrop — only for landscape media ── */}
      {isLandscape && (
        <img
          src={loaded ? imageUrl : (thumbnailUrl || imageUrl)}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{
            objectFit: 'cover',
            filter: 'blur(28px) brightness(0.45) saturate(1.4)',
            WebkitFilter: 'blur(28px) brightness(0.45) saturate(1.4)',
            transform: 'scale(1.12)',
          }}
        />
      )}

      {/* ── Thumbnail layer — shows while full image loads ── */}
      {thumbnailUrl && (
        <img
          src={thumbnailUrl}
          alt=""
          draggable={false}
          className="absolute inset-0 w-full h-full transition-opacity duration-200 pointer-events-none"
          style={{
            objectFit: isLandscape ? 'contain' : 'cover',
            opacity: loaded ? 0 : 1,
            position: 'relative',
            zIndex: 1,
          }}
        />
      )}

      {/* ── Full image layer ── */}
      <img
        src={imageUrl}
        alt=""
        draggable={false}
        className="absolute inset-0 w-full h-full transition-opacity duration-200"
        style={{
          objectFit: isLandscape ? 'contain' : 'cover',
          opacity: loaded ? 1 : 0,
          position: 'relative',
          zIndex: 1,
        }}
        onLoad={() => setLoaded(true)}
      />

      {/* ── Shimmer while loading ── */}
      {!loaded && !thumbnailUrl && (
        <div className="absolute inset-0 bg-white/[0.06] clb-shimmer-dark" style={{ zIndex: 1 }} />
      )}
    </div>
  );
}
