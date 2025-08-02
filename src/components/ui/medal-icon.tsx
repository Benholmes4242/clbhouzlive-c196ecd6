import React from 'react';

interface MedalIconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  type?: '20-club' | '50-club' | '100-club' | '200-club' | '300-club';
}

const MedalIcon: React.FC<MedalIconProps> = ({ className, size = 'md', type = '20-club' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const trophyImages = {
    '20-club': '/lovable-uploads/90b69592-f3ff-45b6-aa32-e911c380b987.png',
    '50-club': '/lovable-uploads/5827d976-0ddd-4ef4-804b-d0d932976e41.png',
    '100-club': '/lovable-uploads/0886f993-c10a-4f15-a7ac-670118ab16a8.png',
    '200-club': '/lovable-uploads/5827d976-0ddd-4ef4-804b-d0d932976e41.png', // Using silver for now
    '300-club': '/lovable-uploads/cb976de7-6f4b-4ffc-b77c-8479b376ebec.png'
  };

  const altText = {
    '20-club': 'Green Fee Rookie Trophy',
    '50-club': 'The Turn Trophy',
    '100-club': 'Century Club Trophy',
    '200-club': 'Links Legend Trophy',
    '300-club': 'Course Collector Badge'
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