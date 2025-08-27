import React from 'react';
import { SpeakerXMarkIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';
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
    sm: 'h-6 w-6',
    md: 'h-6 w-6',
    lg: 'h-6 w-6'
  };

  return (
    <div
      className={`
        ${sizeClasses[size]}
        rounded-full bg-white/10 backdrop-blur-2xl 
        flex items-center justify-center cursor-pointer
        transition-all duration-200 ease-in-out
        transform hover:scale-110 active:scale-95
        shadow-lg
        ${className}
      `}
      style={{ backdropFilter: 'blur(40px) saturate(180%)' }}
      onClick={handleToggle}
      aria-label={isMuted ? 'Unmute video' : 'Mute video'}
    >
      {isMuted ? (
        <SpeakerXMarkIcon className={`${iconSizes[size]} text-white transition-transform duration-150`} />
      ) : (
        <SpeakerWaveIcon className={`${iconSizes[size]} text-white transition-transform duration-150`} />
      )}
    </div>
  );
};

export default SoundToggle;