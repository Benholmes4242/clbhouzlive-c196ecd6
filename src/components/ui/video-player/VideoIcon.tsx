import React from 'react';
import { Play, Maximize2 } from 'lucide-react';

interface VideoIconProps {
  show: boolean;
  iconType?: 'play' | 'maximize';
}

export const VideoIcon: React.FC<VideoIconProps> = ({ show, iconType = 'play' }) => {
  if (!show) return null;

  const Icon = iconType === 'maximize' ? Maximize2 : Play;

  return (
    <div className="absolute bottom-2 right-3 flex items-center justify-center w-8 h-8 text-white hover:bg-white/10 rounded-full transition-colors pointer-events-auto z-20">
      <Icon className="h-4 w-4 text-white fill-white" />
    </div>
  );
};