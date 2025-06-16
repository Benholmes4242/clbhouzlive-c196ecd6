
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  youtubeId?: string;
  videoUrl?: string;
}

const VideoPlayer = ({ isOpen, onClose, youtubeId, videoUrl }: VideoPlayerProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10 bg-black/50 text-white hover:bg-black/70"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
        
        {youtubeId ? (
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
            title="YouTube video player"
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : videoUrl ? (
          <video
            src={videoUrl}
            controls
            autoPlay
            className="w-full h-full"
          />
        ) : null}
      </div>
    </div>
  );
};

export default VideoPlayer;
