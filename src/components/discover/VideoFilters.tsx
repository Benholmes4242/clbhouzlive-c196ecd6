import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { DURATION_FILTERS } from '@/constants/videoFilters';
import { analyticsEvents } from '@/utils/analyticsEvents';

interface VideoFiltersProps {
  duration: string;
  onDurationChange: (duration: string) => void;
}

const VideoFilters: React.FC<VideoFiltersProps> = ({
  duration,
  onDurationChange
}) => {
  // Track page view
  useEffect(() => {
    analyticsEvents.videos.tabView(duration, []);
  }, []);
  
  // Track filter changes
  useEffect(() => {
    analyticsEvents.videos.filterChange(duration, []);
  }, [duration]);
  return (
    <div className="bg-white">
      {/* Duration filters - single select */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {DURATION_FILTERS.map((filter) => (
            <button
              key={filter.key}
              onClick={() => onDurationChange(filter.key)}
              className={cn(
                "px-4 py-1.5 rounded-full whitespace-nowrap text-sm font-medium transition-all",
                duration === filter.key
                  ? "bg-brand-orange text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};

export default VideoFilters;
