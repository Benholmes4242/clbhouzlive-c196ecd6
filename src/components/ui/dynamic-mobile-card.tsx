import React from 'react';
import { cn } from '@/lib/utils';

interface DynamicMobileCardProps {
  gridClass: string;
  aspectRatio?: 'landscape' | 'portrait' | 'square';
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const DynamicMobileCard: React.FC<DynamicMobileCardProps> = ({
  gridClass,
  aspectRatio = 'square',
  children,
  className,
  onClick
}) => {
  // Calculate container aspect ratio based on grid class
  const getContainerClass = () => {
    if (gridClass.includes('row-span-2')) {
      // Tall card (1x2) - double height
      return 'aspect-[1/2]';
    } else if (gridClass.includes('col-span-2')) {
      // Wide card (2x1) - double width
      return 'aspect-[2/1]';
    } else {
      // Square card (1x1)
      return 'aspect-square';
    }
  };

  const getMediaContainerClass = () => {
    // Always fill the card container completely
    return 'w-full h-full object-cover';
  };

  const getFallbackClass = () => {
    // For fallback positioning when aspect ratios don't match perfectly
    if (aspectRatio === 'landscape' && gridClass.includes('row-span-2')) {
      // Landscape media in tall container - center with blurred background
      return 'object-contain bg-black/20';
    } else if (aspectRatio === 'portrait' && gridClass.includes('col-span-2')) {
      // Portrait media in wide container - center with blurred background  
      return 'object-contain bg-black/20';
    }
    return 'object-cover';
  };

  return (
    <div
      className={cn(
        gridClass,
        getContainerClass(),
        'relative overflow-hidden rounded-lg bg-muted cursor-pointer group',
        'transition-transform duration-200 hover:scale-[1.02]',
        className
      )}
      onClick={onClick}
    >
      <div className={cn('relative w-full h-full', getFallbackClass())}>
        {children}
      </div>
      
      {/* Subtle overlay for better visual hierarchy */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
    </div>
  );
};