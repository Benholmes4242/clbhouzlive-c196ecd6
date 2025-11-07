import React, { useState } from 'react';
import { useAutoplay } from '../hooks/useAutoplay';
import { VideoFilter, FeedItemType } from '../types';
import { FilterBar } from '../components/FilterBar';
import { VideoCardWide } from '../components/VideoCardWide';
import { VideoCardPair } from '../components/VideoCardPair';
import { SuggestedChannels } from '../components/SuggestedChannels';
import { ShortsCarousel } from '../components/ShortsCarousel';
import { generateMockFeed } from '../data/mockData';

export default function VideosPage() {
  const [filter, setFilter] = useState<VideoFilter>('All');
  const { register } = useAutoplay();
  
  // Mock feed data - replace with real API call
  const feedItems = generateMockFeed(20);

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
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header - Reuse your global header component here */}
      <div className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-gray-800">
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
                  autoRegister={register}
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
                    autoRegister={register}
                    onVideoClick={handleVideoClick}
                    onEchoToggle={handleEchoToggle}
                  />
                  <VideoCardPair
                    video={item.videos[1]}
                    autoRegister={register}
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
