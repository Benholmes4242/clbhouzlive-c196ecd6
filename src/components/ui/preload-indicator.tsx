import React from 'react';
import { cn } from '@/lib/utils';

interface PreloadIndicatorProps {
  isPreloaded: boolean;
  className?: string;
  showText?: boolean;
}

export const PreloadIndicator: React.FC<PreloadIndicatorProps> = ({
  isPreloaded,
  className,
  showText = false,
}) => {
  if (!isPreloaded) {
    return null;
  }

  return (
    <div className={cn(
      'absolute top-2 right-2 z-10',
      'bg-green-500/80 text-white text-xs px-2 py-1 rounded-full',
      'flex items-center gap-1',
      'transition-opacity duration-300',
      className
    )}>
      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
      {showText && <span>Preloaded</span>}
    </div>
  );
};

export default PreloadIndicator;