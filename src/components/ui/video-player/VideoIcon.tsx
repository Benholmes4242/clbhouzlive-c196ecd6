import React from 'react';
import { Play } from 'lucide-react';

interface VideoIconProps {
  show: boolean;
}

export const VideoIcon: React.FC<VideoIconProps> = ({ show }) => {
  if (!show) return null;

  return (
    <div className="absolute bottom-2 right-2 bg-black/70 rounded-full p-1.5">
      <Play className="h-3 w-3 text-white fill-white" />
    </div>
  );
};