import React from 'react';
import { Heart, MessageCircle, Share } from 'lucide-react';

interface InteractionIconsOverlayProps {
  onInteractionClick: (e: React.MouseEvent, type: string) => void;
}

export const InteractionIconsOverlay: React.FC<InteractionIconsOverlayProps> = ({
  onInteractionClick
}) => {
  return (
    <div className="absolute bottom-3 right-3 z-20">
      <div className="flex flex-col items-center gap-2.5 text-white text-lg opacity-90">
        <button 
          className="cursor-pointer hover:opacity-100 transition-opacity"
          onClick={(e) => onInteractionClick(e, 'like')}
        >
          <Heart className="w-5 h-5" />
        </button>
        <button 
          className="cursor-pointer hover:opacity-100 transition-opacity"
          onClick={(e) => onInteractionClick(e, 'comment')}
        >
          <MessageCircle className="w-5 h-5" />
        </button>
        <button 
          className="cursor-pointer hover:opacity-100 transition-opacity"
          onClick={(e) => onInteractionClick(e, 'share')}
        >
          <Share className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};