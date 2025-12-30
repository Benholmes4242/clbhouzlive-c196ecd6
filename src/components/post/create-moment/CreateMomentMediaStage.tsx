import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { ComposerMediaItem } from "@/hooks/useSnapModal";
import MediaCarousel from "@/components/posts/MediaCarousel";
import { MediaNavigationDots } from "@/components/posts/user-post/overlays/MediaNavigationDots";
import { StudioEdits } from "@/types/studio";
import MediaThumbnailStrip from "./MediaThumbnailStrip";
import SoundtrackStrip from "@/components/studio/SoundtrackStrip";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  // Check if any media has music attached (music applies to the whole post)
  const hasMusic = useMemo(() => {
    return media.some(item => {
      const edits = getEdits(item.id);
      return edits?.music?.r2Key || edits?.music?.url;
    });
  }, [media, getEdits]);

  // Get the active music track (from any media item)
  const activeMusic = useMemo(() => {
    for (const item of media) {
      const edits = getEdits(item.id);
      if (edits?.music?.r2Key || edits?.music?.url) {
        return edits.music;
      }
    }
    return null;
  }, [media, getEdits]);

  const handleMuteBlocked = () => {
    toast({
      description: "Original audio is muted because a track is applied.",
      duration: 2000,
    });
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
          forceVideoMuted={hasMusic}
          onMuteBlocked={handleMuteBlocked}
        />

        {/* Top scrim for badges */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/40 to-transparent z-10" />

        {/* Bottom scrim */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/30 to-transparent z-10" />

        {/* Media counter - top left - matching bottom pill style */}
        <div 
          className="absolute left-2 z-20 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-[10px] font-medium text-white/90"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
        >
          {activeIndex + 1}/{media.length}
        </div>

        {/* Remove media button - top right - circle container */}
        <button
          onClick={() => onRemoveMedia(activeIndex)}
          className="absolute right-2 z-20 w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center transition-all hover:bg-black/70 active:scale-95"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
          aria-label="Remove current media"
        >
          <X className="w-3 h-3 text-white/90" />
        </button>


        {/* Soundtrack strip - centered bottom when music is selected (shows for whole post) */}
        {activeMusic && (
          <div className="absolute bottom-[8px] left-1/2 -translate-x-1/2 z-20 max-w-[200px]">
            <SoundtrackStrip 
              music={activeMusic as { trackId: string; title: string; artist?: string; r2Key?: string; url?: string; startAt?: number; volume?: number }}
              variant="preview"
            />
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
