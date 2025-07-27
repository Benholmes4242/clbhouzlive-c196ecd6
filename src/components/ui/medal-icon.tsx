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
      src="/lovable-uploads/259a3045-a655-4b79-ae21-972c7962d5d6.png"
      alt="20 Club Medal"
      className={`${sizeClasses[size]} object-contain ${className || ''}`}
    />
  );
};

export default MedalIcon;