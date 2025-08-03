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
    <div 
      className="absolute bottom-2 right-3 flex items-center justify-center w-10 h-10 text-white hover:bg-white/20 rounded-full transition-all duration-200 pointer-events-auto z-20 bg-white/10 backdrop-blur-2xl border border-white/20"
      style={{ backdropFilter: 'blur(40px) saturate(180%)' }}
    >
      <Icon className="h-4 w-4 text-white fill-white" />
    </div>
  );
};