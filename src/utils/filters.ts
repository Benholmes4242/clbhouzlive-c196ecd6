import { FilterId } from '@/types/studio';

export const FILTERS: Record<FilterId, string> = {
  normal:    'none',
  vivid:     'contrast(1.1) saturate(1.15)',
  bw:        'grayscale(1) contrast(1.05)',
  dramatic:  'contrast(1.25) saturate(1.05) brightness(0.95)',
};

export function cssForFilter(filterId?: FilterId): string {
  if (!filterId) return FILTERS.normal;
  return FILTERS[filterId] || FILTERS.normal;
}

export function cropClassFrom(crop?: { ratio: 'original' | '1:1' | '4:5' | '16:9' }): string {
  switch (crop?.ratio) {
    case '1:1':  return 'relative w-full aspect-square overflow-hidden rounded-xl';
    case '4:5':  return 'relative w-full aspect-[4/5] overflow-hidden rounded-xl';
    case '16:9': return 'relative w-full aspect-video overflow-hidden rounded-xl';
    default:     return 'relative w-full overflow-hidden rounded-xl'; // original
  }
}

export function fontFrom(style: 'modern' | 'classic' | 'signature'): string {
  switch (style) {
    case 'modern':    return 'ui-sans-serif, system-ui, sans-serif';
    case 'classic':   return 'Georgia, "Times New Roman", serif';
    case 'signature': return 'cursive';
    default:          return 'ui-sans-serif, system-ui, sans-serif';
  }
}
