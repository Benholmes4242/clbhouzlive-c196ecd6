/**
 * Client-Side Image Compression Service
 * 
 * Compresses images before upload to reduce:
 * - Upload time
 * - Storage costs
 * - Bandwidth usage
 * 
 * Preserves EXIF data for orientation and camera info.
 */

import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  quality?: number;
  preserveExif?: boolean;
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  width: number;
  height: number;
  wasCompressed: boolean;
}

/**
 * Compression presets for different use cases
 */
export const COMPRESSION_PRESETS = {
  // For feed posts - balanced quality and size
  feed: {
    maxSizeMB: 2,
    maxWidthOrHeight: 2048,
    quality: 0.85,
  },
  
  // For profile pictures - smaller size
  avatar: {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 512,
    quality: 0.8,
  },
  
  // For thumbnails - very small
  thumbnail: {
    maxSizeMB: 0.1,
    maxWidthOrHeight: 300,
    quality: 0.7,
  },
  
  // High quality - minimal compression
  highQuality: {
    maxSizeMB: 5,
    maxWidthOrHeight: 4096,
    quality: 0.92,
  },
} as const;

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxSizeMB: 2,
  maxWidthOrHeight: 2048,
  quality: 0.85,
  preserveExif: true,
};

// Skip compression for small images (< 500KB)
const COMPRESSION_THRESHOLD_BYTES = 500 * 1024;

/**
 * Compress a single image file
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const originalSize = file.size;
  
  // Get original dimensions first
  const originalDimensions = await getImageDimensions(file);
  
  // Skip compression for small images or if already small enough
  if (originalSize < COMPRESSION_THRESHOLD_BYTES) {
    console.log(`[ImageCompression] Skipping ${file.name}: already small (${formatBytes(originalSize)})`);
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
      width: originalDimensions.width,
      height: originalDimensions.height,
      wasCompressed: false,
    };
  }
  
  console.log(`[ImageCompression] Compressing ${file.name}: ${formatBytes(originalSize)}`);
  
  try {
    const compressedFile = await imageCompression(file, {
      maxSizeMB: mergedOptions.maxSizeMB,
      maxWidthOrHeight: mergedOptions.maxWidthOrHeight,
      useWebWorker: true,
      preserveExif: mergedOptions.preserveExif,
      initialQuality: mergedOptions.quality,
      fileType: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
    });
    
    const compressedSize = compressedFile.size;
    const compressionRatio = originalSize / compressedSize;
    const dimensions = await getImageDimensions(compressedFile);
    
    const reductionPercent = Math.round((1 - compressedSize / originalSize) * 100);
    console.log(
      `[ImageCompression] Compressed ${file.name}: ` +
      `${formatBytes(originalSize)} → ${formatBytes(compressedSize)} ` +
      `(${reductionPercent}% reduction)`
    );
    
    return {
      file: compressedFile,
      originalSize,
      compressedSize,
      compressionRatio,
      width: dimensions.width,
      height: dimensions.height,
      wasCompressed: true,
    };
  } catch (error) {
    console.error('[ImageCompression] Failed, using original:', error);
    
    // Fall back to original file
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
      width: originalDimensions.width,
      height: originalDimensions.height,
      wasCompressed: false,
    };
  }
}

/**
 * Compress multiple images with progress callback
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {},
  onProgress?: (completed: number, total: number, currentFile: string) => void
): Promise<CompressionResult[]> {
  const results: CompressionResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    onProgress?.(i, files.length, files[i].name);
    const result = await compressImage(files[i], options);
    results.push(result);
    onProgress?.(i + 1, files.length, files[i].name);
  }
  
  // Log summary
  const totalOriginal = results.reduce((sum, r) => sum + r.originalSize, 0);
  const totalCompressed = results.reduce((sum, r) => sum + r.compressedSize, 0);
  const totalSaved = totalOriginal - totalCompressed;
  
  if (totalSaved > 0) {
    console.log(
      `[ImageCompression] Total: ${formatBytes(totalOriginal)} → ${formatBytes(totalCompressed)} ` +
      `(saved ${formatBytes(totalSaved)})`
    );
  }
  
  return results;
}

/**
 * Get image dimensions from a File object
 */
async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };
    
    img.src = objectUrl;
  });
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Check if a file is an image that can be compressed
 */
export function isCompressibleImage(file: File): boolean {
  return ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
}
