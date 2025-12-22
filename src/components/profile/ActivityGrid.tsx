import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import HighQualityImage from '@/components/ui/high-quality-image';

export type LayoutHint = 'square' | 'tall' | 'wide';

export interface ActivityGridItem {
  id: string;
  type: 'image' | 'video';
  thumbnailUrl: string;
  previewUrl?: string;
  layoutHint?: LayoutHint;
  roundId?: string;
  courseName?: string;
  roundDate?: string;
}

interface ActivityGridProps {
  items: ActivityGridItem[];
  onItemClick: (item: ActivityGridItem, index: number) => void;
  className?: string;
}

/**
 * ActivityGrid - Premium 3-column grid with 2px gaps and rounded squares
 * Supports masonry-style layout hints for varied content
 */
const ActivityGrid: React.FC<ActivityGridProps> = ({
  items,
  onItemClick,
  className
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  
  // Check if device supports hover (not touch)
  const [supportsHover, setSupportsHover] = useState(false);
  
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    setSupportsHover(window.matchMedia('(pointer:fine)').matches);
  }, []);

  // Cleanup video refs on unmount
  useEffect(() => {
    return () => {
      videoRefs.current.clear();
    };
  }, []);

  // Handle hover preview for videos on desktop
  // NOTE: For grid hover previews, we use simple video element with autoplay
  // attribute rather than calling .play() directly. The browser handles it.
  const handleMouseEnter = useCallback((item: ActivityGridItem) => {
    if (!supportsHover || item.type !== 'video') return;
    setHoveredId(item.id);
    // Video will autoplay via the autoPlay attribute when src is set
  }, [supportsHover]);

  const handleMouseLeave = useCallback((item: ActivityGridItem) => {
    if (!supportsHover) return;
    setHoveredId(null);
    // Video will stop when src is cleared (see render logic)
  }, [supportsHover]);

  // Group posts by round for stacking
  const groupedItems = useMemo(() => {
    const byRound = new Map<string, ActivityGridItem[]>();
    
    for (const item of items) {
      const key = item.roundId ?? `${item.courseName ?? 'none'}-${item.roundDate?.slice(0, 10) ?? item.id}`;
      if (!byRound.has(key)) byRound.set(key, []);
      byRound.get(key)!.push(item);
    }
    
    return Array.from(byRound.entries()).map(([key, value]) => {
      if (value.length === 1) {
        return { kind: 'single' as const, item: value[0] };
      }
      return {
        kind: 'round' as const,
        roundId: key,
        courseName: value[0].courseName ?? 'Golf round',
        items: value
      };
    });
  }, [items]);

  // Flatten for grid display (for now, simple implementation)
  const displayItems = useMemo(() => {
    return groupedItems.flatMap(group => {
      if (group.kind === 'single') return [group.item];
      // For rounds, show first item with stack indicator
      return [{ ...group.items[0], _stackCount: group.items.length, _stackName: group.courseName }];
    });
  }, [groupedItems]);

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
        "grid grid-cols-3 gap-[2px] pb-24",
        className
      )}
    >
      {displayItems.map((item, index) => {
        const isVideo = item.type === 'video';
        const isHovered = hoveredId === item.id;
        const stackCount = (item as any)._stackCount;
        const stackName = (item as any)._stackName;
        
        return (
          <div
            key={item.id}
            className={cn(
              "relative overflow-hidden aspect-square",
              "bg-muted/30 cursor-pointer",
              "transition-transform duration-200",
              "active:scale-[0.98]"
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
                className="w-full h-full object-cover"
                playsInline
                muted
                loop
                preload="metadata"
                autoPlay={isHovered}
              />
            ) : (
              <HighQualityImage
                src={item.thumbnailUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
            
            {/* Video indicator */}
            {isVideo && !isHovered && (
              <div className="absolute right-1.5 bottom-1.5 flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5">
                <Play className="w-3 h-3 fill-white text-white" />
              </div>
            )}
            
            {/* Stack indicator for grouped rounds */}
            {stackCount && stackCount > 1 && (
              <>
                {/* Stacked frame effect */}
                <div className="absolute inset-0 border border-white/25 pointer-events-none" />
                <div className="absolute inset-1 border border-white/15 pointer-events-none" />
                
                {/* Stack label */}
                <div className="absolute left-1.5 bottom-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white flex items-center gap-1">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                    <rect x="8" y="8" width="16" height="16" rx="2" />
                  </svg>
                  {stackName} · {stackCount}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ActivityGrid;
