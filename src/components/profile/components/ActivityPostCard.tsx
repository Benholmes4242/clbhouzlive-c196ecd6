
import React, { useState } from 'react';
import { ActivityPost } from '../types/ActivityTypes';
import CourseTag from '@/components/posts/CourseTag';
import { Camera, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { MediaNavigationDots } from '@/components/posts/user-post/overlays/MediaNavigationDots';
import HighQualityImage from '@/components/ui/high-quality-image';
import { removeGolfCourseFromContent } from '@/utils/golfCourseExtractor';
import { getStreamPoster } from '@/utils/stream';
import { getFilterClass } from '@/utils/studioFilters';
import { getCropWrapperClass, getPixelLayerStyle } from '@/utils/studioEdit';
import { cn } from '@/lib/utils';

interface ActivityPostCardProps {
  post: ActivityPost;
  attributionText: string;
  onClick: (post: ActivityPost) => void;
  isFirstVideo?: boolean; // Kept for API compatibility but no longer used
}

/**
 * ActivityPostCard - Grid card for activity feed
 * Legacy autoplay removed - videos show poster thumbnail only
 * For autoplay, use BusinessPostCard with useGridAutoplay
 */
const ActivityPostCard = ({ post, attributionText, onClick }: ActivityPostCardProps) => {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  
  const handleClick = () => {
    onClick(post);
  };

  const handleCourseTagClick = (courseName: string) => {
    console.log('Navigate to course feed:', courseName);
  };

  const courseTags = post.post_tags?.filter(tag => 
    tag.tagged_entity?.entity_type === 'golf_club'
  ) || [];

  const hasMedia = post.post_media && post.post_media.length > 0;
  const hasMultipleMedia = hasMedia && post.post_media.length > 1;
  const currentMedia = hasMedia ? post.post_media[currentMediaIndex] : null;
  
  const studioEdits = (currentMedia as any)?.studio_edits;
  const filterId = (currentMedia as any)?.filter_id || studioEdits?.filter;
  const filterClass = getFilterClass(filterId as any);
  const cropClass = getCropWrapperClass(studioEdits?.crop);
  const pixelStyle = getPixelLayerStyle(studioEdits);

  return (
    <div 
      className="relative aspect-square bg-gray-100 cursor-pointer group overflow-hidden" 
      onClick={handleClick}
    >
      {hasMedia && currentMedia ? (
        <>
          {currentMedia.media_type === 'video' ? (
            <div className={cn("relative w-full h-full", cropClass)}>
              <div className={cn("w-full h-full", filterClass)} style={pixelStyle}>
                <HighQualityImage
                  src={getStreamPoster(currentMedia.media_url, '1s') || '/placeholder.svg'}
                  alt="Video thumbnail"
                  className="w-full h-full object-cover"
                  width={300}
                  height={300}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
              </div>
              <div className="absolute bottom-2 right-2 z-10">
                <div className="rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 w-6 h-6 flex items-center justify-center">
                  <Play className="w-3 h-3 text-white ml-0.5" fill="currentColor" />
                </div>
              </div>
            </div>
          ) : (
            <div className={cn("w-full h-full", cropClass)}>
              <img
                src={currentMedia.media_url}
                alt="Post media"
                className={cn("w-full h-full object-cover", filterClass)}
                style={pixelStyle}
              />
            </div>
          )}

          {hasMultipleMedia && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentMediaIndex(prev => prev > 0 ? prev - 1 : post.post_media.length - 1);
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-1 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all"
              >
                <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentMediaIndex(prev => prev < post.post_media.length - 1 ? prev + 1 : 0);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all"
              >
                <ChevronRight className="w-5 h-5 stroke-[2.5]" />
              </button>
            </>
          )}

          {hasMultipleMedia && (
            <MediaNavigationDots
              mediaCount={post.post_media.length}
              currentIndex={currentMediaIndex}
            />
          )}
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
          <Camera className="w-8 h-8 mb-2" />
          <span className="text-xs">No media</span>
        </div>
      )}
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute bottom-0 left-0 right-0 p-2">
          <p className="text-white text-xs font-medium">{attributionText}</p>
          {post.content && (
            <p className="text-white text-xs opacity-90 mt-1 line-clamp-2">
              {removeGolfCourseFromContent(post.content)}
            </p>
          )}
          {courseTags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
              {courseTags.map((tag) => (
                <CourseTag
                  key={tag.id}
                  courseName={tag.tagged_entity!.name}
                  onClick={() => handleCourseTagClick(tag.tagged_entity!.name)}
                  className="text-xs px-2 py-0.5"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityPostCard;
