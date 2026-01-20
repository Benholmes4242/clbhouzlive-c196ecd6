import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LongFormVideoTile } from './LongFormVideoTile';
import { useLongFormVideos } from '@/hooks/useLongFormVideos';

interface VideosSearchResultsProps {
  query: string;
  category?: string;
  onBack: () => void;
  className?: string;
}

/**
 * VideosSearchResults - Search results for long-form videos
 * 
 * DATA RULES:
 * - Only shows long-form videos (≥3 min)
 * - Searches in post content (title + caption)
 */
export const VideosSearchResults: React.FC<VideosSearchResultsProps> = ({
  query,
  category,
  onBack,
  className,
}) => {
  const navigate = useNavigate();

  const { videos, isLoading } = useLongFormVideos({
    searchQuery: query,
    category,
    limit: 50,
  });

  const handleVideoClick = (id: string) => {
    // Video click handled by parent
  };

  const handleCreatorClick = (creatorUserId: string) => {
    navigate(`/profile/${creatorUserId}`);
  };

  return (
    <div className={cn("min-h-screen pb-20", className)}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium truncate">"{query}"</span>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="px-5 pt-4">
        {isLoading ? (
          <div className="space-y-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-video bg-muted rounded-xl mb-3" />
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-muted" />
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground text-center">
              No videos found for "{query}"
            </p>
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Try different keywords or browse categories
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {videos.length} result{videos.length !== 1 ? 's' : ''} for "{query}"
            </p>
            <div className="grid grid-cols-1 gap-5">
              {videos.map((video) => (
                <LongFormVideoTile
                  key={video.id}
                  video={video}
                  onVideoClick={handleVideoClick}
                  onCreatorClick={handleCreatorClick}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VideosSearchResults;
