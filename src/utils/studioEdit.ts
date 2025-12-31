/**
 * Studio Edit utilities for crop and rotate
 * Applied to pixel layer only (text overlays remain unaffected)
 */

import { StudioEdits } from '@/types/studio';

/**
 * Get CSS class for crop wrapper
 */
export function getCropWrapperClass(crop?: StudioEdits['crop']): string {
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
 * Get combined pixel layer styles (rotation only now)
 */
export function getPixelLayerStyle(edits?: StudioEdits): React.CSSProperties {
  if (!edits) return {};
  
  return getRotateStyle(edits.rotate);
}

/**
 * Check if any edit settings require rendering
 */
export function hasEditSettings(edits?: StudioEdits): boolean {
  if (!edits) return false;
  
  return !!(
    (edits.crop?.ratio && edits.crop.ratio !== 'original') ||
    edits.rotate
  );
}
