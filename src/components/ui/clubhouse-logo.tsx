import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ClubhouseLogoProps {
  className?: string;
  showTooltip?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const ClubhouseLogo: React.FC<ClubhouseLogoProps> = ({ 
  className = '', 
  showTooltip = false,
  size = 'md'
}) => {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4', 
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const logoElement = (
    <img
      src="/lovable-uploads/2b0e2d79-6b26-4b6b-a27b-8dd5f8cc5aad.png"
      alt="Clubhouse Community Rating"
      className={`${sizeClasses[size]} ${className}`}
      style={{ objectFit: 'contain' }}
    />
  );

  if (showTooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {logoElement}
        </TooltipTrigger>
        <TooltipContent>
          <p>This is the Clubhouse Community Rating</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return logoElement;
};

export default ClubhouseLogo;