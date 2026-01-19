/**
 * MediaGallery
 * Unified gallery component for displaying images with optional lightbox
 * 
 * Features:
 * - Grid or masonry layout
 * - Configurable columns and gap
 * - Built-in lightbox support
 * - Skeleton loading states
 * - Hover effects
 */

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { UnifiedImage } from './UnifiedImage';
import { Lightbox, LightboxImage } from './Lightbox';
import type { AspectRatio } from '../types';

// ============================================
// TYPES
// ============================================

export interface GalleryImage {
  id: string;
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  caption?: string;
}

export interface ResponsiveColumns {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
}

export interface MediaGalleryProps {
  /** Array of images to display */
  images: GalleryImage[];
  /** Number of columns (fixed or responsive) */
  columns?: number | ResponsiveColumns;
  /** Gap between items in pixels (default: 8) */
  gap?: number;
  /** Layout mode (default: 'grid') */
  layout?: 'grid' | 'masonry';
  /** Aspect ratio for grid mode (default: '1:1') */
  aspectRatio?: AspectRatio;
  /** Click handler for images */
  onImageClick?: (image: GalleryImage, index: number) => void;
  /** Enable built-in lightbox (default: true) */
  enableLightbox?: boolean;
  /** Show loading skeleton */
  loading?: boolean;
  /** Number of skeleton items (default: 9) */
  skeletonCount?: number;
  /** Custom empty state */
  emptyState?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Enable hover scale effect (default: true) */
  hoverEffect?: boolean;
}

// ============================================
// COLUMN CLASSES
// ============================================

const COLUMN_CLASSES: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
};

const MASONRY_COLUMN_CLASSES: Record<number, string> = {
  1: 'columns-1',
  2: 'columns-2',
  3: 'columns-3',
  4: 'columns-4',
  5: 'columns-5',
  6: 'columns-6',
};

// ============================================
// SKELETON COMPONENT
// ============================================

const ImageSkeleton: React.FC<{ aspectRatio?: AspectRatio }> = ({ 
  aspectRatio = '1:1' 
}) => {
  const ratioMap: Record<string, string> = {
    '3:4': '3/4',
    '4:3': '4/3',
    '16:9': '16/9',
    '9:16': '9/16',
    '1:1': '1/1',
    '21:9': '21/9',
  };

  return (
    <div
      className="relative w-full overflow-hidden rounded-lg bg-muted"
      style={{ aspectRatio: ratioMap[aspectRatio] || aspectRatio }}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
};

// ============================================
// COMPONENT
// ============================================

export const MediaGallery: React.FC<MediaGalleryProps> = ({
  images,
  columns = 3,
  gap = 8,
  layout = 'grid',
  aspectRatio = '1:1',
  onImageClick,
  enableLightbox = true,
  loading = false,
  skeletonCount = 9,
  emptyState,
  className,
  hoverEffect = true,
}) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Handle image click
  const handleImageClick = useCallback((image: GalleryImage, index: number) => {
    if (enableLightbox) {
      setLightboxIndex(index);
    }
    onImageClick?.(image, index);
  }, [enableLightbox, onImageClick]);

  // Close lightbox
  const handleCloseLightbox = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  // Generate grid columns class
  const getColumnsClass = useCallback(() => {
    const classMap = layout === 'masonry' ? MASONRY_COLUMN_CLASSES : COLUMN_CLASSES;
    
    if (typeof columns === 'number') {
      return classMap[columns] || classMap[3];
    }
    
    const { xs = 2, sm = 3, md = 3, lg = 4, xl = 4 } = columns;
    
    if (layout === 'masonry') {
      return `columns-${xs} sm:columns-${sm} md:columns-${md} lg:columns-${lg} xl:columns-${xl}`;
    }
    
    const xsClass = COLUMN_CLASSES[xs] || 'grid-cols-2';
    const smClass = COLUMN_CLASSES[sm] || 'grid-cols-3';
    const mdClass = COLUMN_CLASSES[md] || 'grid-cols-3';
    const lgClass = COLUMN_CLASSES[lg] || 'grid-cols-4';
    const xlClass = COLUMN_CLASSES[xl] || 'grid-cols-4';
    return `${xsClass} sm:${smClass} md:${mdClass} lg:${lgClass} xl:${xlClass}`;
  }, [columns, layout]);

  // Convert to lightbox images
  const lightboxImages: LightboxImage[] = images.map(img => ({
    id: img.id,
    src: img.src,
    alt: img.alt,
    width: img.width,
    height: img.height,
    caption: img.caption,
  }));

  // Loading skeleton state
  if (loading && images.length === 0) {
    return (
      <div
        className={cn(
          layout === 'grid' ? 'grid' : '',
          getColumnsClass(),
          className
        )}
        style={{ gap: `${gap}px` }}
      >
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div key={`skeleton-${i}`} className={layout === 'masonry' ? 'mb-2 break-inside-avoid' : ''}>
            <ImageSkeleton aspectRatio={aspectRatio} />
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (!loading && images.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        {emptyState || 'No images to display'}
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          layout === 'grid' ? 'grid' : '',
          getColumnsClass(),
          className
        )}
        style={{ gap: `${gap}px` }}
      >
        {images.map((image, index) => (
          <div
            key={image.id}
            className={cn(
              'relative overflow-hidden rounded-lg bg-muted cursor-pointer',
              layout === 'masonry' && 'mb-2 break-inside-avoid',
              hoverEffect && 'transition-transform duration-200 hover:scale-[1.02]'
            )}
            onClick={() => handleImageClick(image, index)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleImageClick(image, index)}
          >
            <UnifiedImage
              src={image.src}
              alt={image.alt || 'Gallery image'}
              aspectRatio={layout === 'grid' ? aspectRatio : 'auto'}
              objectFit="cover"
              className="w-full h-full"
            />
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {enableLightbox && lightboxIndex !== null && (
        <Lightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          onClose={handleCloseLightbox}
          onIndexChange={setLightboxIndex}
        />
      )}
    </>
  );
};

export default MediaGallery;
