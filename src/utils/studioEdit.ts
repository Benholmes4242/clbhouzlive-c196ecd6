/**
 * Studio Edit utilities for crop and rotate
 * Applied to pixel layer only (text overlays remain unaffected)
 */

import { StudioEdits, CropSettings, CropArea } from '@/types/studio';

/**
 * Get CSS class for crop wrapper based on ratio
 */
export function getCropWrapperClass(crop?: CropSettings): string {
  if (!crop?.ratio || crop.ratio === 'original') {
    return 'relative w-full h-full overflow-hidden';
  }
  
  switch (crop.ratio) {
    case '1:1':
      return 'relative w-full aspect-square overflow-hidden';
    case '4:5':
      return 'relative w-full aspect-[4/5] overflow-hidden';
    case '16:9':
      return 'relative w-full aspect-video overflow-hidden';
    case '9:16':
      return 'relative w-full aspect-[9/16] overflow-hidden';
    default:
      return 'relative w-full h-full overflow-hidden';
  }
}

/**
 * Get inline style for rotation transform
 */
export function getRotateStyle(rotate?: number): React.CSSProperties {
  if (!rotate || rotate === 0) {
    return {};
  }
  
  return {
    transform: `rotate(${rotate}deg)`,
    transformOrigin: 'center',
  };
}

/**
 * Get CSS styles to apply crop region (for displaying cropped media)
 */
export function getCropStyles(crop?: CropSettings): React.CSSProperties {
  if (!crop?.area) {
    return {};
  }

  const { x, y, width, height } = crop.area;
  const zoom = crop.zoom || 1;

  // Calculate the transform to show only the cropped region
  // Using object-position and transform to achieve the crop effect
  return {
    objectFit: 'cover' as const,
    objectPosition: `${x + width / 2}% ${y + height / 2}%`,
    transform: `scale(${100 / width * zoom})`,
    transformOrigin: `${x + width / 2}% ${y + height / 2}%`,
  };
}

/**
 * Get combined pixel layer styles (rotation + crop area)
 */
export function getPixelLayerStyle(edits?: StudioEdits): React.CSSProperties {
  if (!edits) return {};
  
  const rotateStyles = getRotateStyle(edits.rotate);
  const cropStyles = getCropStyles(edits.crop);
  
  return {
    ...rotateStyles,
    ...cropStyles,
  };
}

/**
 * Check if any edit settings require rendering
 */
export function hasEditSettings(edits?: StudioEdits): boolean {
  if (!edits) return false;
  
  return !!(
    (edits.crop?.ratio && edits.crop.ratio !== 'original') ||
    edits.crop?.area ||
    edits.rotate
  );
}

/**
 * Convert aspect ratio string to numeric value
 */
export function aspectRatioToNumber(ratio: string): number | undefined {
  switch (ratio) {
    case '1:1': return 1;
    case '4:5': return 4 / 5;
    case '16:9': return 16 / 9;
    case '9:16': return 9 / 16;
    case 'original': return undefined;
    default: return undefined;
  }
}
