
import React from 'react';
import { ActivityPost } from '../types/ActivityTypes';
import VideoPreview from '@/components/posts/VideoPreview';
import CourseTag from '@/components/posts/CourseTag';
import { Camera, Play } from 'lucide-react';
import HighQualityImage from '@/components/ui/high-quality-image';

interface ActivityPostCardProps {
  post: ActivityPost;
  attributionText: string;
  onClick: (post: ActivityPost) => void;
}

const ActivityPostCard = ({ post, attributionText, onClick }: ActivityPostCardProps) => {
  const handleClick = () => {
    onClick(post);
  };

  const handleCourseTagClick = (courseName: string) => {
    // TODO: Navigate to course-specific feed
    console.log('Navigate to course feed:', courseName);
  };

  // Find course tags from post tags
  const courseTags = post.post_tags?.filter(tag => 
    tag.tagged_entity?.entity_type === 'golf_club'
  ) || [];

  // Check if we have media
  const hasMedia = post.post_media && post.post_media.length > 0;
  const firstMedia = hasMedia ? post.post_media[0] : null;

  return (
    <div 
      className="relative aspect-square bg-gray-100 cursor-pointer group overflow-hidden rounded-lg"
      onClick={handleClick}
    >
      {hasMedia && firstMedia ? (
        <>
          {firstMedia.media_type === 'video' ? (
            <VideoPreview
              src={firstMedia.media_url}
              className="w-full h-full"
              videoId={`activity-${post.id}`}
              isGridThumbnail={true}
            />
          ) : (
            <HighQualityImage
              src={firstMedia.media_url}
              alt="Post media"
              className="w-full h-full"
              width={300}
              height={300}
              onError={(e) => {
                // Fallback to placeholder on image error
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                const placeholder = document.createElement('div');
                placeholder.className = 'flex flex-col items-center justify-center text-gray-400';
                placeholder.innerHTML = `
                  <svg class="w-8 h-8 mb-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                  </svg>
                  <span class="text-xs">Image</span>
                `;
                target.parentElement?.appendChild(placeholder);
              }}
            />
          )}
        </>
      ) : (
        // Fallback placeholder when no media
        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
          <Camera className="w-8 h-8 mb-2" />
          <span className="text-xs">No media</span>
        </div>
      )}
      
      {/* Attribution overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute bottom-0 left-0 right-0 p-2">
          <p className="text-white text-xs font-medium">{attributionText}</p>
          {post.content && (
            <p className="text-white text-xs opacity-90 mt-1 line-clamp-2">
              {post.content}
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
