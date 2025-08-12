import React from 'react';
import { getAchievementBadgeUrl } from '@/utils/achievementBadgeUpload';

interface MedalIconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  type?: '20-club' | '50-club' | '100-club' | '200-club' | '300-club' | 'eu-explorer' | 'uk-ireland-explorer' | 'usa-explorer' | 'world-explorer' | 'globe-trotter' | 'albatross' | 'birdie-blitz' | 'birdie-every-par' | 'eagle-collector';
}

const MedalIcon: React.FC<MedalIconProps> = ({ className, size = 'md', type = '20-club' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const trophyImages = {
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
    'albatross': 'https://pub-73469fa1cd444caea8cb50c8c84a8b84.r2.dev/logos/albatross-badge.png',
    'birdie-blitz': 'https://pub-73469fa1cd444caea8cb50c8c84a8b84.r2.dev/logos/birdie-blitz-badge.png',
    'birdie-every-par': 'https://pub-73469fa1cd444caea8cb50c8c84a8b84.r2.dev/logos/birdie-every-par-badge.png',
    'eagle-collector': '/lovable-uploads/4ec4bfcd-f19c-4e11-b6a9-b81c1eaab19d.png'
  };

  const altText = {
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
  };

  return (
    <img 
      src={trophyImages[type]}
      alt={altText[type]}
      className={`${sizeClasses[size]} object-cover ${className || ''}`}
      onError={(e) => console.log('Trophy image failed to load:', e)}
      onLoad={() => console.log('Trophy image loaded successfully')}
    />
  );
};

export default MedalIcon;