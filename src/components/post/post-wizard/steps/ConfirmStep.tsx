// ConfirmStep - Step 3: Review & Post (Read-Only Confirmation)
// All inputs are now on CaptionStep - this is review only with Edit links
import { useMemo, useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Tag, Image, Play, PenLine, GripVertical, Sparkles } from 'lucide-react';
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

// Section Card wrapper
function SectionCard({ 
  children, 
  delay = 0,
  className,
}: { 
  children: React.ReactNode; 
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div 
      className={cn("bg-white rounded-2xl border border-amber-600/[0.12] overflow-hidden", className)}
      style={{ boxShadow: '0 2px 8px rgba(217,119,6,0.1)' }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  );
}

// Section header with edit action — amber accents
function SectionHeader({ 
  icon: Icon, 
  label, 
  onEdit,
}: { 
  icon: React.ElementType;
  label: string; 
  onEdit?: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 pt-3 pb-1">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-amber-500" />
        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
          {label}
        </span>
      </div>
      {onEdit && (
        <button
          onClick={onEdit}
          className="flex items-center gap-1 px-2 py-1 -mr-1 text-xs font-medium text-amber-600 rounded-lg active:bg-amber-50 transition-colors"
        >
          <PenLine className="h-3 w-3" />
          Edit
        </button>
      )}
    </div>
  );
}

// Thumbnail content - shared between sortable and overlay — amber accents
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
      {/* Cover badge — amber, only on ConfirmStep */}
      {isFirst && !isDragOverlay && (
        <span 
          className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold z-30"
          style={{
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.9), rgba(245, 158, 11, 0.9))',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            color: '#fff',
          }}
        >
          Cover
        </span>
      )}

      {/* Drag grip indicator */}
      {!isDragOverlay && (
        <div className="absolute top-1.5 right-1.5 z-30 opacity-60">
          <GripVertical className="h-3.5 w-3.5 text-white drop-shadow-md" />
        </div>
      )}

      <div className={cn(
        "absolute inset-0 overflow-hidden rounded-xl transition-all duration-150",
        isActive 
          ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-white shadow-md' 
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
        <div className="absolute bottom-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center z-20"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        >
          <Play className="w-2.5 h-2.5 text-white fill-white" />
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
      className="relative flex-shrink-0 cursor-pointer touch-none"
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

  const cardBaseDelay = 0.1;

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      {/* Ready to share header — amber sparkle */}
      <motion.div 
        className="flex items-center gap-2 px-4 pt-4 pb-2"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="h-6 w-6 rounded-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
        >
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-sm font-semibold text-gray-800">Looking good — review your moment</span>
      </motion.div>

      {/* Hero preview — 4:3 aspect, crossfade between items */}
      <div className="flex-shrink-0 mx-4 rounded-2xl overflow-hidden shadow-sm">
        <div className="w-full aspect-[4/3] max-h-[55vh] bg-muted relative overflow-hidden">
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

          {/* Bottom scrim */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 via-black/20 to-transparent pointer-events-none" />
          
          {/* Media counter pill */}
          {state.mediaItems.length > 1 && (
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)' }}
            >
              <span className="text-xs text-white font-semibold tabular-nums">
                {activePreviewIndex + 1} / {state.mediaItems.length}
              </span>
            </div>
          )}
          
          {/* Caption preview overlay */}
          {state.caption && (
            <div className="absolute bottom-3 left-3 right-3 max-w-[85%]">
              <p className="text-sm text-white font-medium line-clamp-2 drop-shadow-md">
                {state.caption}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Thumbnail grid — drag-to-reorder */}
      {state.mediaItems.length > 1 && (
        <motion.div 
          className="px-4 pt-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <GripVertical className="h-3 w-3 text-gray-300" />
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Hold & drag to reorder</span>
          </div>
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
              <div className="grid grid-cols-4 gap-1.5 w-full p-1">
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
            
            <DragOverlay adjustScale={false}>
              {activeDragItem && (
                <div className="scale-105 shadow-xl rounded-xl overflow-hidden" style={{ width: 'calc((100vw - 44px) / 4)' }}>
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
        </motion.div>
      )}
      
      {/* Review cards */}
      <div className="flex-shrink-0 p-4 space-y-3">
        {/* Caption review card */}
        {state.caption && (
          <SectionCard delay={cardBaseDelay}>
            <SectionHeader icon={PenLine} label="Caption" onEdit={onEditCaption} />
            <div className="px-4 pb-3">
              <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-3 leading-relaxed">
                {state.caption}
              </p>
            </div>
          </SectionCard>
        )}
        
        {/* Location review card */}
        {state.selectedCourses.length > 0 && (
          <SectionCard delay={cardBaseDelay + 0.08}>
            <SectionHeader icon={MapPin} label={state.selectedCourses.length === 1 ? 'Location' : 'Locations'} onEdit={onEditLocation} />
            <div className="px-4 pb-3 space-y-1.5">
              {state.selectedCourses.map((course) => (
                <div key={course.id} className="flex items-center gap-2 text-sm">
                  <div className="h-6 w-6 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-3 w-3 text-amber-500" />
                  </div>
                  <span className="font-medium text-gray-800">{course.name}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        )}
        
        {/* Categories card — amber pills */}
        {hasCategories && (
          <SectionCard delay={cardBaseDelay + 0.16}>
            <SectionHeader icon={Tag} label="Categories" onEdit={onOpenCategories} />
            <div className="px-4 pb-3">
              <div className="flex flex-wrap gap-1.5">
                {state.selectedCategories.map((cat) => (
                  <span 
                    key={typeof cat === 'string' ? cat : cat.id}
                    className="px-2.5 py-1 text-xs rounded-full font-medium"
                    style={{
                      background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.12), rgba(245, 158, 11, 0.12))',
                      color: '#92400e',
                    }}
                  >
                    {typeof cat === 'string' ? cat : cat.label}
                  </span>
                ))}
              </div>
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  );
}

export default ConfirmStep;
