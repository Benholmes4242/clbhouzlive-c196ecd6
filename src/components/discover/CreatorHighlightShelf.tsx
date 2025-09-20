import React from 'react';
import { TrendingUp, CheckCircle } from 'lucide-react';
import { useCreatorHighlights, CreatorHighlight } from '@/hooks/useCreatorHighlights';

interface CreatorHighlightShelfProps {
  onCreatorClick: (creator: CreatorHighlight) => void;
  className?: string;
}

const CreatorHighlightShelf: React.FC<CreatorHighlightShelfProps> = ({ 
  onCreatorClick, 
  className = '' 
}) => {
  const { highlights, loading } = useCreatorHighlights();

  const formatFollowerCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(0)}K`;
    }
    return count.toString();
  };

  if (loading) {
    return (
      <div className={`px-4 md:container md:mx-auto md:px-6 ${className}`}>
        <div className="mb-4">
          <div className="h-6 bg-muted rounded animate-pulse w-40 mb-2" />
          <div className="h-4 bg-muted rounded animate-pulse w-64" />
        </div>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex-shrink-0 w-80">
              <div className="bg-muted rounded-xl h-48 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`px-4 md:container md:mx-auto md:px-6 ${className}`}>
      {/* Section Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-foreground mb-1">Creator Highlights</h2>
        <p className="text-muted-foreground text-sm">
          Trending creators making waves in the golf community
        </p>
      </div>

      {/* Horizontal Scrollable Shelf */}
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
        {highlights.slice(0, 5).map((creator) => (
          <div
            key={creator.id}
            onClick={() => onCreatorClick(creator)}
            className="flex-shrink-0 w-80 bg-white rounded-xl border border-border overflow-hidden cursor-pointer group hover:shadow-lg transition-all duration-300"
          >
            {/* Hero Image */}
            <div className="relative h-32 bg-muted overflow-hidden">
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
              <div className="absolute top-3 right-3 bg-discover-orange text-white px-2 py-1 rounded-full flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span className="text-xs font-semibold">+{creator.followerGrowth}%</span>
              </div>
            </div>

            {/* Creator Info */}
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={creator.avatar}
                  alt={creator.name}
                  className="w-12 h-12 rounded-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    <h3 className="font-semibold text-foreground truncate">{creator.name}</h3>
                    {creator.verified && (
                      <CheckCircle className="w-4 h-4 text-discover-orange flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {formatFollowerCount(creator.followerCount)} followers
                  </p>
                </div>
              </div>

              {/* Specialties */}
              <div className="flex flex-wrap gap-1">
                {creator.specialties.slice(0, 2).map((specialty) => (
                  <span
                    key={specialty}
                    className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CreatorHighlightShelf;