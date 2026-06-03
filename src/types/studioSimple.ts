export type SimpleFilterId = 'normal' | 'vivid' | 'bw' | 'warm' | 'cool' | 'fade';
export type SimpleTextStyle = 'bold' | 'serif' | 'outline';

export interface SimpleTextOverlay {
  id: string;
  text: string;
  x: number;       // 0..1 relative position (centre)
  y: number;       // 0..1
  scale: number;   // 0.6..3
  style: SimpleTextStyle;
}

export type SimpleCropRatio = 'original' | '1:1' | '4:5';

export interface SimpleEdits {
  filter?: SimpleFilterId;
  crop?: { ratio: SimpleCropRatio; zoom?: number; offsetX?: number; offsetY?: number };
  rotate?: 0 | 90 | 180 | 270;
  flipH?: boolean;
  flipV?: boolean;
  text?: SimpleTextOverlay[];
}

export const SIMPLE_FILTERS: { id: SimpleFilterId; label: string; css: string }[] = [
  { id: 'normal', label: 'Normal', css: 'none' },
  { id: 'vivid',  label: 'Vivid',  css: 'contrast(1.12) saturate(1.18)' },
  { id: 'bw',     label: 'B&W',    css: 'grayscale(1) contrast(1.05)' },
  { id: 'warm',   label: 'Warm',   css: 'sepia(0.15) saturate(1.1) brightness(1.05)' },
  { id: 'cool',   label: 'Cool',   css: 'hue-rotate(-10deg) saturate(0.95) brightness(1.02)' },
  { id: 'fade',   label: 'Fade',   css: 'contrast(0.9) brightness(1.08) saturate(0.9)' },
];

export function ratioToNumber(ratio: SimpleCropRatio, fallback: number): number {
  if (ratio === '1:1') return 1;
  if (ratio === '4:5') return 4 / 5;
  return fallback;
}
