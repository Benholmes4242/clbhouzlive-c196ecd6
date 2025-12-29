import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Sparkles, GripVertical } from "lucide-react";
import { ComposerMediaItem } from "@/hooks/useSnapModal";
import { StudioEdits } from "@/types/studio";
import { buildVideoPosterUrl } from "@/utils/mediaThumbs";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface MediaThumbnailStripProps {
  media: ComposerMediaItem[];
  activeIndex: number;
  coverIndex: number;
  onSelect: (index: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  getEdits: (mediaId: string) => StudioEdits;
}

interface SortableThumbProps {
  item: ComposerMediaItem;
  index: number;
  isActive: boolean;
  isCover: boolean;
  getEdits: (mediaId: string) => StudioEdits;
  onSelect: () => void;
}

function SortableThumb({ item, index, isActive, isCover, getEdits, onSelect }: SortableThumbProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });
  
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  const edits = getEdits(item.id);
  const filterClass = edits?.filter ? `filter-${edits.filter}` : '';

  // Generate video thumbnail from first frame
  useEffect(() => {
    if (item.type !== 'video' || !item.previewUrl) return;
    
    // Try to use poster URL first (for Stream videos)
    const posterUrl = buildVideoPosterUrl(item.previewUrl, { width: 112, height: 112 });
    if (posterUrl && !posterUrl.startsWith('blob:')) {
      setVideoThumbnail(posterUrl);
      return;
    }
    
    // For local files, generate from video element
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    
    video.onloadeddata = () => {
      video.currentTime = 0.1; // Seek to 0.1s for thumbnail
    };
    
    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 112;
        canvas.height = 112;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Draw centered crop
          const scale = Math.max(112 / video.videoWidth, 112 / video.videoHeight);
          const sw = 112 / scale;
          const sh = 112 / scale;
          const sx = (video.videoWidth - sw) / 2;
          const sy = (video.videoHeight - sh) / 2;
          ctx.drawImage(video, sx, sy, sw, sh, 0, 0, 112, 112);
          setVideoThumbnail(canvas.toDataURL('image/jpeg', 0.7));
        }
      } catch (e) {
        console.warn('Failed to generate video thumbnail:', e);
      }
    };
    
    video.src = item.previewUrl;
    video.load();
    
    return () => {
      video.src = '';
    };
  }, [item.type, item.previewUrl]);

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={`
        relative flex-shrink-0 w-14 h-14 rounded-lg cursor-pointer
        transition-all duration-150
        ${isDragging ? 'scale-105 shadow-xl' : ''}
      `}
      whileTap={{ scale: 0.95 }}
      onClick={onSelect}
    >
      {/* Selection indicator - using inset shadow to avoid clipping */}
      <div 
        className={`
          absolute inset-0 rounded-lg overflow-hidden
          ${isActive ? 'ring-2 ring-white ring-inset shadow-[inset_0_0_0_2px_white]' : 'opacity-70 hover:opacity-100'}
        `}
      >
        {/* Thumbnail image */}
        {item.type === 'image' ? (
          <img
            src={item.previewUrl}
            alt={`Thumbnail ${index + 1}`}
            className={`w-full h-full object-cover ${filterClass}`}
            draggable={false}
          />
        ) : (
          <>
            {/* Video thumbnail - show generated/poster image instead of video element */}
            {videoThumbnail ? (
              <img
                src={videoThumbnail}
                alt={`Video thumbnail ${index + 1}`}
                className={`w-full h-full object-cover ${filterClass}`}
                draggable={false}
              />
            ) : (
              <div className="w-full h-full bg-black/40 flex items-center justify-center">
                <Play className="w-4 h-4 text-white/60" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Video indicator - DARK GLASS */}
      {item.type === 'video' && (
        <div className="absolute bottom-1 left-1 rounded bg-black/60 backdrop-blur-sm px-1 py-0.5">
          <Play className="w-2.5 h-2.5 text-white fill-white" />
        </div>
      )}

      {/* Cover indicator - modern sparkle style */}
      {isCover && (
        <div className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-white/90 shadow-sm flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
        </div>
      )}

      {/* Drag handle overlay - visible on long press */}
      <div 
        {...attributes} 
        {...listeners}
        className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors touch-none rounded-lg"
      >
        <GripVertical className="w-4 h-4 text-white/0 hover:text-white/60 transition-colors" />
      </div>
    </motion.div>
  );
}

export default function MediaThumbnailStrip({
  media,
  activeIndex,
  coverIndex,
  onSelect,
  onReorder,
  getEdits,
}: MediaThumbnailStripProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 200, // Long press to start drag
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = media.findIndex(item => item.id === active.id);
      const newIndex = media.findIndex(item => item.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(oldIndex, newIndex);
      }
    }
  }, [media, onReorder]);

  return (
    <div className="px-4 py-3 bg-black/30 backdrop-blur-sm">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={media.map(item => item.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {media.map((item, index) => (
              <SortableThumb
                key={item.id}
                item={item}
                index={index}
                isActive={index === activeIndex}
                isCover={index === coverIndex}
                getEdits={getEdits}
                onSelect={() => onSelect(index)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      
      {/* Helper text */}
      <p className="text-xs text-white/50 mt-2 text-center">
        Hold and drag to reorder • Tap ★ to set cover
      </p>
    </div>
  );
}
