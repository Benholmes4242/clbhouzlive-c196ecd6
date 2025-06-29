
import React from 'react';
import { ActivityPost } from '../types/ActivityTypes';
import VideoPreview from '@/components/posts/VideoPreview';
import CourseTag from '@/components/posts/CourseTag';

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

  return (
    <div 
      className="relative aspect-square bg-gray-100 cursor-pointer group"
      onClick={handleClick}
    >
      {post.post_media && post.post_media.length > 0 && (
        <>
          {post.post_media[0].media_type === 'video' ? (
            <VideoPreview
              src={post.post_media[0].media_url}
              className="w-full h-full"
              videoId={post.id}
              isGridThumbnail={true}
            />
          ) : (
            <img
              src={post.post_media[0].media_url}
              alt="Post media"
              className="w-full h-full object-cover"
            />
          )}
        </>
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
