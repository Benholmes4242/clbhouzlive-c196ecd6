// ConfirmStep - Step 3: Review & Post (Read-Only Confirmation)
// All inputs are now on CaptionStep - this is review only with Edit links
import { useMemo, useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Tag, Image, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { StepProps, OrderedMediaItem } from '../types';
import { buildVideoPosterUrl } from '@/utils/mediaThumbs';
import { triggerHaptic } from '@/lib/ui/haptics';
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
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToParentElement } from '@dnd-kit/modifiers';

interface ConfirmStepProps extends StepProps {
  onOpenCategories?: () => void;
  onEditCaption?: () => void;
  onEditLocation?: () => void;
}

// Review Card — themed with left accent & stagger entrance
function ReviewCard({ 
  label, 
  value, 
  onEdit,
  delay = 0,
}: { 
  label: string; 
  value: React.ReactNode; 
  onEdit?: () => void;
  delay?: number;
}) {
  return (
    <motion.div 
      className="px-4 py-3 bg-card rounded-2xl border border-border border-l-2 border-l-primary shadow-sm"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut', delay }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-primary uppercase tracking-wide">
          {label}
        </span>
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="h-7 px-2 py-1 -mr-2 text-xs text-primary font-medium hover:text-primary/80 active:bg-muted/50 rounded-lg"
          >
            Edit
          </Button>
        )}
      </div>
      <div className="text-sm text-foreground">
        {value}
      </div>
    </motion.div>
  );
}

// Thumbnail content - shared between sortable and overlay
function ConfirmThumbnailContent({
  item,
  index,
  isFirst,
  isActive,
  isDragOverlay = false,
}: {
  item: OrderedMediaItem;
  index: number;
  isFirst: boolean;
  isActive: boolean;
  isDragOverlay?: boolean;
}) {
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);

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
    <div className="relative aspect-square flex-shrink-0 w-full">
      {/* Cover badge — clear "Cover" pill instead of ambiguous dot */}
      {isFirst && !isDragOverlay && (
        <span 
          className="absolute top-1 left-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium z-30"
          style={{
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            color: '#334E3D',
          }}
        >
          Cover
        </span>
      )}

      <div className={cn(
        "absolute inset-0 overflow-hidden transition-all duration-150",
        isActive 
          ? 'ring-2 ring-primary ring-inset' 
          : 'opacity-70 hover:opacity-100'
      )}>
        {item.type === 'image' ? (
          <img
            src={item.previewUrl}
            alt={`Thumbnail ${index + 1}`}
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <>
            {videoThumbnail ? (
              <img
                src={videoThumbnail}
                alt={`Video thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
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

      {/* Video indicator */}
      {item.type === 'video' && (
        <div className="absolute bottom-1 left-1 w-4 h-4 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center z-20">
          <Play className="w-2 h-2 text-white fill-white" />
        </div>
      )}
    </div>
  );
}

// Sortable thumbnail wrapper for drag-and-drop
function SortableConfirmThumbnail({
  item,
  index,
  isFirst,
  isActive,
  onSelect,
}: {
  item: OrderedMediaItem;
  index: number;
  isFirst: boolean;
  isActive: boolean;
  onSelect: () => void;
}) {
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
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className="relative flex-shrink-0 cursor-pointer touch-none overflow-hidden"
      whileTap={{ scale: 0.95 }}
      onClick={onSelect}
      {...attributes}
      {...listeners}
    >
      <ConfirmThumbnailContent
        item={item}
        index={index}
        isFirst={isFirst}
        isActive={isActive}
      />
    </motion.div>
  );
}

export function ConfirmStep({ 
  state, 
  dispatch,
  onOpenCategories,
  onEditCaption,
  onEditLocation,
}: ConfirmStepProps) {
  const hasCategories = state.selectedCategories.length > 0;
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  
  // Get the active image for preview
  const activeItem = useMemo(() => {
    return state.mediaItems[activePreviewIndex] || state.mediaItems[0];
  }, [state.mediaItems, activePreviewIndex]);

  // Drag-and-drop sensors with delay for touch devices
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
    triggerHaptic('selection');
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDragId(null);
    
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = state.mediaItems.findIndex(item => item.id === active.id);
      const newIndex = state.mediaItems.findIndex(item => item.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newItems = arrayMove(state.mediaItems, oldIndex, newIndex);
        dispatch({ type: 'REORDER_MEDIA', payload: newItems });
        triggerHaptic('light');
        
        // Update active preview index to follow the selected item
        if (activePreviewIndex === oldIndex) {
          setActivePreviewIndex(newIndex);
        } else if (oldIndex < activePreviewIndex && newIndex >= activePreviewIndex) {
          setActivePreviewIndex(activePreviewIndex - 1);
        } else if (oldIndex > activePreviewIndex && newIndex <= activePreviewIndex) {
          setActivePreviewIndex(activePreviewIndex + 1);
        }
      }
    }
  }, [state.mediaItems, dispatch, activePreviewIndex]);

  const handleDragCancel = useCallback(() => {
    setActiveDragId(null);
  }, []);

  const activeDragItem = activeDragId 
    ? state.mediaItems.find(m => m.id === activeDragId) 
    : null;
  const activeDragIndex = activeDragId 
    ? state.mediaItems.findIndex(m => m.id === activeDragId) 
    : -1;

  const handleThumbnailClick = useCallback((index: number) => {
    setActivePreviewIndex(index);
  }, []);

  // Stagger delay base for review cards
  const cardBaseDelay = 0.1;

  return (
    <div className="h-full flex flex-col bg-background overflow-y-auto">
      {/* Hero preview — 4:3 aspect, crossfade between items, video auto-loop */}
      <div className="flex-shrink-0 w-full aspect-[4/3] max-h-[55vh] bg-muted relative overflow-hidden">
        <AnimatePresence mode="wait">
          {activeItem ? (
            <motion.div
              key={activeItem.id}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {activeItem.type === 'video' ? (
                <video
                  src={activeItem.previewUrl}
                  className="w-full h-full object-cover"
                  muted
                  autoPlay
                  loop
                  playsInline
                />
              ) : (
                <img
                  src={activeItem.previewUrl}
                  alt="Post preview"
                  className="w-full h-full object-cover"
                />
              )}
            </motion.div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Image className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </AnimatePresence>

        {/* Bottom scrim — taller gradient for caption legibility */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 via-black/20 to-transparent pointer-events-none" />
        
        {/* Media counter pill */}
        {state.mediaItems.length > 1 && (
          <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-md">
            <span className="text-xs text-white font-medium tabular-nums">
              {activePreviewIndex + 1}/{state.mediaItems.length}
            </span>
          </div>
        )}
        
        {/* Caption preview overlay — responsive width */}
        {state.caption && (
          <div className="absolute bottom-3 left-3 right-3 max-w-[85%]">
            <p className="text-sm text-white font-medium line-clamp-2 drop-shadow-md">
              {state.caption}
            </p>
          </div>
        )}
      </div>
      
      {/* Thumbnail grid — drag-to-reorder, 4px gaps, active ring */}
      {state.mediaItems.length > 1 && (
        <div style={{ paddingTop: '2px', paddingBottom: '2px' }}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
            modifiers={[restrictToParentElement]}
          >
            <SortableContext
              items={state.mediaItems.map(item => item.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-3 gap-1 w-full">
                {state.mediaItems.map((item, index) => (
                  <SortableConfirmThumbnail
                    key={item.id}
                    item={item}
                    index={index}
                    isFirst={index === 0}
                    isActive={index === activePreviewIndex}
                    onSelect={() => handleThumbnailClick(index)}
                  />
                ))}
              </div>
            </SortableContext>
            
            {/* Drag overlay - follows finger */}
            <DragOverlay adjustScale={false}>
              {activeDragItem && (
                <div className="scale-105 shadow-xl rounded-lg overflow-hidden" style={{ width: 'calc((100vw - 8px) / 3)' }}>
                  <ConfirmThumbnailContent
                    item={activeDragItem}
                    index={activeDragIndex}
                    isFirst={activeDragIndex === 0}
                    isActive={activeDragItem.id === state.mediaItems[activePreviewIndex]?.id}
                    isDragOverlay={true}
                  />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>
      )}
      
      {/* Review cards — staggered entrance, left accent, themed tokens */}
      <div className="flex-shrink-0 p-4 space-y-2.5">
        {/* Caption review card */}
        {state.caption && (
          <ReviewCard
            label="Caption"
            delay={cardBaseDelay}
            value={
              <p className="whitespace-pre-wrap line-clamp-3">
                {state.caption}
              </p>
            }
            onEdit={onEditCaption}
          />
        )}
        
        {/* Location review card — vertical list for 2+ courses */}
        {state.selectedCourses.length > 0 && (
          <motion.div 
            className="px-4 py-3 bg-card rounded-2xl border border-border border-l-2 border-l-primary shadow-sm"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut', delay: cardBaseDelay + 0.1 }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-primary uppercase tracking-wide">
                {state.selectedCourses.length === 1 ? 'Location' : 'Locations'}
              </span>
              {onEditLocation && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onEditLocation}
                  className="h-7 px-2 py-1 -mr-2 text-xs text-primary font-medium hover:text-primary/80 active:bg-muted/50 rounded-lg"
                >
                  Edit
                </Button>
              )}
            </div>
            {state.selectedCourses.length === 1 ? (
              /* Single course — inline */
              <div className="flex items-center gap-2 text-sm text-foreground">
                <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="font-medium">{state.selectedCourses[0].name}</span>
              </div>
            ) : (
              /* Multiple courses — vertical stack */
              <div className="flex flex-col gap-1.5">
                {state.selectedCourses.map((course) => (
                  <div key={course.id} className="flex items-center gap-2 text-sm text-foreground">
                    <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="font-medium">{course.name}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
        
        {/* Categories card — consistent accent, stagger */}
        {hasCategories && (
          <motion.div 
            className="px-4 py-3 bg-card rounded-2xl border border-border border-l-2 border-l-primary shadow-sm"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut', delay: cardBaseDelay + 0.2 }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-primary uppercase tracking-wide">
                Categories
              </span>
              {onOpenCategories && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onOpenCategories}
                  className="h-7 px-2 py-1 -mr-2 text-xs text-primary font-medium hover:text-primary/80 active:bg-muted/50 rounded-lg"
                >
                  Edit
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary flex-shrink-0" />
              <div className="flex flex-wrap gap-1">
                {state.selectedCategories.map((cat) => (
                  <span 
                    key={typeof cat === 'string' ? cat : cat.id}
                    className="px-2 py-0.5 text-xs rounded-full bg-primary text-primary-foreground font-medium"
                  >
                    {typeof cat === 'string' ? cat : cat.label}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default ConfirmStep;
