import React from 'react';
import { TrendingUp, CheckCircle } from 'lucide-react';
import { CreatorHighlight } from '@/hooks/useCreatorHighlights';

interface CreatorHighlightTileProps {
  creator: CreatorHighlight;
  onCreatorClick: (creator: CreatorHighlight) => void;
  className?: string;
}

const CreatorHighlightTile: React.FC<CreatorHighlightTileProps> = ({ 
  creator, 
  onCreatorClick, 
  className = '' 
}) => {
  const formatFollowerCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(0)}K`;
    }
    return count.toString();
  };

  return (
    <div className={`px-4 md:container md:mx-auto md:px-0 ${className}`}>
      <div
        onClick={() => onCreatorClick(creator)}
        className="bg-white rounded-xl border border-border overflow-hidden cursor-pointer group hover:shadow-lg transition-all duration-300"
      >
        {/* Hero Image */}
        <div className="relative h-40 bg-muted overflow-hidden">
          <img
            src={creator.heroImage}
            alt={`${creator.name} hero`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=250&fit=crop';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Growth Badge */}
          <div className="absolute top-3 right-3 bg-discover-orange text-white px-3 py-1.5 rounded-full flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-semibold">+{creator.followerGrowth}%</span>
          </div>

          {/* Creator Spotlight Label */}
          <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-full">
            <span className="text-sm font-medium">Creator Spotlight</span>
          </div>
        </div>

        {/* Creator Info */}
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <img
              src={creator.avatar}
              alt={creator.name}
              className="w-16 h-16 rounded-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-foreground truncate">{creator.name}</h3>
                {creator.verified && (
                  <CheckCircle className="w-5 h-5 text-discover-orange flex-shrink-0" />
                )}
              </div>
              <p className="text-muted-foreground">
                {formatFollowerCount(creator.followerCount)} followers
              </p>
            </div>
          </div>

          {/* Specialties */}
          <div className="flex flex-wrap gap-2">
            {creator.specialties.map((specialty) => (
              <span
                key={specialty}
                className="px-3 py-1.5 bg-muted text-muted-foreground text-sm rounded-full"
              >
                {specialty}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorHighlightTile;