/**
 * ImageViewer — displays a single image in the carousel with
 * thumbnail → full-image crossfade.
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
  const aspectRatio = width && height ? width / height : 1;
  const fit = aspectRatio > 1.2 ? 'contain' : 'cover';

  // Preload full image
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
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
      {/* Thumbnail layer */}
      {thumbnailUrl && (
        <img
          src={thumbnailUrl}
          alt=""
          draggable={false}
          className="absolute inset-0 w-full h-full transition-opacity duration-200"
          style={{
            objectFit: fit as React.CSSProperties['objectFit'],
            opacity: loaded ? 0 : 1,
          }}
        />
      )}

      {/* Full image layer */}
      <img
        src={imageUrl}
        alt=""
        draggable={false}
        className="absolute inset-0 w-full h-full transition-opacity duration-200"
        style={{
          objectFit: fit as React.CSSProperties['objectFit'],
          opacity: loaded ? 1 : 0,
        }}
        onLoad={() => setLoaded(true)}
      />

      {/* Shimmer while loading */}
      {!loaded && !thumbnailUrl && (
        <div className="absolute inset-0 bg-white/[0.06] clb-shimmer-dark" />
      )}
    </div>
  );
}
