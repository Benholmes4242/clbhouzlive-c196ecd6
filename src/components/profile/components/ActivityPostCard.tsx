
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Maximize2, Play } from 'lucide-react';
import TaggedText from '@/components/posts/TaggedText';
import { ActivityPost } from '../types/ActivityTypes';

interface ActivityPostCardProps {
  post: ActivityPost;
  attributionText: string;
  onClick: (post: ActivityPost) => void;
}

const ActivityPostCard: React.FC<ActivityPostCardProps> = ({ post, attributionText, onClick }) => {
  return (
    <Card 
      key={post.id} 
      className="aspect-square cursor-pointer hover:shadow-md transition-shadow overflow-hidden relative group" 
      onClick={() => onClick(post)}
    >
      <div className="h-full w-full">
        {/* Media Section - Takes up full space */}
        {post.post_media && post.post_media.length > 0 ? (
          <div className="relative h-full w-full">
            {/* Always show the first media item as thumbnail */}
            {post.post_media[0].media_type === 'image' ? (
              <img
                src={post.post_media[0].media_url}
                alt="Post content"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="relative h-full w-full">
                <video
                  src={post.post_media[0].media_url}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                />
                {/* Video play indicator */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-white/90 rounded-full p-3">
                    <Play className="h-6 w-6 text-black fill-black" />
                  </div>
                </div>
              </div>
            )}
            
            {/* Multiple media indicator - dots only */}
            {post.post_media.length > 1 && (
              <div className="absolute top-2 right-2">
                <div className="bg-black/70 text-white px-2 py-1 rounded-full text-xs font-medium">
                  {post.post_media.length}
                </div>
              </div>
            )}

            {/* Enlarge icon on hover */}
            <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-black/70 text-white p-2 rounded-full hover:bg-black/80 transition-colors shadow-lg">
                <Maximize2 className="h-4 w-4" />
              </div>
            </div>
          </div>
        ) : (
          // Text-only post - takes up full space
          <div className="h-full w-full p-4 flex flex-col justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <div className="text-sm text-center line-clamp-4">
              <TaggedText text={post.content} tags={post.post_tags} />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ActivityPostCard;
