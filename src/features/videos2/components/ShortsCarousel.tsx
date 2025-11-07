import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { HLSVideo } from './HLSVideo';
import { VideoItem } from '../types';
import { useAutoplayInRail } from '../hooks/useAutoplayInRail';

type ShortsCarouselProps = {
  videos: VideoItem[];
  onVideoClick: (id: string) => void;
};

export function ShortsCarousel({ videos, onVideoClick }: ShortsCarouselProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const { register } = useAutoplayInRail(railRef);

  const formatViews = (n: number): string => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  };

  return (
    <div className="bg-[#111] rounded-xl p-6 shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-lg">Shorts</h3>
        <span className="text-sm text-gray-400">Quick highlights</span>
      </div>

      <div
        ref={railRef}
        className="flex gap-3 overflow-x-auto pb-2 no-scrollbar"
      >
        {videos.map((video) => (
          <motion.div
            key={video.id}
            className="flex-shrink-0 w-40 cursor-pointer group"
            onClick={() => onVideoClick(video.id)}
            whileHover={{ y: -2 }}
          >
            {/* Thumbnail/Video */}
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-gray-900 shadow-lg">
              <HLSVideo
                hlsUrl={video.hlsUrl}
                src={video.src}
                poster={video.poster}
                className="w-full h-full object-cover"
                autoRegister={register}
              />

              {/* Views */}
              <div className="absolute bottom-2 left-2 right-2">
                <div className="bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-white text-xs">
                  👁️ {formatViews(video.views)}
                </div>
              </div>
            </div>

            {/* Title */}
            <p className="text-white text-sm font-medium mt-2 line-clamp-2">
              {video.title}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
