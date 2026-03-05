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
}

export function ImageViewer({ imageUrl, thumbnailUrl, width, height }: ImageViewerProps) {
  const [loaded, setLoaded] = useState(false);
  const aspectRatio = width && height ? width / height : 1;
  const fit = aspectRatio > 1.2 ? 'contain' : 'cover';

  // Preload full image
  useEffect(() => {
    setLoaded(false);
    const img = new Image();
    img.onload = () => setLoaded(true);
    img.src = imageUrl;
    if (img.complete) setLoaded(true);
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
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, rgba(255,255,255,0) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0) 75%)',
            backgroundSize: '200% 100%',
            animation: 'media-shimmer 1.5s infinite ease-in-out',
          }}
        />
      )}
    </div>
  );
}
