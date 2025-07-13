import React, { useState } from 'react';
import { TrendingUp, Heart, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTrendingCard } from '@/hooks/useTrendingCard';

const TrendingCard = () => {
  const { trendingPost, loading } = useTrendingCard();
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  console.log('TrendingCard render - loading:', loading, 'trendingPost:', !!trendingPost);

  if (loading || !trendingPost) {
    return (
      <div className="px-1 mb-6">
        <div className="w-full aspect-[3/2] bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  const media = trendingPost.post_media || [];
  // Only get video media
  const videoMedia = media.filter(m => m.media_type === 'video');
  const hasMultipleVideos = videoMedia.length > 1;
  const user = trendingPost.user_profiles;

  console.log('Video media found:', videoMedia.length, 'hasMultiple:', hasMultipleVideos);

  // Don't render if no video media found
  if (videoMedia.length === 0) {
    console.log('No video media found, not rendering trending card');
    return null;
  }

  const handlePrevMedia = () => {
    setCurrentMediaIndex(prev => Math.max(0, prev - 1));
  };

  const handleNextMedia = () => {
    setCurrentMediaIndex(prev => Math.min(videoMedia.length - 1, prev + 1));
  };

  return (
    <div className="px-1 mb-6">
      <div className="relative w-full aspect-[3/2] rounded-xl overflow-hidden bg-card border group">
        {/* Trending Pill */}
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-black/30 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-medium">Trending</span>
          </div>
        </div>

        {/* Media Container */}
        <div className="relative w-full h-full">
          {hasMultipleVideos ? (
            // Carousel for multiple videos
            <div className="relative w-full h-full">
              <div 
                className="flex transition-transform duration-300 ease-out h-full"
                style={{ transform: `translateX(-${currentMediaIndex * 100}%)` }}
              >
                {videoMedia.map((mediaItem, index) => (
                  <div key={index} className="flex-shrink-0 w-full h-full">
                    <video
                      src={mediaItem.media_url}
                      className="w-full h-full object-cover"
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                  </div>
                ))}
              </div>
              
              {/* Carousel Navigation */}
              {videoMedia.length > 1 && (
                <>
                  <button
                    onClick={handlePrevMedia}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={currentMediaIndex === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNextMedia}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={currentMediaIndex === videoMedia.length - 1}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  
                  {/* Dots Indicator */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-1">
                    {videoMedia.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentMediaIndex ? 'bg-white' : 'bg-white/40'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            // Single video
            <div className="w-full h-full">
              <video
                src={videoMedia[0]?.media_url}
                className="w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                onLoadStart={() => console.log('Video loading started:', videoMedia[0]?.media_url)}
                onCanPlay={() => console.log('Video can play')}
                onError={(e) => console.error('Video error:', e)}
              />
            </div>
          )}
          
          {/* Overlay with content */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex justify-between items-end">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">
                    @{user?.username || user?.display_name}
                  </p>
                  {trendingPost.content && (
                    <p className="text-white/90 text-xs mt-1 line-clamp-2">
                      {trendingPost.content}
                    </p>
                  )}
                </div>
                
                {/* Action buttons */}
                <div className="flex space-x-2 ml-3">
                  <button className="bg-white/20 backdrop-blur-sm rounded-full p-2 text-white hover:bg-white/30 transition-colors">
                    <Heart className="w-4 h-4" />
                  </button>
                  <button className="bg-white/20 backdrop-blur-sm rounded-full p-2 text-white hover:bg-white/30 transition-colors">
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendingCard;