// Media type definitions for different card layouts
export enum CardType {
  SQUARE = 'square',
  PORTRAIT = 'portrait', 
  HERO = 'hero'
}

export interface MediaItem {
  id: string;
  media_type: 'video' | 'image';
  media_url: string;
  thumbnail_url?: string;
  poster_url?: string;
}

export interface CardMediaProps {
  media: MediaItem;
  cardType: CardType;
  shouldAutoplay?: boolean;
  isLazyLoaded?: boolean;
  onMediaClick?: () => void;
  className?: string;
}