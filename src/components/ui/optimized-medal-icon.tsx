import React, { memo, useState, useEffect } from 'react';

interface OptimizedMedalIconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  type?: '20-club' | '50-club' | '100-club' | '200-club' | '300-club' | 'eu-explorer' | 'uk-ireland-explorer' | 'usa-explorer' | 'world-explorer' | 'globe-trotter' | 'albatross' | 'birdie-blitz' | 'birdie-every-par' | 'eagle-collector';
  priority?: boolean;
}

// Pre-cached image URLs for instant loading
const OPTIMIZED_BADGE_URLS = {
  '20-club': 'https://pub-73469fa1cd444caea8cb50c8c84a8b84.r2.dev/logos/20-club-badge.png',
  '50-club': 'https://pub-73469fa1cd444caea8cb50c8c84a8b84.r2.dev/logos/50-club-badge.png',
  '100-club': 'https://pub-73469fa1cd444caea8cb50c8c84a8b84.r2.dev/logos/100-club-badge.png',
  '200-club': 'https://pub-73469fa1cd444caea8cb50c8c84a8b84.r2.dev/logos/200-club-badge.png',
  '300-club': 'https://pub-73469fa1cd444caea8cb50c8c84a8b84.r2.dev/logos/300-club-badge.png',
  'eu-explorer': 'https://pub-73469fa1cd444caea8cb50c8c84a8b84.r2.dev/logos/eu-explorer-badge.png',
  'uk-ireland-explorer': 'https://pub-73469fa1cd444caea8cb50c8c84a8b84.r2.dev/logos/uk-ireland-explorer-badge.png',
  'usa-explorer': 'https://pub-73469fa1cd444caea8cb50c8c84a8b84.r2.dev/logos/usa-explorer-badge.png',
  'world-explorer': 'https://pub-73469fa1cd444caea8cb50c8c84a8b84.r2.dev/logos/world-explorer-badge.png',
  'globe-trotter': 'https://pub-73469fa1cd444caea8cb50c8c84a8b84.r2.dev/logos/globe-trotter-badge.png',
  'albatross': '/lovable-uploads/2fc5fb62-90a5-4424-b85f-9e6b08a774d8.png',
  'birdie-blitz': 'https://pub-73469fa1cd444caea8cb50c8c84a8b84.r2.dev/logos/birdie-blitz-badge.png',
  'birdie-every-par': 'https://pub-73469fa1cd444caea8cb50c8c84a8b84.r2.dev/logos/birdie-every-par-badge.png',
  'eagle-collector': '/lovable-uploads/4ec4bfcd-f19c-4e11-b6a9-b81c1eaab19d.png'
} as const;

const ALT_TEXT = {
  '20-club': 'The 20 Club Trophy',
  '50-club': 'The 50 Club Trophy',
  '100-club': 'The Century Club Trophy',
  '200-club': 'Clubhouse Elite Trophy',
  '300-club': 'Club Collector Badge',
  'eu-explorer': 'European Explorer Badge',
  'uk-ireland-explorer': 'UK & Ireland Explorer Badge',
  'usa-explorer': 'USA Explorer Badge',
  'world-explorer': 'World Explorer Badge',
  'globe-trotter': 'Globe Trotter Golfer Badge',
  'albatross': 'Albatross Ace Badge',
  'birdie-blitz': 'Birdie Blitz Badge',
  'birdie-every-par': 'Birdie Every Par Badge',
  'eagle-collector': 'Eagle Collector Badge'
} as const;

const SIZE_CLASSES = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6', 
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
} as const;

const OptimizedMedalIconComponent: React.FC<OptimizedMedalIconProps> = ({ 
  className = '', 
  size = 'md', 
  type = '20-club',
  priority = false 
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const imageUrl = OPTIMIZED_BADGE_URLS[type];
  const altText = ALT_TEXT[type];
  const sizeClass = SIZE_CLASSES[size];

  // Preload image for better performance
  useEffect(() => {
    if (!imageUrl) return;

    const img = new Image();
    if (priority) {
      img.fetchPriority = 'high';
    }
    
    img.onload = () => setImageLoaded(true);
    img.onerror = () => setImageError(true);
    img.src = imageUrl;
  }, [imageUrl, priority]);

  if (imageError) {
    return (
      <div 
        className={`${sizeClass} bg-muted rounded-full flex items-center justify-center ${className}`}
        title={altText}
      >
        <span className="text-xs">🏆</span>
      </div>
    );
  }

  return (
    <img 
      src={imageUrl}
      alt={altText}
      className={`${sizeClass} object-cover transition-opacity duration-200 ${
        imageLoaded ? 'opacity-100' : 'opacity-0'
      } ${className}`}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      onLoad={() => setImageLoaded(true)}
      onError={() => setImageError(true)}
    />
  );
};

export const OptimizedMedalIcon = memo(OptimizedMedalIconComponent);