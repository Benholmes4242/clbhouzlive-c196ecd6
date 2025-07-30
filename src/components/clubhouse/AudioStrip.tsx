import React from 'react';
import { Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AudioStripProps {
  audioTrack?: {
    title: string;
    artist?: string;
    isOriginal?: boolean;
  };
  className?: string;
}

export const AudioStrip: React.FC<AudioStripProps> = ({ 
  audioTrack, 
  className = "" 
}) => {
  const { toast } = useToast();

  if (!audioTrack) return null;

  const handleClick = () => {
    // Show "coming soon" toast for now
    toast({
      title: "Audio Tagging Coming Soon",
      description: `Discover more posts using "${audioTrack.title}"`,
      duration: 3000,
    });
  };

  const displayTitle = audioTrack.isOriginal 
    ? "Original Audio" 
    : audioTrack.title;

  const displayArtist = audioTrack.artist && !audioTrack.isOriginal 
    ? ` • ${audioTrack.artist}` 
    : "";

  return (
    <button
      onClick={handleClick}
      className={`
        flex items-center gap-2 px-3 py-1.5 
        bg-black/40 backdrop-blur-sm
        text-white text-xs font-medium
        rounded-2xl
        transition-all duration-200
        hover:bg-black/50 active:scale-95
        max-w-[200px]
        ${className}
      `}
    >
      <Volume2 size={14} className="flex-shrink-0" />
      <span className="truncate">
        {displayTitle}{displayArtist}
      </span>
    </button>
  );
};