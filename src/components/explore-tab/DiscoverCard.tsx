/**
 * DiscoverCard - Portrait card for Discover grid
 * 
 * Features:
 * - 3:4 aspect ratio (portrait)
 * - Course tag overlay at top center
 * - Rank badge for Top 100 courses
 * - Like count at bottom left
 * - Duration at bottom right (videos only)
 */

import React, { useState } from 'react';
import { Heart, Layers, Play } from 'lucide-react';
import { ExploreMoment } from '@/hooks/useExploreMoments';
import { formatDuration } from '@/utils/formatDuration';

interface DiscoverCardProps {
  moment: ExploreMoment;
  onClick: () => void;
}

function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return count.toString();
}

export function DiscoverCard({ moment, onClick }: DiscoverCardProps) {
  const [imageError, setImageError] = useState(false);
  
  const isVideo = moment.media_type === 'video';
  const imageUrl = moment.thumbnail_url || (moment.media_type === 'image' ? moment.media_url : null);
  const showGradient = !imageUrl || imageError;
  const likeCount = moment.likes_count ?? 0;
  const durationSeconds = moment.duration_seconds ?? 0;

  return (
    <button
      onClick={onClick}
      className="relative aspect-[3/4] bg-black overflow-hidden group w-full"
    >
      {/* Thumbnail */}
      {!showGradient ? (
        <img 
          src={imageUrl!} 
          alt=""
          loading="lazy"
          onError={() => setImageError(true)}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900" />
      )}

      {/* Play icon for videos without autoplay */}
      {isVideo && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-70">
            <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
          </div>
        </div>
      )}
      
      {/* Course tag - Top center pill */}
      {moment.course_name && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 max-w-[calc(100%-16px)]">
          <span className="inline-flex items-center px-2.5 py-1 bg-black/50 backdrop-blur-sm rounded-full text-[11px] font-medium text-white">
            <span className="truncate max-w-[100px]">{moment.course_name}</span>
          </span>
        </div>
      )}
      
      {/* Note: course_rank would need to be added to ExploreMoment type if needed */}
      {/* For now, we don't have rank info on moments - only course_name */}
      
      {/* Bottom gradient */}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
      
      {/* Bottom info row */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between z-10">
        {/* Like count - Left */}
        {likeCount > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full">
            <Heart className="w-3 h-3 text-white fill-white/90" />
            <span className="text-[11px] font-medium text-white tabular-nums">
              {formatCount(likeCount)}
            </span>
          </div>
        )}
        
        {/* Duration - Right (videos only) */}
        {isVideo && durationSeconds > 0 && (
          <span className="text-[11px] font-medium text-white tabular-nums ml-auto px-1.5 py-0.5 bg-black/50 backdrop-blur-sm rounded">
            {formatDuration(durationSeconds)}
          </span>
        )}
      </div>
      
      {/* Hover/Active state */}
      <div className="absolute inset-0 bg-black/10 opacity-0 group-active:opacity-100 transition-opacity pointer-events-none" />
    </button>
  );
}

export default DiscoverCard;
