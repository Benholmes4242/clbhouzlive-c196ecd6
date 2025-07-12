import React from 'react';
import { Play } from 'lucide-react';

interface VideoIconProps {
  show: boolean;
}

export const VideoIcon: React.FC<VideoIconProps> = ({ show }) => {
  if (!show) return null;

  return (
    <div className="absolute bottom-2 right-2 flex items-center justify-center w-10 h-10 text-white hover:bg-white/10 rounded-full transition-colors">
      <Play className="h-4 w-4 text-white fill-white" />
    </div>
  );
};