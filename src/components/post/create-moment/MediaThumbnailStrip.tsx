import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Trash2 } from "lucide-react";
import { VideoPlayIndicator } from "@/components/ui/VideoPlayIndicator";
import { ComposerMediaItem } from "@/hooks/useSnapModal";
import { StudioEdits } from "@/types/studio";
import { buildVideoPosterUrl } from "@/utils/mediaThumbs";
import { MediaUploadOverlay } from "./MediaUploadOverlay";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToParentElement } from '@dnd-kit/modifiers';

interface MediaThumbnailStripProps {
  media: ComposerMediaItem[];
  activeMediaId: string | null;
  onSelect: (mediaId: string) => void;
  onRemove: (mediaId: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  getEdits: (mediaId: string) => StudioEdits;
  onDragStateChange?: (isDragging: boolean) => void;
  /** Whether uploading is in progress (disables reordering and removal) */
  isUploading?: boolean;
}

interface SortableThumbProps {
  item: ComposerMediaItem;
  index: number;
  isActive: boolean;
  isFirst: boolean;
  getEdits: (mediaId: string) => StudioEdits;
  onSelect: () => void;
  onRemove: () => void;
  isDragOverlay?: boolean;
  isUploading?: boolean;
}

// Static thumbnail content used both in sortable and overlay
function ThumbContent({ 
  item, 
  index, 
  isActive, 
  isFirst, 
  getEdits, 
  onRemove,
  isDragOverlay = false,
  isUploading = false,
}: Omit<SortableThumbProps, 'onSelect'>) {
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);

  const edits = getEdits(item.id);
  const filterClass = edits?.filter ? `filter-${edits.filter}` : '';

  // Generate video thumbnail from first frame
  useEffect(() => {
    if (item.type !== 'video' || !item.previewUrl) return;
    
    const posterUrl = buildVideoPosterUrl(item.previewUrl, { width: 112, height: 112 });
    if (posterUrl && !posterUrl.startsWith('blob:')) {
      setVideoThumbnail(posterUrl);
      return;
    }
    
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    
    video.onloadeddata = () => {
      video.currentTime = 0.1;
    };
    
    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 112;
        canvas.height = 112;
        const ctx = canvas.getContext('2d');
        if (ctx) {
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
    <div className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden">
      {/* Cover indicator dot - orange color, always on first item (hidden during drag) */}
      {isFirst && !isDragOverlay && (
        <span 
          className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-white shadow-sm z-30"
          aria-label="Cover image"
        />
      )}

      {/* Thumbnail container - square design */}
      <div 
        className={`
          absolute inset-0 overflow-hidden transition-all duration-150
          ${isActive ? '' : 'opacity-70 hover:opacity-100'}
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

      {/* Video indicator - bottom left, inside thumbnail */}
      {item.type === 'video' && !item.uploadStatus && <VideoPlayIndicator />}

      {/* Upload status overlay */}
      <MediaUploadOverlay 
        status={item.uploadStatus} 
        progress={item.uploadProgress} 
      />

      {/* Remove button - bottom right, inside thumbnail (not during drag overlay or upload) */}
      {!isDragOverlay && !isUploading && !item.uploadStatus && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-red-500/80 backdrop-blur-sm hover:bg-red-500 flex items-center justify-center z-20 transition-colors"
          aria-label="Remove media"
        >
          <Trash2 className="w-2 h-2 text-white" />
        </button>
      )}
    </div>
  );
}

function SortableThumb({ item, index, isActive, isFirst, getEdits, onSelect, onRemove, isUploading }: SortableThumbProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: item.id,
    disabled: isUploading, // Disable drag during upload
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className="relative flex-shrink-0 cursor-pointer touch-none"
      whileTap={isUploading ? undefined : { scale: 0.95 }}
      onClick={onSelect}
      {...attributes}
      {...(isUploading ? {} : listeners)}
    >
      <ThumbContent
        item={item}
        index={index}
        isActive={isActive}
        isFirst={isFirst}
        getEdits={getEdits}
        onRemove={onRemove}
        isUploading={isUploading}
      />
    </motion.div>
  );
}

export default function MediaThumbnailStrip({
  media,
  activeMediaId,
  onSelect,
  onRemove,
  onReorder,
  getEdits,
  onDragStateChange,
  isUploading = false,
}: MediaThumbnailStripProps) {
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
    onDragStateChange?.(true);
  }, [onDragStateChange]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDragId(null);
    onDragStateChange?.(false);
    
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = media.findIndex(item => item.id === active.id);
      const newIndex = media.findIndex(item => item.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(oldIndex, newIndex);
      }
    }
  }, [media, onReorder, onDragStateChange]);

  const handleDragCancel = useCallback(() => {
    setActiveDragId(null);
    onDragStateChange?.(false);
  }, [onDragStateChange]);

  const activeDragItem = activeDragId ? media.find(m => m.id === activeDragId) : null;
  const activeDragIndex = activeDragId ? media.findIndex(m => m.id === activeDragId) : -1;

  return (
    <div 
      className="flex-shrink-0 border-t border-border bg-background"
      style={{ paddingTop: '2px', paddingBottom: '2px' }}
      data-ecm-no-dismiss="true"
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        modifiers={[restrictToParentElement]}
      >
        <SortableContext
          items={media.map(item => item.id)}
          strategy={rectSortingStrategy}
        >
          {/* Horizontal scroll thumbnail strip - fixed height, scrollable */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide px-3 py-2">
            {media.map((item, index) => (
              <SortableThumb
                key={item.id}
                item={item}
                index={index}
                isActive={item.id === activeMediaId}
                isFirst={index === 0}
                getEdits={getEdits}
                onSelect={() => onSelect(item.id)}
                onRemove={() => onRemove(item.id)}
                isUploading={isUploading}
              />
            ))}
          </div>
        </SortableContext>
        
        {/* Drag overlay - follows finger */}
        <DragOverlay adjustScale={false}>
          {activeDragItem && (
            <div className="scale-105 shadow-xl rounded-lg">
              <ThumbContent
                item={activeDragItem}
                index={activeDragIndex}
                isActive={activeDragItem.id === activeMediaId}
                isFirst={activeDragIndex === 0}
                getEdits={getEdits}
                onRemove={() => {}}
                isDragOverlay={true}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
