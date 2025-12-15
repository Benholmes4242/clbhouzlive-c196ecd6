import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Star, GripVertical } from "lucide-react";
import { ComposerMediaItem } from "@/hooks/useSnapModal";
import { StudioEdits } from "@/types/studio";
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  const edits = getEdits(item.id);
  const filterClass = edits?.filter ? `filter-${edits.filter}` : '';

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={`
        relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden cursor-pointer
        transition-all duration-150
        ${isActive ? 'ring-2 ring-white ring-offset-1 ring-offset-black/50' : 'opacity-70 hover:opacity-100'}
        ${isDragging ? 'scale-105 shadow-xl' : ''}
      `}
      whileTap={{ scale: 0.95 }}
      onClick={onSelect}
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
        <video
          src={item.previewUrl}
          className={`w-full h-full object-cover ${filterClass}`}
          muted
          playsInline
        />
      )}

      {/* Video indicator */}
      {item.type === 'video' && (
        <div className="absolute bottom-1 left-1 rounded bg-black/60 px-1 py-0.5">
          <Play className="w-2.5 h-2.5 text-white fill-white" />
        </div>
      )}

      {/* Cover indicator */}
      {isCover && (
        <div className="absolute top-1 right-1 rounded bg-amber-500 px-1 py-0.5">
          <Star className="w-2.5 h-2.5 text-white fill-white" />
        </div>
      )}

      {/* Drag handle overlay - visible on long press */}
      <div 
        {...attributes} 
        {...listeners}
        className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors touch-none"
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
