
import React, { useState } from 'react';
import { ActivityPost } from '../types/ActivityTypes';

import CourseTag from '@/components/posts/CourseTag';
import { Camera, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { MediaNavigationDots } from '@/components/posts/user-post/overlays/MediaNavigationDots';
import { MdOutlinePlayCircle } from 'react-icons/md';
import HighQualityImage from '@/components/ui/high-quality-image';
import EnhancedVideoPlayer from '@/components/ui/enhanced-video-player';
import { useVideoAutoplay } from '@/hooks/useVideoAutoplay';
import { removeGolfCourseFromContent } from '@/utils/golfCourseExtractor';

interface ActivityPostCardProps {
  post: ActivityPost;
  attributionText: string;
  onClick: (post: ActivityPost) => void;
  isFirstVideo: boolean;
}

const ActivityPostCard = ({ post, attributionText, onClick, isFirstVideo }: ActivityPostCardProps) => {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const { ref: autoplayRef, shouldAutoplay, handleMouseEnter, handleMouseLeave } = useVideoAutoplay();
  
  const handleClick = () => {
    onClick(post);
  };

  const handleCourseTagClick = (courseName: string) => {
    // TODO: Navigate to course-specific feed
    console.log('Navigate to course feed:', courseName);
  };

  // Generate thumbnail URL for Cloudflare Stream videos
  const getVideoThumbnail = (videoUrl: string) => {
    if (videoUrl.includes('cloudflarestream.com') && videoUrl.includes('/manifest/video.m3u8')) {
      // Extract video ID and customer domain from Cloudflare Stream URL
      const match = videoUrl.match(/(https:\/\/customer-[a-f0-9]+\.cloudflarestream\.com)\/([a-f0-9]+)\/manifest\/video\.m3u8/);
      if (match) {
        const customerDomain = match[1];
        const videoId = match[2];
        return `${customerDomain}/${videoId}/thumbnails/thumbnail.jpg`;
      }
    }
    return null;
  };

  // Find course tags from post tags
  const courseTags = post.post_tags?.filter(tag => 
    tag.tagged_entity?.entity_type === 'golf_club'
  ) || [];

  // Check if we have media
  const hasMedia = post.post_media && post.post_media.length > 0;
  const hasMultipleMedia = hasMedia && post.post_media.length > 1;
  const currentMedia = hasMedia ? post.post_media[currentMediaIndex] : null;
  const isVideo = currentMedia?.media_type === 'video';
  
  // Debug logging
  console.log('ActivityPostCard - Rendering post:', {
    postId: post.id,
    hasMedia,
    mediaCount: post.post_media?.length || 0,
    mediaData: post.post_media,
    currentMedia: currentMedia
  });
  
  // Only autoplay if this is the first video and shouldAutoplay is true
  const allowAutoplay = isVideo && isFirstVideo && shouldAutoplay;

  return (
    <div 
      ref={autoplayRef}
      className="relative aspect-square bg-gray-100 cursor-pointer group overflow-hidden" 
      style={{ borderRadius: '8px' }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {hasMedia && currentMedia ? (
        <>
          {currentMedia.media_type === 'video' ? (
            allowAutoplay ? (
              <EnhancedVideoPlayer
                src={currentMedia.media_url}
                autoplay={true}
                muted={true}
                loop={true}
                className="w-full h-full"
                enableHLS={true}
                onClick={handleClick}
              />
            ) : (
              // Show thumbnail for non-autoplay videos
              <div className="relative w-full h-full">
                <HighQualityImage
                  src={getVideoThumbnail(currentMedia.media_url) || currentMedia.media_url}
                  alt="Video thumbnail"
                  className="w-full h-full"
                  width={300}
                  height={300}
                  onError={(e) => {
                    // Fallback for thumbnail generation issues
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const container = target.parentElement;
                    if (container && !container.querySelector('.video-placeholder')) {
                      container.classList.add('flex', 'items-center', 'justify-center', 'bg-gray-200');
                      
                      const placeholder = document.createElement('div');
                      placeholder.className = 'flex flex-col items-center justify-center text-gray-500 video-placeholder';
                      
                      const filmIcon = document.createElement('div');
                      filmIcon.innerHTML = '🎬';
                      filmIcon.className = 'text-2xl mb-1';
                      
                      const span = document.createElement('span');
                      span.className = 'text-xs';
                      span.textContent = 'Video';
                      
                      placeholder.appendChild(filmIcon);
                      placeholder.appendChild(span);
                      container.appendChild(placeholder);
                    }
                  }}
                />
                {/* Film icon for videos */}
                <div className="absolute bottom-2 right-2 z-10">
                  <MdOutlinePlayCircle className="w-6 h-6 text-white drop-shadow-lg" />
                </div>
              </div>
            )
          ) : (
            <HighQualityImage
              src={currentMedia.media_url}
              alt="Post media"
              className="w-full h-full"
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

          {/* Media Navigation Arrows */}
          {hasMultipleMedia && (
            <>
              {/* Left Arrow */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentMediaIndex(prev => prev > 0 ? prev - 1 : post.post_media.length - 1);
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-1 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all"
              >
                <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
              </button>

              {/* Right Arrow */}
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

          {/* Media Navigation Dots */}
          {hasMultipleMedia && (
            <MediaNavigationDots
              mediaCount={post.post_media.length}
              currentIndex={currentMediaIndex}
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
