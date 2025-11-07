import React, { useState, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useAutoplay } from '../hooks/useAutoplay';
import { VideoFilter } from '../types';
import { FilterBar } from '../components/FilterBar';
import { VideoCardWide } from '../components/VideoCardWide';
import { VideoCardPair } from '../components/VideoCardPair';
import { SuggestedChannels } from '../components/SuggestedChannels';
import { ShortsCarousel } from '../components/ShortsCarousel';
import { useVideos2Data, getMockShorts, getMockChannels } from '../data/getVideos2Data';
import type { VideoItem } from '../types';

type Row = 
  | { type: 'wide'; video: VideoItem }
  | { type: 'pair'; videos: [VideoItem, VideoItem?] }
  | { type: 'channels' }
  | { type: 'shorts' };

export default function VideosPage() {
  const [filter, setFilter] = useState<VideoFilter>('All');
  const { register } = useAutoplay();
  const parentRef = useRef<HTMLDivElement>(null);
  
  const { videos, isLoading } = useVideos2Data(20);
  const SHORTS = getMockShorts(6);
  const CHANNELS = getMockChannels(6);

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

  // Build interleaved rows: Wide → Pair → Wide → Pair with rails
  const rows: Row[] = [];
  for (let i = 0; i < videos.length; i += 3) {
    if (videos[i]) {
      rows.push({ type: 'wide', video: videos[i] });
    }
    if (videos[i + 1]) {
      rows.push({ type: 'pair', videos: [videos[i + 1], videos[i + 2]] });
    }
    if (i > 0 && i % 9 === 0) {
      rows.push({ type: 'channels' });
    }
    if (i > 0 && i % 12 === 0) {
      rows.push({ type: 'shorts' });
    }
  }

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (i) => {
      const row = rows[i];
      if (row.type === 'pair') return 360;
      if (row.type === 'wide') return window.innerHeight * 0.5 + 140;
      if (row.type === 'channels') return 180;
      return 340;
    },
    overscan: 6,
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-white mb-4">Videos</h1>
          <FilterBar active={filter} onChange={setFilter} />
        </div>
      </div>

      {/* Virtualized Feed */}
      <div ref={parentRef} className="h-[calc(100vh-120px)] overflow-auto">
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index];
            const style: React.CSSProperties = {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              transform: `translateY(${virtualRow.start}px)`,
            };

            if (row.type === 'wide') {
              return (
                <div key={virtualRow.key} style={style} className="px-4 py-5">
                  <VideoCardWide
                    video={row.video}
                    autoRegister={register}
                    onVideoClick={handleVideoClick}
                    onEchoToggle={handleEchoToggle}
                  />
                </div>
              );
            }

            if (row.type === 'pair') {
              return (
                <div key={virtualRow.key} style={style} className="px-4 pb-4">
                  <div className="grid grid-cols-2 gap-3">
                    <VideoCardPair
                      video={row.videos[0]}
                      autoRegister={register}
                      onVideoClick={handleVideoClick}
                      onEchoToggle={handleEchoToggle}
                    />
                    {row.videos[1] && (
                      <VideoCardPair
                        video={row.videos[1]}
                        autoRegister={register}
                        onVideoClick={handleVideoClick}
                        onEchoToggle={handleEchoToggle}
                      />
                    )}
                  </div>
                </div>
              );
            }

            if (row.type === 'channels') {
              return (
                <div key={virtualRow.key} style={style}>
                  <SuggestedChannels
                    channels={CHANNELS}
                    onSubscribe={handleSubscribe}
                  />
                </div>
              );
            }

            if (row.type === 'shorts') {
              return (
                <div key={virtualRow.key} style={style}>
                  <ShortsCarousel
                    videos={SHORTS}
                    onVideoClick={handleVideoClick}
                  />
                </div>
              );
            }

            return null;
          })}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && videos.length === 0 && (
        <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a0a]/80">
          <div className="text-white text-lg">Loading videos...</div>
        </div>
      )}
    </div>
  );
}
