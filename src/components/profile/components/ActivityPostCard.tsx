
import React, { useState } from 'react';
import { ActivityPost } from '../types/ActivityTypes';
import CourseTag from '@/components/posts/CourseTag';
import { Camera, Play, ChevronLeft, ChevronRight, Star, MapPin } from 'lucide-react';
import { MediaNavigationDots } from '@/components/posts/user-post/overlays/MediaNavigationDots';
import HighQualityImage from '@/components/ui/high-quality-image';
import { removeGolfCourseFromContent } from '@/utils/golfCourseExtractor';
import { getStreamPoster } from '@/utils/stream';
import { getFilterClass } from '@/utils/studioFilters';
import { getCropWrapperClass, getPixelLayerStyle } from '@/utils/studioEdit';
import TextOverlayRenderer from '@/components/studio/TextOverlayRenderer';
import { cn } from '@/lib/utils';

interface ActivityPostCardProps {
  post: ActivityPost;
  attributionText: string;
  onClick: (post: ActivityPost) => void;
  isFirstVideo?: boolean; // Kept for API compatibility but no longer used
}

// Helper to format location string
const formatLocation = (course?: ActivityPost['course']) => {
  if (!course) return '';
  const parts = [course.sub_country || course.region, course.country].filter(Boolean);
  return parts.join(', ');
};

/**
 * ActivityPostCard - Grid card for activity feed
 * Now includes review overlay for posts with isReview=true
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

  // Review overlay data
  const isReview = post.isReview;
  const courseName = post.course?.name;
  const courseLocation = formatLocation(post.course);
  const rating = post.rating;

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
              <div className={cn("w-full h-full", filterClass)} style={pixelStyle}>
                <img
                  src={currentMedia.media_url}
                  alt="Post media"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
          
          {/* Text overlays */}
          {studioEdits?.textOverlays?.length > 0 && (
            <TextOverlayRenderer
              textOverlays={studioEdits.textOverlays}
              isEditable={false}
              safeAreaContext="feed"
            />
          )}

          {/* Review overlay - always visible for review posts */}
          {isReview && (
            <>
              {/* Top gradient for overlay readability */}
              <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />
              
              {/* Top-left: Course name + location */}
              {courseName && (
                <div className="absolute top-2 left-2 z-10 max-w-[60%]">
                  <p className="text-white text-xs font-semibold truncate drop-shadow-md">
                    {courseName}
                  </p>
                  {courseLocation && (
                    <div className="flex items-center gap-0.5 mt-0.5">
                      <MapPin className="w-2.5 h-2.5 text-white/70" />
                      <p className="text-white/70 text-[10px] truncate drop-shadow-md">
                        {courseLocation}
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Top-right: Rating badge */}
              {rating != null && (
                <div className="absolute top-2 right-2 z-10 flex flex-col items-end gap-0.5">
                  <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-md px-1.5 py-0.5">
                    <Star className="w-3 h-3 text-amber-400" fill="currentColor" />
                    <span className="text-white text-xs font-bold">{rating.toFixed(1)}</span>
                  </div>
                  <span className="text-white/60 text-[9px] drop-shadow-md">From a review</span>
                </div>
              )}
            </>
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
      
      {/* Hover overlay - only for non-review posts (reviews already have persistent overlay) */}
      {!isReview && (
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
      )}
    </div>
  );
};

export default ActivityPostCard;
