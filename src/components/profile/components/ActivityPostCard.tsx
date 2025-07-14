
import React from 'react';
import { ActivityPost } from '../types/ActivityTypes';

import CourseTag from '@/components/posts/CourseTag';
import { Camera, Play } from 'lucide-react';
import HighQualityImage from '@/components/ui/high-quality-image';
import EnhancedVideoPlayer from '@/components/ui/enhanced-video-player';
import { useVideoAutoplay } from '@/hooks/useVideoAutoplay';
import { removeGolfCourseFromContent } from '@/utils/golfCourseExtractor';

interface ActivityPostCardProps {
  post: ActivityPost;
  attributionText: string;
  onClick: (post: ActivityPost) => void;
}

const ActivityPostCard = ({ post, attributionText, onClick }: ActivityPostCardProps) => {
  const { ref: autoplayRef, shouldAutoplay, handleMouseEnter, handleMouseLeave } = useVideoAutoplay();
  
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
      ref={autoplayRef}
      className="relative aspect-square bg-gray-100 cursor-pointer group overflow-hidden rounded-xl"
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {hasMedia && firstMedia ? (
        <>
          {firstMedia.media_type === 'video' ? (
             <EnhancedVideoPlayer
               src={firstMedia.media_url}
               autoplay={shouldAutoplay}
               muted={true}
               loop={true}
               className="w-full h-full rounded-[inherit]"
               enableHLS={true}
               onClick={handleClick}
             />
          ) : (
            <HighQualityImage
              src={firstMedia.media_url}
              alt="Post media"
              className="w-full h-full rounded-[inherit]"
              width={300}
              height={300}
              onError={(e) => {
                // Fallback to placeholder on image error safely without innerHTML
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const container = target.parentElement;
                if (container && !container.querySelector('.image-placeholder')) {
                  container.classList.add('flex', 'items-center', 'justify-center');
                  
                  // Create safe placeholder using DOM manipulation
                  const placeholder = document.createElement('div');
                  placeholder.className = 'flex flex-col items-center justify-center text-gray-400 image-placeholder';
                  
                  // Create SVG element safely
                  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                  svg.setAttribute('class', 'w-8 h-8 mb-2');
                  svg.setAttribute('fill', 'currentColor');
                  svg.setAttribute('viewBox', '0 0 24 24');
                  
                  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                  path.setAttribute('d', 'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z');
                  
                  svg.appendChild(path);
                  
                  const span = document.createElement('span');
                  span.className = 'text-xs';
                  span.textContent = 'Image';
                  
                  placeholder.appendChild(svg);
                  placeholder.appendChild(span);
                  container.appendChild(placeholder);
                }
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
