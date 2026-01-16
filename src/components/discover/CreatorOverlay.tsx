import React from 'react';
import { FiCheckCircle } from 'react-icons/fi';

interface User {
  id: string;
  name: string;
  username?: string;
  avatar: string;
  verified?: boolean;
}

interface CreatorOverlayProps {
  user?: User;
  onCreatorClick?: (e: React.MouseEvent) => void;
}

const CreatorOverlay: React.FC<CreatorOverlayProps> = ({ user, onCreatorClick }) => {
  if (!user) return null;

  // Only show display name, never username (privacy concern)
  const displayName = user.name || 'Golfer';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCreatorClick?.(e);
  };

  return (
    <div className="absolute bottom-2 left-2 z-creator-overlay pointer-events-auto">
      <button
        onClick={handleClick}
        className="flex items-center gap-2 px-2 py-1.5 bg-black/70 backdrop-blur-sm border border-white/10 rounded-lg transition-all duration-200 hover:bg-black/80 hover:border-white/20 max-w-[200px] group focus:outline-none focus:ring-2 focus:ring-white/30"
        aria-label={`View ${displayName}'s profile`}
      >
        <img
          src={user.avatar}
          alt={displayName}
          className="w-7 h-7 rounded-full object-cover flex-shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';
          }}
        />
        <div className="flex items-center gap-1 min-w-0 flex-1">
          <span className="text-white text-sm font-medium truncate">
            {displayName}
          </span>
          {user.verified && (
            <FiCheckCircle className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          )}
        </div>
      </button>
    </div>
  );
};

export default CreatorOverlay;