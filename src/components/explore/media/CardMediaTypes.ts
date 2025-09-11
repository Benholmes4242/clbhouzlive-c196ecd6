// Media type definitions for different card layouts
import type { MediaItem, DbMediaRow } from '@/types/media';

export enum CardType {
  SQUARE = 'square',
  PORTRAIT = 'portrait', 
  HERO = 'hero'
}

// Extended interface for card-specific props - use DbMediaRow for database operations
export interface CardMediaItem extends DbMediaRow {
  thumbnail_url?: string;
}

export interface CardMediaProps {
  media: CardMediaItem;
  cardType: CardType;
  shouldAutoplay?: boolean;
  isLazyLoaded?: boolean;
  onMediaClick?: () => void;
  className?: string;
  showFeaturedBadge?: boolean;
}