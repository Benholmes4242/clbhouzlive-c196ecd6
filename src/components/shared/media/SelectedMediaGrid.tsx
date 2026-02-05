/**
 * SelectedMediaGrid Component
 * 
 * A polished, interactive grid for managing selected media items with:
 * - 3-column responsive layout
 * - Drag-and-drop reordering via @dnd-kit
 * - Cover badge on first item
 * - Remove button on each item
 * - Video duration and play icon overlays
 * - "+ Add More" card when under max items
 */

import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DndContext, 
  closestCenter, 
  useSensor, 
  useSensors, 
  PointerSensor, 
  TouchSensor,
  DragEndEvent 
} from '@dnd-kit/core';
import { 
  SortableContext, 
  rectSortingStrategy, 
  useSortable,
  arrayMove 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, Play, Plus, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MediaGridItem {
  id: string;
  type: 'image' | 'video';
  previewUrl: string;
  file?: File;
  remoteUrl?: string;
  duration?: number;
  thumbnailUrl?: string;
}

interface SelectedMediaGridProps {
  items: MediaGridItem[];
  onReorder: (items: MediaGridItem[]) => void;
  onRemove: (id: string) => void;
  onAddMore: () => void;
  maxItems?: number;
  disabled?: boolean;
}

// Format duration as MM:SS
function formatDuration(seconds?: number): string {
  if (!seconds || !isFinite(seconds)) return '';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Sortable media item component
function SortableMediaItem({ 
  item, 
  index, 
  onRemove,
  disabled 
}: { 
  item: MediaGridItem; 
  index: number; 
  onRemove: (id: string) => void;
  disabled?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: item.id,
    disabled 
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  const displayUrl = item.thumbnailUrl || item.previewUrl;
  const isVideo = item.type === 'video';
  const isCover = index === 0;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ 
        opacity: isDragging ? 0.8 : 1, 
        scale: isDragging ? 1.05 : 1,
      }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "relative aspect-square rounded-xl overflow-hidden cursor-grab active:cursor-grabbing",
        "bg-muted border border-border shadow-sm",
        isDragging && "ring-2 ring-primary shadow-lg"
      )}
    >
      {/* Media thumbnail */}
      <img 
        src={displayUrl} 
        alt={`Media ${index + 1}`}
        className="w-full h-full object-cover"
        draggable={false}
      />
      
      {/* Cover badge */}
      {isCover && (
        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/70 rounded text-[10px] font-medium text-white backdrop-blur-sm">
          Cover
        </div>
      )}
      
      {/* Video overlay */}
      {isVideo && (
        <>
          {/* Play icon */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
              <Play className="w-4 h-4 text-white fill-white ml-0.5" />
            </div>
          </div>
          
          {/* Duration badge */}
          {item.duration && (
            <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-black/70 rounded text-[10px] font-medium text-white tabular-nums backdrop-blur-sm">
              {formatDuration(item.duration)}
            </div>
          )}
        </>
      )}
      
      {/* Remove button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onRemove(item.id);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className={cn(
          "absolute top-1.5 right-1.5 w-6 h-6 rounded-full",
          "bg-black/70 hover:bg-black/90 backdrop-blur-sm",
          "flex items-center justify-center",
          "transition-colors touch-manipulation"
        )}
        aria-label="Remove media"
      >
        <X className="w-3.5 h-3.5 text-white" />
      </button>
    </motion.div>
  );
}

// Add more card component
function AddMoreCard({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "aspect-square rounded-xl border-2 border-dashed border-border",
        "bg-muted/50 hover:bg-muted hover:border-muted-foreground/30",
        "flex flex-col items-center justify-center gap-1.5",
        "transition-colors cursor-pointer",
        "disabled:opacity-50 disabled:cursor-not-allowed"
      )}
    >
      <div className="w-8 h-8 rounded-full bg-muted-foreground/10 flex items-center justify-center">
        <Plus className="w-4 h-4 text-muted-foreground" />
      </div>
      <span className="text-xs font-medium text-muted-foreground">Add More</span>
    </motion.button>
  );
}

// Empty state component
function EmptyState({ onSelect }: { onSelect: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="col-span-3 flex flex-col items-center justify-center py-12"
    >
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <ImageIcon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-base font-medium text-foreground mb-1">No media selected</h3>
      <p className="text-sm text-muted-foreground mb-4">Add photos and videos to continue</p>
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "px-4 py-2 rounded-full",
          "bg-primary text-primary-foreground",
          "text-sm font-medium",
          "hover:bg-primary/90 transition-colors"
        )}
      >
        Select Media
      </button>
    </motion.div>
  );
}

export function SelectedMediaGrid({
  items,
  onReorder,
  onRemove,
  onAddMore,
  maxItems = 6,
  disabled = false,
}: SelectedMediaGridProps) {
  // Configure sensors for both pointer and touch
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement to start drag
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // 200ms hold to start drag on touch
        tolerance: 5,
      },
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(item => item.id === active.id);
      const newIndex = items.findIndex(item => item.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(items, oldIndex, newIndex);
        onReorder(reordered);
      }
    }
  }, [items, onReorder]);

  const canAddMore = items.length < maxItems;

  // Empty state
  if (items.length === 0) {
    return (
      <div className="grid grid-cols-3 gap-2 p-4">
        <EmptyState onSelect={onAddMore} />
      </div>
    );
  }

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCenter} 
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-3 gap-2 p-4">
          <AnimatePresence mode="popLayout">
            {items.map((item, index) => (
              <SortableMediaItem
                key={item.id}
                item={item}
                index={index}
                onRemove={onRemove}
                disabled={disabled}
              />
            ))}
            
            {/* Add More card */}
            {canAddMore && !disabled && (
              <AddMoreCard 
                key="add-more"
                onClick={onAddMore} 
                disabled={disabled}
              />
            )}
          </AnimatePresence>
        </div>
      </SortableContext>
    </DndContext>
  );
}
