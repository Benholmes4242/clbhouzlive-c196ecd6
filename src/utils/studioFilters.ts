import { FilterId } from '@/types/studio';

/**
 * Maps a Studio filter ID to its CSS filter class name
 */
export function getFilterClass(filter?: FilterId | string): string {
  switch (filter) {
    case 'vivid':
      return 'clb-filter-vivid';
    case 'bw':
      return 'clb-filter-bw';
    case 'dramatic':
      return 'clb-filter-dramatic';
    case 'normal':
    default:
      return 'clb-filter-normal';
  }
}

/**
 * Gets the CSS filter string directly (for inline styles if needed)
 */
export function getFilterStyle(filter?: FilterId | string): string {
  switch (filter) {
    case 'vivid':
      return 'contrast(1.1) saturate(1.15)';
    case 'bw':
      return 'grayscale(1) contrast(1.05)';
    case 'dramatic':
      return 'contrast(1.25) saturate(1.05) brightness(0.95)';
    case 'normal':
    default:
      return 'none';
  }
}
