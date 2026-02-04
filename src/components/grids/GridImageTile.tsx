/**
 * GridImageTile - 1:1 square image tile for image grids
 * 
 * TikTok-level polish:
 * - Priority loading for first 9 visible tiles
 * - Staggered fade-in animation
 * - Shows multi-image indicator when post has multiple images
 */

import { Layers } from 'lucide-react';
import { GridPost } from './types';
import { motion } from 'framer-motion';

interface GridImageTileProps {
  post: GridPost;
  onClick: () => void;
  index?: number;
}

export function GridImageTile({ post, onClick, index = 0 }: GridImageTileProps) {
  const media = post.post_media?.[0];
  
  if (!media) return null;
  
  const hasMultipleImages = post.post_media && post.post_media.length > 1;
  
  // Staggered entry animation delay (max 400ms total stagger)
  const staggerDelay = Math.min(index * 0.04, 0.4);
  
  // Priority loading for first 9 tiles (3x3 grid visible)
  const isPriority = index < 9;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        duration: 0.2, 
        delay: staggerDelay,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      className="relative cursor-pointer overflow-hidden bg-muted/20"
      style={{ aspectRatio: '1/1' }}
      onClick={onClick}
    >
      <img
        src={media.media_url}
        alt=""
        loading={isPriority ? "eager" : "lazy"}
        fetchPriority={isPriority ? "high" : "auto"}
        className="w-full h-full object-cover"
      />
      
      {/* Multi-image indicator */}
      {hasMultipleImages && (
        <div className="absolute top-2 right-2">
          <Layers className="w-5 h-5 text-white drop-shadow-lg" />
        </div>
      )}
    </motion.div>
  );
}
