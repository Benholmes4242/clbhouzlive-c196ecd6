import React from 'react';

interface MedalIconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const MedalIcon: React.FC<MedalIconProps> = ({ className, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <img 
      src="/lovable-uploads/4c28515e-8a6d-4ed0-bd27-b2904cd4ead9.png"
      alt="20 Club Trophy"
      className={`${sizeClasses[size]} object-contain ${className || ''}`}
      onError={(e) => console.log('Trophy image failed to load:', e)}
      onLoad={() => console.log('Trophy image loaded successfully')}
    />
  );
};

export default MedalIcon;