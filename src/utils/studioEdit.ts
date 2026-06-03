/**
 * Studio Edit utilities — RETIRED SHIMS.
 *
 * Phase 3e: render-time crop/rotate/pixel edits are no longer applied.
 * Edits are baked into pixels at export time by studio-v2. These helpers
 * return neutral defaults so legacy call sites (~20 consumers) keep
 * compiling and laying out correctly without surgery.
 */

import { StudioEdits, CropSettings } from '@/types/studio';

/**
 * Always returns the neutral default wrapper class.
 * IMPORTANT: must NOT return '' — consumers rely on this for container sizing.
 */
export function getCropWrapperClass(_crop?: CropSettings): string {
  return 'relative w-full h-full overflow-hidden';
}

export function getRotateStyle(_rotate?: number): React.CSSProperties {
  return {};
}

export function getCropStyles(_crop?: CropSettings): React.CSSProperties {
  return {};
}

export function getPixelLayerStyle(_edits?: StudioEdits): React.CSSProperties {
  return {};
}

export function hasEditSettings(_edits?: StudioEdits): boolean {
  return false;
}

/**
 * Convert aspect ratio string to numeric value — retained as a pure utility
 * still used by the new editor for crop-ratio math.
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
