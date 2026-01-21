// ConfirmStep - Step 3: Review & Post
// Review cards with preview container and thumbnail strip
import { useMemo, useCallback, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Tag, Eye, Pencil, Image, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { StepProps } from '../types';
import { buildVideoPosterUrl } from '@/utils/mediaThumbs';

interface ConfirmStepProps extends StepProps {
  onOpenCategories: () => void;
  onOpenVisibility?: () => void;
  onEditCaption?: () => void;
}

// Review Card Component
function ReviewCard({ 
  label, 
  value, 
  onEdit 
}: { 
  label: string; 
  value: React.ReactNode; 
  onEdit?: () => void;
}) {
  return (
    <div className="px-4 py-3 bg-white rounded-xl border border-[#e2e8f0]">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <Pencil className="h-3 w-3 mr-1" />
            Edit
          </Button>
        )}
      </div>
      <div className="text-sm text-foreground">
        {value}
      </div>
    </div>
  );
}

// Thumbnail item component for the strip
function ConfirmThumbnail({
  item,
  index,
  isFirst,
  isActive,
  onClick,
}: {
  item: { id: string; type: string; previewUrl: string };
  index: number;
  isFirst: boolean;
  isActive: boolean;
  onClick: () => void;
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
    <button
      onClick={onClick}
      className="relative aspect-square flex-shrink-0"
      style={{ width: 'calc((100vw - 16px) / 6)' }}
    >
      {/* Cover indicator dot - orange */}
      {isFirst && (
        <span 
          className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-white shadow-sm z-30"
          aria-label="Cover image"
        />
      )}

      <div className={cn(
        "absolute inset-0 overflow-hidden transition-all duration-150",
        isActive ? '' : 'opacity-70 hover:opacity-100'
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
    </button>
  );
}

export function ConfirmStep({ 
  state, 
  dispatch,
  onOpenCategories,
  onOpenVisibility,
  onEditCaption,
}: ConfirmStepProps) {
  const hasCategories = state.selectedCategories.length > 0;
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  
  // Get the active image for preview
  const activeItem = useMemo(() => {
    return state.mediaItems[activePreviewIndex] || state.mediaItems[0];
  }, [state.mediaItems, activePreviewIndex]);
  
  // Visibility label
  const visibilityLabel = state.visibility === 'anyone' 
    ? 'Everyone' 
    : state.visibility === 'followers' 
      ? 'Followers only' 
      : 'Only me';

  const handleThumbnailClick = useCallback((index: number) => {
    setActivePreviewIndex(index);
  }, []);

  return (
    <div className="h-full flex flex-col bg-[#F8FAFC]">
      {/* Preview container - 1:1 aspect ratio with painted corners (no rounded) */}
      <div className="flex-shrink-0 aspect-square max-h-[50vh] bg-muted relative overflow-hidden">
        {activeItem ? (
          <>
            <img
              src={activeItem.previewUrl}
              alt="Post preview"
              className="w-full h-full object-cover"
            />
            {/* Bottom scrim for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        
        {/* Media counter pill */}
        {state.mediaItems.length > 1 && (
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm">
            <span className="text-xs text-white font-medium tabular-nums">
              {activePreviewIndex + 1}/{state.mediaItems.length}
            </span>
          </div>
        )}
        
        {/* Caption preview overlay */}
        {state.caption && (
          <div className="absolute bottom-3 left-3 right-16 max-w-[280px]">
            <p className="text-sm text-white font-medium line-clamp-2 drop-shadow-md">
              {state.caption}
            </p>
          </div>
        )}
      </div>
      
      {/* Thumbnail strip - same layout as MediaStep */}
      {state.mediaItems.length > 1 && (
        <div style={{ marginLeft: '3px', marginRight: '3px', paddingTop: '3px', paddingBottom: '3px' }}>
          <div className="flex gap-[2px] overflow-x-auto scrollbar-hide w-full">
            {state.mediaItems.map((item, index) => (
              <ConfirmThumbnail
                key={item.id}
                item={item}
                index={index}
                isFirst={index === 0}
                isActive={index === activePreviewIndex}
                onClick={() => handleThumbnailClick(index)}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Review details */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Caption review card */}
        {state.caption && (
          <ReviewCard
            label="Caption"
            value={
              <p className="whitespace-pre-wrap line-clamp-3">
                {state.caption}
              </p>
            }
            onEdit={onEditCaption}
          />
        )}
        
        {/* Location review card - styled with orange like categories */}
        {state.selectedCourse && (
          <div className="px-4 py-3 bg-primary/10 rounded-xl border border-primary/20">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Location
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground">
              <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
              <span>{state.selectedCourse.name}</span>
            </div>
          </div>
        )}
        
        {/* Categories card - required, interactive */}
        <button
          onClick={onOpenCategories}
          className={cn(
            "w-full text-left px-4 py-3 rounded-xl border transition-colors",
            hasCategories 
              ? "bg-primary/10 border-primary/20 hover:bg-primary/15" 
              : "bg-primary/5 border-primary/20 hover:bg-primary/10"
          )}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Categories
            </span>
            <span className="text-xs text-muted-foreground">
              {hasCategories ? 'Edit' : 'Required'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Tag className={cn(
              "h-4 w-4 flex-shrink-0",
              hasCategories ? "text-primary" : "text-muted-foreground"
            )} />
            {hasCategories ? (
              <div className="flex flex-wrap gap-1">
                {state.selectedCategories.slice(0, 3).map((cat, idx) => (
                  <span 
                    key={typeof cat === 'string' ? cat : cat.id}
                    className="px-2 py-0.5 text-xs rounded-full bg-primary text-primary-foreground font-medium"
                  >
                    {typeof cat === 'string' ? cat : cat.label}
                  </span>
                ))}
                {state.selectedCategories.length > 3 && (
                  <span className="text-xs text-muted-foreground">
                    +{state.selectedCategories.length - 3} more
                  </span>
                )}
              </div>
            ) : (
              <span className="text-sm text-warning font-medium">
                Add categories (required)
              </span>
            )}
          </div>
        </button>
        
        {/* Visibility review card */}
        {onOpenVisibility && (
          <ReviewCard
            label="Visibility"
            value={
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span>{visibilityLabel}</span>
              </div>
            }
            onEdit={onOpenVisibility}
          />
        )}
      </div>
      
      {/* Category requirement notice */}
      {!hasCategories && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-shrink-0 px-4 pb-4"
        >
          <p className="text-xs text-center text-muted-foreground">
            Select at least one category to post
          </p>
        </motion.div>
      )}
    </div>
  );
}

export default ConfirmStep;
