import React, { useState } from 'react';
import { Heart, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { PiHandsClapping, PiShareFat } from 'react-icons/pi';
import { GoCommentDiscussion } from 'react-icons/go';
import OptimisticPostCard from '../posts/OptimisticPostCard';
import { VideoPost, UserPostWithType } from './types';

interface MosaicFeedContentProps {
  optimisticPosts: any[];
  sortedContent: (VideoPost | UserPostWithType)[];
  onPostUpdated: () => void;
  onPostDeleted: () => void;
}

const MosaicFeedContent: React.FC<MosaicFeedContentProps> = ({
  optimisticPosts,
  sortedContent,
  onPostUpdated,
  onPostDeleted
}) => {
  const [currentMediaIndex, setCurrentMediaIndex] = useState<{[key: string]: number}>({});

  const handlePrevMedia = (postId: string, mediaLength: number) => {
    setCurrentMediaIndex(prev => ({
      ...prev,
      [postId]: Math.max(0, (prev[postId] || 0) - 1)
    }));
  };

  const handleNextMedia = (postId: string, mediaLength: number) => {
    setCurrentMediaIndex(prev => ({
      ...prev,
      [postId]: Math.min(mediaLength - 1, (prev[postId] || 0) + 1)
    }));
  };

  const renderMediaTile = (item: VideoPost | UserPostWithType, index: number) => {
    const isUserPost = item.type === 'user_post';
    const media = isUserPost 
      ? (item as UserPostWithType).post_media.map(pm => ({ media_url: pm.media_url, media_type: pm.media_type }))
      : [{ media_url: (item as VideoPost).content.videoUrl || (item as VideoPost).content.image || '', media_type: (item as VideoPost).content.type }];
    const currentIndex = currentMediaIndex[item.id] || 0;
    const hasMultipleMedia = media.length > 1;

    // Get user info
    const username = isUserPost ? (item as UserPostWithType).user.username : (item as VideoPost).user.username;
    const displayName = isUserPost ? (item as UserPostWithType).user.display_name : (item as VideoPost).user.name;
    const caption = isUserPost ? (item as UserPostWithType).content : (item as VideoPost).content.description;

    // Generate three types of cards based on Pinterest style
    const cardTypes = [
      'aspect-[2/3]',       // Tall portrait cards (2:3)
      'aspect-[4/5]',       // Medium cards (4:5) - most common
      'aspect-square',      // Short/square cards
    ];
    
    // Distribute card types with medium being most common
    const getCardType = (index: number) => {
      const random = (index * 7) % 10; // Pseudo-random but consistent
      if (random < 5) return cardTypes[1]; // 50% medium cards
      if (random < 8) return cardTypes[0]; // 30% tall cards  
      return cardTypes[2]; // 20% square cards
    };
    
    const aspectRatio = getCardType(index);

    return (
      <div key={item.id} className="mosaic-tile group relative overflow-hidden rounded-xl bg-card border">
        {/* Media Container */}
        <div className={`relative w-full overflow-hidden ${aspectRatio}`}>
          {hasMultipleMedia ? (
            // Carousel for multiple media
            <div className="relative w-full h-full">
              <div 
                className="flex transition-transform duration-300 ease-out h-full"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              >
                {media.map((mediaItem, index) => (
                  <div key={index} className="flex-shrink-0 w-full h-full">
                     {mediaItem.media_type === 'video' ? (
                       <video
                         src={mediaItem.media_url}
                         className="w-full h-full object-cover rounded-xl"
                         autoPlay
                         muted
                         loop
                         playsInline
                       />
                     ) : (
                       <img
                         src={mediaItem.media_url}
                         alt="Golf content"
                         className="w-full h-full object-cover rounded-xl"
                         loading="lazy"
                       />
                     )}
                  </div>
                ))}
              </div>
              
              {/* Carousel Navigation */}
              {media.length > 1 && (
                <>
                  <button
                    onClick={() => handlePrevMedia(item.id, media.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={currentIndex === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleNextMedia(item.id, media.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={currentIndex === media.length - 1}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  
                  {/* Dots Indicator */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-1">
                    {media.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentIndex ? 'bg-white' : 'bg-white/40'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            // Single media
            <div className="w-full h-full">
              {media[0]?.media_type === 'video' ? (
                 <video
                   src={media[0].media_url}
                   className="w-full h-full object-cover rounded-xl"
                   autoPlay
                   muted
                   loop
                   playsInline
                 />
              ) : (
                 <img
                   src={media[0]?.media_url}
                   alt="Golf content"
                   className="w-full h-full object-cover rounded-xl"
                   loading="lazy"
                 />
              )}
            </div>
          )}
          
          {/* Overlay with content */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">
                    @{username || displayName}
                  </p>
                  {caption && (
                    <p className="text-white/90 text-xs mt-1 line-clamp-2">
                      {caption}
                    </p>
                  )}
                </div>
                
                {/* Action buttons */}
                <div className="flex flex-col space-y-2 ml-3 mb-1">
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
    <div className="mosaic-feed-container pb-20">
      {/* Show optimistic posts first */}
      {optimisticPosts.length > 0 && (
        <div className="mb-6">
          {optimisticPosts.map((optimisticPost) => (
            <OptimisticPostCard 
              key={optimisticPost.id} 
              post={optimisticPost}
              onRetry={() => {
                // Handle retry logic here if needed
              }}
            />
          ))}
        </div>
      )}
      
      {/* Mosaic Grid */}
      <div className="mosaic-grid">
        {sortedContent.map((item, index) => renderMediaTile(item, index))}
      </div>
    </div>
  );
};

export default MosaicFeedContent;