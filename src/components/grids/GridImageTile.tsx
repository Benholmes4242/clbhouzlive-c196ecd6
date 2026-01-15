/**
 * GridImageTile - 1:1 square image tile for image grids
 * Shows multi-image indicator when post has multiple images
 */

import { Layers } from 'lucide-react';
import { GridPost } from './types';

interface GridImageTileProps {
  post: GridPost;
  onClick: () => void;
}

export function GridImageTile({ post, onClick }: GridImageTileProps) {
  const media = post.post_media?.[0];
  
  if (!media) return null;
  
  const hasMultipleImages = post.post_media && post.post_media.length > 1;
  
  return (
    <div
      className="relative cursor-pointer overflow-hidden bg-[#f1f5f9]"
      style={{ aspectRatio: '1/1' }}
      onClick={onClick}
    >
      <img
        src={media.media_url}
        alt=""
        loading="lazy"
        className="w-full h-full object-cover"
      />
      
      {/* Multi-image indicator */}
      {hasMultipleImages && (
        <div className="absolute top-2 right-2">
          <Layers className="w-5 h-5 text-white drop-shadow-lg" />
        </div>
      )}
    </div>
  );
}
