import { FilterId } from '@/types/studio';

/**
 * Maps a Studio filter ID to its CSS filter class name
 */
export function getFilterClass(filter?: FilterId | string | null): string {
  if (!filter) return 'clb-filter-normal';
  
  switch (filter) {
    case 'vivid':
      return 'clb-filter-vivid';
    case 'bw':
      return 'clb-filter-bw';
    case 'dramatic':
      return 'clb-filter-dramatic';
    case 'warm':
      return 'clb-filter-warm';
    case 'cool':
      return 'clb-filter-cool';
    case 'vintage':
      return 'clb-filter-vintage';
    case 'matte':
      return 'clb-filter-matte';
    case 'pop':
      return 'clb-filter-pop';
    case 'fade':
      return 'clb-filter-fade';
    case 'normal':
    default:
      return 'clb-filter-normal';
  }
}

/**
 * Gets the CSS filter string directly (for inline styles if needed)
 */
export function getFilterStyle(filter?: FilterId | string | null): string {
  if (!filter) return 'none';
  
  switch (filter) {
    case 'vivid':
      return 'contrast(1.12) saturate(1.18)';
    case 'bw':
      return 'grayscale(1) contrast(1.05)';
    case 'dramatic':
      return 'contrast(1.25) saturate(1.05) brightness(0.95)';
    case 'warm':
      return 'sepia(0.15) saturate(1.1) brightness(1.05)';
    case 'cool':
      return 'hue-rotate(-10deg) saturate(0.95) brightness(1.02)';
    case 'vintage':
      return 'sepia(0.25) contrast(0.95) saturate(0.85)';
    case 'matte':
      return 'contrast(0.92) saturate(0.9) brightness(1.04)';
    case 'pop':
      return 'contrast(1.2) saturate(1.25)';
    case 'fade':
      return 'contrast(0.9) brightness(1.08) saturate(0.9)';
    case 'normal':
    default:
      return 'none';
  }
}
