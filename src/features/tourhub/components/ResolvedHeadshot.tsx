import { useMemo, useState } from 'react';
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
