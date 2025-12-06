import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import HighQualityImage from '@/components/ui/high-quality-image';

export interface ActivityGridV2Item {
  id: string;
  type: 'image' | 'video';
  thumbnailUrl: string;
  previewUrl?: string;
  roundId?: string;
  courseName?: string;
  roundDate?: string;
}

interface ActivityGridV2Props {
  items: ActivityGridV2Item[];
  onItemClick: (item: ActivityGridV2Item, index: number) => void;
  className?: string;
}

/**
 * ActivityGridV2 - Profile 2.0 Activity Grid
 * Layout: 3-column grid
 * Thumbnails: 12-16px rounded corners
 * Spacing: 2-4px between posts
 * Videos: Silent autoplay on scroll (desktop hover)
 */
const ActivityGridV2: React.FC<ActivityGridV2Props> = ({
  items,
  onItemClick,
  className
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const [supportsHover, setSupportsHover] = useState(false);
  
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    setSupportsHover(window.matchMedia('(pointer:fine)').matches);
  }, []);

  useEffect(() => {
    return () => {
      videoRefs.current.clear();
    };
  }, []);

  const handleMouseEnter = useCallback((item: ActivityGridV2Item) => {
    if (!supportsHover || item.type !== 'video') return;
    setHoveredId(item.id);
    
    const video = videoRefs.current.get(item.id);
    if (video) {
      video.muted = true;
      video.play().catch(() => {});
    }
  }, [supportsHover]);

  const handleMouseLeave = useCallback((item: ActivityGridV2Item) => {
    if (!supportsHover) return;
    setHoveredId(null);
    
    const video = videoRefs.current.get(item.id);
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
  }, [supportsHover]);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-4xl mb-4">📷</div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No posts yet</h3>
        <p className="text-muted-foreground text-sm max-w-[280px]">
          Share your golf moments to see them here
        </p>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "grid grid-cols-3 gap-[3px] pb-24",
        className
      )}
    >
      {items.map((item, index) => {
        const isVideo = item.type === 'video';
        const isHovered = hoveredId === item.id;
        
        return (
          <div
            key={item.id}
            className={cn(
              "relative overflow-hidden aspect-square",
              "bg-muted/30 cursor-pointer",
              "transition-all duration-200",
              "active:scale-[0.98]",
              "rounded-[14px]" // 12-16px rounded corners per spec
            )}
            onClick={() => onItemClick(item, index)}
            onMouseEnter={() => handleMouseEnter(item)}
            onMouseLeave={() => handleMouseLeave(item)}
          >
            {/* Image/Video content */}
            {isVideo && supportsHover ? (
              <video
                ref={el => {
                  if (el) videoRefs.current.set(item.id, el);
                }}
                src={isHovered ? item.previewUrl : undefined}
                poster={item.thumbnailUrl}
                className="w-full h-full object-cover rounded-[14px]"
                playsInline
                muted
                loop
                preload="metadata"
              />
            ) : (
              <HighQualityImage
                src={item.thumbnailUrl}
                alt=""
                className="w-full h-full object-cover rounded-[14px]"
              />
            )}
            
            {/* Video indicator */}
            {isVideo && !isHovered && (
              <div className="absolute right-2 bottom-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1">
                <Play className="w-3 h-3 fill-white text-white" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ActivityGridV2;
