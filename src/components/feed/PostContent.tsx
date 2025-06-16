
import React from 'react';
import { Play } from 'lucide-react';

interface PostContentProps {
  content: {
    type: 'video' | 'image';
    description: string;
    thumbnail?: string;
    image?: string;
    duration?: string;
    videoUrl?: string;
    youtubeId?: string;
  };
  onVideoClick?: () => void;
}

const PostContent = ({ content, onVideoClick }: PostContentProps) => {
  return (
    <>
      <p className="text-sm mb-3">{content.description}</p>
      
      <div className="relative rounded-lg overflow-hidden mb-3">
        {content.type === 'video' ? (
          <div 
            className="relative cursor-pointer group"
            onClick={onVideoClick}
          >
            <img
              src={content.thumbnail}
              alt="Video thumbnail"
              className="w-full h-80 object-cover"
            />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/30 transition-all">
              <div className="bg-white/90 rounded-full p-3 group-hover:scale-110 transition-transform">
                <Play className="h-6 w-6 text-green-600 fill-current" />
              </div>
            </div>
            {content.duration && (
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {content.duration}
              </div>
            )}
          </div>
        ) : (
          <img
            src={content.image}
            alt="Post content"
            className="w-full h-80 object-cover"
          />
        )}
      </div>
    </>
  );
};

export default PostContent;
