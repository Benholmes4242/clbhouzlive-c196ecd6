import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SoundToggleProps {
  isMuted: boolean;
  onToggle: () => void; // Changed to not require boolean parameter
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SoundToggle: React.FC<SoundToggleProps> = ({ 
  isMuted, 
  onToggle, 
  className = '',
  size = 'sm'
}) => {
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering video click
    onToggle(); // Call toggle function without parameters
  };

  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8', 
    lg: 'h-10 w-10'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      className={`
        ${sizeClasses[size]}
        bg-black/40 hover:bg-black/60 
        backdrop-blur-sm border border-white/20 
        text-white hover:text-white
        transition-all duration-200 ease-in-out
        transform hover:scale-110 active:scale-95
        shadow-lg
        ${className}
      `}
      aria-label={isMuted ? 'Unmute video' : 'Mute video'}
    >
      {isMuted ? (
        <VolumeX className={`${iconSizes[size]} transition-transform duration-150`} />
      ) : (
        <Volume2 className={`${iconSizes[size]} transition-transform duration-150`} />
      )}
    </Button>
  );
};

export default SoundToggle;