import React, { useState } from 'react';
import { FeedItemType } from '../types';
import { FilterBar } from '../components/FilterBar';
import { VideoCardWide } from '../components/VideoCardWide';
import { VideoCardPair } from '../components/VideoCardPair';
import { SuggestedChannels } from '../components/SuggestedChannels';
import { ShortsCarousel } from '../components/ShortsCarousel';

/**
 * VideosPage - Main videos feed page
 * 
 * REFACTORED: Removed useAutoplay hook dependency.
 * Autoplay is now controlled exclusively by MediaRuntime.
 * Components should register with useMediaAutoplay instead.
 * 
 * Updated: Now uses unified category filter system from categoryDefinitions.ts
 */
export default function VideosPage() {
  const [filter, setFilter] = useState<string>('all');
  
  // Real data should be fetched here - mock data has been removed
  const feedItems: FeedItemType[] = [];

  const handleVideoClick = (id: string) => {
    console.log('Open video player for:', id);
    // TODO: Navigate to video player or open modal
  };

  const handleEchoToggle = (id: string) => {
    console.log('Toggle echo for:', id);
    // TODO: API call to toggle echo
  };

  const handleSubscribe = (channelId: string) => {
    console.log('Toggle subscribe for:', channelId);
    // TODO: API call to toggle subscription
  };

  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      {/* Header - Reuse your global header component here */}
      <div className="sticky top-0 z-50 bg-[color:rgba(10,10,10,0.95)] backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-white mb-4">Videos</h1>
          <FilterBar active={filter} onChange={setFilter} />
        </div>
      </div>

      {/* Feed */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="space-y-8">
          {feedItems.map((item: FeedItemType, index) => {
            if (item.type === 'wide') {
              return (
                <VideoCardWide
                  key={`wide-${index}`}
                  video={item.video}
                  onVideoClick={handleVideoClick}
                  onEchoToggle={handleEchoToggle}
                />
              );
            }

            if (item.type === 'pair') {
              return (
                <div key={`pair-${index}`} className="grid grid-cols-2 gap-4">
                  <VideoCardPair
                    video={item.videos[0]}
                    onVideoClick={handleVideoClick}
                    onEchoToggle={handleEchoToggle}
                  />
                  <VideoCardPair
                    video={item.videos[1]}
                    onVideoClick={handleVideoClick}
                    onEchoToggle={handleEchoToggle}
                  />
                </div>
              );
            }

            if (item.type === 'channels') {
              return (
                <SuggestedChannels
                  key={`channels-${index}`}
                  channels={item.channels}
                  onSubscribe={handleSubscribe}
                />
              );
            }

            if (item.type === 'shorts') {
              return (
                <ShortsCarousel
                  key={`shorts-${index}`}
                  videos={item.videos}
                  onVideoClick={handleVideoClick}
                />
              );
            }

            return null;
          })}
        </div>

        {/* Load more trigger - TODO: Implement infinite scroll */}
        <div className="mt-12 text-center">
          <button className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors">
            Load More
          </button>
        </div>
      </div>
    </div>
  );
}
