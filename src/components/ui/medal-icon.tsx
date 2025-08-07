import React from 'react';

interface MedalIconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  type?: '20-club' | '50-club' | '100-club' | '200-club' | '300-club' | 'eu-explorer' | 'uk-ireland-explorer' | 'usa-explorer' | 'world-explorer';
}

const MedalIcon: React.FC<MedalIconProps> = ({ className, size = 'md', type = '20-club' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const trophyImages = {
    '20-club': '/lovable-uploads/a33df9b4-0089-43ca-913d-132fc5b11cc3.png',
    '50-club': '/lovable-uploads/c1ba04e8-7aed-40e6-948b-0b65fdc932b2.png',
    '100-club': '/lovable-uploads/91e26115-098d-4b21-9b29-7e1800fe52bd.png',
    '200-club': '/lovable-uploads/3f4eaa9f-25be-41e0-acca-0f97bc858390.png',
    '300-club': '/lovable-uploads/227db9bc-e1f0-487e-8568-fd06f20b15ee.png',
    'eu-explorer': '/lovable-uploads/24422ab1-3322-4f51-801b-8ae8e80c95d7.png',
    'uk-ireland-explorer': '/lovable-uploads/54fecf12-83df-48be-b433-d227be70278d.png',
    'usa-explorer': '/lovable-uploads/ad7f9c0b-b395-4b96-b059-63ebab11bd4f.png',
    'world-explorer': '/lovable-uploads/5b02f0bf-9891-4439-971c-4d3cb7a37355.png'
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
    'world-explorer': 'World Explorer Badge'
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