// Media type definitions for different card layouts
import { MediaItem } from '@/types/media';

export enum CardType {
  SQUARE = 'square',
  PORTRAIT = 'portrait', 
  HERO = 'hero'
}

// Extended interface for card-specific props
export interface CardMediaItem extends MediaItem {
  media_type: 'video' | 'image'; // Database field
  media_url: string;             // Database field
  thumbnail_url?: string;
  poster_url?: string;
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