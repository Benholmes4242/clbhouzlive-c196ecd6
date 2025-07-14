import React, { useState } from 'react';
import { TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { PiHandsClapping, PiShareFat } from 'react-icons/pi';
import { GoCommentDiscussion } from 'react-icons/go';
import { useTrendingCard } from '@/hooks/useTrendingCard';

const TrendingCard = () => {
  const { trendingPosts, loading } = useTrendingCard();
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  console.log('TrendingCard render - loading:', loading, 'trendingPosts:', trendingPosts.length);

  if (loading || trendingPosts.length === 0) {
    return (
      <div className="px-1 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="w-full aspect-[3/4] bg-muted rounded-xl animate-pulse" />
          <div className="w-full aspect-[3/4] bg-muted rounded-xl animate-pulse hidden md:block" />
          <div className="w-full aspect-[3/4] bg-muted rounded-xl animate-pulse hidden md:block" />
        </div>
      </div>
    );
  }

  // Component to render a single trending card
  const TrendingCardItem = ({ post, index }) => {
    const media = post.post_media || [];
    const videoMedia = media.filter(m => m.media_type === 'video');
    const user = post.user_profiles;
    
    if (videoMedia.length === 0) return null;

    // Only show the first video, no carousel functionality for trending cards
    const firstVideo = videoMedia[0];

    return (
      <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-card border group">
        {/* Trending Pill - on all cards */}
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-black/30 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-medium">Trending</span>
          </div>
        </div>

        {/* Single Video - No Carousel */}
        <div className="relative w-full h-full">
          <video
            src={firstVideo.media_url}
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          />
          
          {/* Overlay with content */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300">
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <div className="flex justify-between items-end">
                <div className="flex-1 min-w-0 max-w-[calc(100%-80px)]">
                  <p className="text-white font-bold text-base truncate">
                    {user?.display_name || user?.username}
                  </p>
                  {post.content && (
                    <>
                      {/* Default truncated text */}
                      <p className="text-white/90 text-sm mt-1 line-clamp-2 group-hover:hidden">
                        {post.content}
                      </p>
                      {/* Full text on hover (desktop only) */}
                      <p className="text-white/90 text-sm mt-1 hidden group-hover:block md:group-hover:block">
                        {post.content}
                      </p>
                    </>
                  )}
                </div>
                
                {/* Action buttons */}
                <div className="flex flex-col space-y-2 ml-2">
                  <button className="rounded-full p-1.5 text-white hover:bg-white/20 transition-colors">
                    <PiHandsClapping className="w-6 h-6" />
                  </button>
                  <button className="rounded-full p-1.5 text-white hover:bg-white/20 transition-colors">
                    <GoCommentDiscussion className="w-6 h-6" />
                  </button>
                  <button className="rounded-full p-1.5 text-white hover:bg-white/20 transition-colors">
                    <PiShareFat className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="px-1 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {/* Mobile: Show only first card */}
        <div className="md:hidden">
          <TrendingCardItem post={trendingPosts[0]} index={0} />
        </div>
        
        {/* Desktop: Show all three cards */}
        <div className="hidden md:contents">
          {trendingPosts.slice(0, 3).map((post, index) => (
            <TrendingCardItem key={post.id} post={post} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrendingCard;