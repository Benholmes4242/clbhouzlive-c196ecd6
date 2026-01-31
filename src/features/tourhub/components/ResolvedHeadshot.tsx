import { useEffect, useMemo, useState } from 'react';
import type { SyntheticEvent } from 'react';
import { cn } from '@/lib/utils';
import { resolvePhotoUrl } from '../utils/resolvePhotoUrl';

interface ResolvedHeadshotProps {
  photoUrl?: string | null;
  alt: string;
  fallback: string;
  className?: string;
  imgClassName?: string;
  fallbackClassName?: string;
  loading?: 'lazy' | 'eager';
}

/**
 * ResolvedHeadshot
 * - Routes SportRadar URLs through our image-proxy via resolvePhotoUrl()
 * - Swallows image errors and renders a deterministic fallback (initials)
 */
export function ResolvedHeadshot({
  photoUrl,
  alt,
  fallback,
  className,
  imgClassName,
  fallbackClassName,
  loading = 'lazy',
}: ResolvedHeadshotProps) {
  const [imageError, setImageError] = useState(false);

  const resolvedUrl = useMemo(() => resolvePhotoUrl(photoUrl), [photoUrl]);
  const showImage = !!resolvedUrl && !imageError;

  useEffect(() => {
    // Reset if the URL changes (e.g. new data loads)
    setImageError(false);
  }, [resolvedUrl]);

  const handleLoad = (e: SyntheticEvent<HTMLImageElement>) => {
    // Our legacy proxy sometimes returns a transparent 1x1 GIF on failure.
    // That does NOT trigger onError, so detect it and fall back to initials.
    const img = e.currentTarget;
    if ((img.naturalWidth || 0) <= 2 && (img.naturalHeight || 0) <= 2) {
      setImageError(true);
    }
  };

  return (
    <div
      className={cn(
        'bg-muted flex items-center justify-center overflow-hidden',
        className
      )}
    >
      {showImage ? (
        <img
          src={resolvedUrl}
          alt={alt}
          loading={loading}
          className={cn('w-full h-full object-cover', imgClassName)}
          onError={() => setImageError(true)}
          onLoad={handleLoad}
        />
      ) : (
        <span
          className={cn(
            'font-bold text-muted-foreground select-none',
            fallbackClassName
          )}
        >
          {fallback}
        </span>
      )}
    </div>
  );
}
