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
    xs: 'h-4 w-4',
    sm: 'h-5 w-5', 
    md: 'h-6 w-6',
    lg: 'h-7 w-7'
  };

  const logoElement = (
    <img
      src="/lovable-uploads/2b0e2d79-6b26-4b6b-a27b-8dd5f8cc5aad.png"
      alt="Clubhouse Community Rating"
      className={`${sizeClasses[size]} ${className}`}
      style={{ 
        objectFit: 'contain',
        filter: 'brightness(1.5) contrast(1.2) drop-shadow(0 1px 2px rgba(0,0,0,0.3))'
      }}
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