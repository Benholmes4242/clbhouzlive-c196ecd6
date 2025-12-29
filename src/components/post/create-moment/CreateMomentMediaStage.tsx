import { motion, useReducedMotion } from "framer-motion";
import { Play, X, GripVertical } from "lucide-react";
import { ComposerMediaItem } from "@/hooks/useSnapModal";
import MediaCarousel from "@/components/posts/MediaCarousel";
import { MediaNavigationDots } from "@/components/posts/user-post/overlays/MediaNavigationDots";
import { StudioEdits } from "@/types/studio";
import MediaThumbnailStrip from "./MediaThumbnailStrip";

interface CreateMomentMediaStageProps {
  media: ComposerMediaItem[];
  activeIndex: number;
  coverIndex: number;
  onIndexChange: (index: number) => void;
  onSetCover: (index: number) => void;
  onRemoveMedia: (index: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  getEdits: (mediaId: string) => StudioEdits;
}

export default function CreateMomentMediaStage({
  media,
  activeIndex,
  coverIndex,
  onIndexChange,
  onSetCover,
  onRemoveMedia,
  onReorder,
  getEdits,
}: CreateMomentMediaStageProps) {
  const prefersReducedMotion = useReducedMotion();

  // Format video duration helper
  const formatDuration = (seconds: number | undefined): string => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (media.length === 0) {
    return null;
  }

  const currentItem = media[activeIndex];

  return (
    <motion.div
      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
      animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
      transition={prefersReducedMotion ? 
        { delay: 0.05, duration: 0.15 } : 
        { delay: 0.1, duration: 0.3 }
      }
      className="h-full w-full flex flex-col"
    >
      {/* Main carousel area */}
      <div className="flex-1 relative">
        <MediaCarousel
          items={media.map((item) => {
            const edits = getEdits(item.id);
            return {
              id: item.id,
              type: item.type,
              previewUrl: item.previewUrl,
              file: item.file,
              alt: `Media item ${item.id}`,
              filterId: edits?.filter
            };
          })}
          initialIndex={activeIndex}
          onIndexChange={onIndexChange}
          onSetCover={onSetCover}
          coverIndex={coverIndex}
          enableSwipe
          loop={false}
          className="h-full w-full"
        />

        {/* Top scrim for badges */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/40 to-transparent z-10" />

        {/* Bottom scrim */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/30 to-transparent z-10" />

        {/* Media counter - top left - DARK GLASS */}
        <div 
          className="absolute left-4 z-20 flex items-center gap-2"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
        >
          <div className="rounded-full bg-black/60 backdrop-blur-sm text-white/90 text-xs px-3 py-1.5 flex items-center gap-1 font-medium">
            <span>{activeIndex + 1}/{media.length}</span>
          </div>
        </div>

        {/* Remove media button - top right - DARK GLASS */}
        <div 
          className="absolute right-4 z-20"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
        >
          <button
            onClick={() => onRemoveMedia(activeIndex)}
            className="rounded-full bg-black/60 backdrop-blur-sm w-8 h-8 flex items-center justify-center transition-all hover:bg-black/70 active:scale-95"
            aria-label="Remove current media"
          >
            <X className="w-4 h-4 text-white/90" />
          </button>
        </div>

        {/* Video duration - bottom left - DARK GLASS */}
        {currentItem?.type === 'video' && currentItem?.duration && (
          <div className="absolute bottom-[8px] left-4 z-20">
            <div className="rounded-full bg-black/60 backdrop-blur-sm text-white/90 text-xs px-3 py-1.5 flex items-center gap-1.5 font-medium">
              <Play className="w-2.5 h-2.5" />
              <span>{formatDuration(currentItem.duration)}</span>
            </div>
          </div>
        )}

        {/* Navigation dots - centered bottom */}
        <MediaNavigationDots
          mediaCount={media.length}
          currentIndex={activeIndex}
          onJump={onIndexChange}
          bottomOffset={8}
          className="z-20"
        />
      </div>

      {/* Thumbnail strip with drag-to-reorder */}
      {media.length > 1 && (
        <MediaThumbnailStrip
          media={media}
          activeIndex={activeIndex}
          coverIndex={coverIndex}
          onSelect={onIndexChange}
          onReorder={onReorder}
          getEdits={getEdits}
        />
      )}
    </motion.div>
  );
}
