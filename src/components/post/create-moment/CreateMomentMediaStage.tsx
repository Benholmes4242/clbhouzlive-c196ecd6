import { useMemo, useRef, useCallback, useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { ComposerMediaItem } from "@/hooks/useSnapModal";
import MediaCarousel from "@/components/posts/MediaCarousel";
import { MediaNavigationDots } from "@/components/posts/user-post/overlays/MediaNavigationDots";
import { StudioEdits, StudioTool, TextOverlay } from "@/types/studio";
import MediaThumbnailStrip from "./MediaThumbnailStrip";
import SoundtrackStrip from "@/components/studio/SoundtrackStrip";
import TextOverlayRenderer from "@/components/studio/TextOverlayRenderer";
import { useToast } from "@/hooks/use-toast";
import { AchievementBadgesOverlay } from "@/components/post/badges/AchievementBadgesOverlay";

interface CreateMomentMediaStageProps {
  media: ComposerMediaItem[];
  activeMediaId: string | null;
  coverMediaId: string | null;
  onActiveMediaChange: (mediaId: string) => void;
  onSetCover: (mediaId: string) => void;
  onRemoveMedia: (mediaId: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  getEdits: (mediaId: string) => StudioEdits;
  // Studio integration for editable text overlays
  activeTool?: StudioTool;
  onUpdateEdits?: (mediaId: string, patch: Partial<StudioEdits>) => void;
  // Position mode - enables drag/pinch/rotate
  isPositioningText?: boolean;
  // Active overlay selection (synced with panel)
  activeOverlayId?: string | null;
  onSelectOverlay?: (id: string | null) => void;
  // Achievement badges selected for this post
  selectedBadges?: string[];
  // Callback when drag state changes (to block sheet dismiss)
  onDragStateChange?: (isDragging: boolean) => void;
}

export default function CreateMomentMediaStage({
  media,
  activeMediaId,
  coverMediaId,
  onActiveMediaChange,
  onSetCover,
  onRemoveMedia,
  onReorder,
  getEdits,
  activeTool,
  onUpdateEdits,
  isPositioningText = false,
  activeOverlayId,
  onSelectOverlay,
  selectedBadges,
  onDragStateChange,
}: CreateMomentMediaStageProps) {
  const prefersReducedMotion = useReducedMotion();
  const { toast } = useToast();
  const stageContainerRef = useRef<HTMLDivElement>(null);
  const mediaContainerRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<{ scrollToIndex: (index: number) => void } | null>(null);

  // Derive activeIndex from activeMediaId
  const activeIndex = useMemo(() => {
    if (!activeMediaId) return 0;
    const idx = media.findIndex(m => m.id === activeMediaId);
    return idx >= 0 ? idx : 0;
  }, [media, activeMediaId]);

  // Derive coverIndex from coverMediaId
  const coverIndex = useMemo(() => {
    if (!coverMediaId) return 0;
    const idx = media.findIndex(m => m.id === coverMediaId);
    return idx >= 0 ? idx : 0;
  }, [media, coverMediaId]);

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

  // Handler for carousel index change (from swipe)
  const handleCarouselIndexChange = useCallback((index: number) => {
    const newMediaId = media[index]?.id;
    if (newMediaId && newMediaId !== activeMediaId) {
      onActiveMediaChange(newMediaId);
    }
  }, [media, activeMediaId, onActiveMediaChange]);

  // Handler for thumbnail tap - change active and scroll carousel
  const handleThumbnailSelect = useCallback((mediaId: string) => {
    onActiveMediaChange(mediaId);
    // Scroll carousel to that index
    const index = media.findIndex(m => m.id === mediaId);
    if (index >= 0 && carouselRef.current) {
      carouselRef.current.scrollToIndex(index);
    }
  }, [media, onActiveMediaChange]);

  // Handler for navigation dots
  const handleDotJump = useCallback((index: number) => {
    const mediaId = media[index]?.id;
    if (mediaId) {
      onActiveMediaChange(mediaId);
    }
  }, [media, onActiveMediaChange]);

  if (media.length === 0) {
    return null;
  }

  const currentItem = media[activeIndex];
  const isTextToolActive = activeTool === 'text';
  const isTextEditable = isTextToolActive && isPositioningText;
  const isDraggingText = isTextToolActive && isPositioningText;
  const currentEdits = currentItem ? getEdits(currentItem.id) : undefined;

  // Handler for updating text overlays via drag - defined after currentItem
  const handleTextOverlayChange = (overlays: TextOverlay[]) => {
    if (!currentItem || !onUpdateEdits) return;
    onUpdateEdits(currentItem.id, { textOverlays: overlays });
  };

  return (
    <motion.div
      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
      animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
      transition={prefersReducedMotion ? 
        { delay: 0.05, duration: 0.15 } : 
        { delay: 0.1, duration: 0.3 }
      }
      className="h-full w-full flex flex-col"
      data-ecm-no-dismiss="true"
    >
      {/* Main carousel area */}
      <div ref={stageContainerRef} className="flex-1 relative" data-ecm-no-dismiss="true">
        {/* Media container wrapper for drag calculations */}
        <div ref={mediaContainerRef} className="relative h-full w-full">
            <MediaCarousel
              ref={carouselRef}
              items={media.map((item) => {
                const edits = getEdits(item.id);
                return {
                  id: item.id,
                  type: item.type,
                  previewUrl: item.previewUrl,
                  thumbnailUrl: item.thumbnailUrl,
                  file: item.file,
                  alt: `Media item ${item.id}`,
                  studioEdits: edits
                };
              })}
            initialIndex={activeIndex}
            onIndexChange={handleCarouselIndexChange}
            onSetCover={(index) => {
              const mediaId = media[index]?.id;
              if (mediaId) onSetCover(mediaId);
            }}
            coverIndex={coverIndex}
            enableSwipe={!isDraggingText}
            loop={false}
            className="h-full w-full"
            forceVideoMuted={hasMusic}
            onMuteBlocked={handleMuteBlocked}
          />

          {/* Text overlays for current media - editable only in position mode */}
          {currentItem && (
            <TextOverlayRenderer
              textOverlays={currentEdits?.textOverlays ?? []}
              isEditable={isTextEditable}
              onChange={isTextEditable ? handleTextOverlayChange : undefined}
              containerRef={mediaContainerRef}
              activeOverlayId={activeOverlayId}
              onSelectOverlay={onSelectOverlay}
              safeAreaContext="create"
            />
          )}
        </div>

        {/* Position mode hint overlay */}
        {isTextEditable && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full bg-black/60 backdrop-blur-sm">
            <p className="text-xs text-white/90 whitespace-nowrap">
              Drag to place • Pinch to resize • Tap Done when finished
            </p>
          </div>
        )}

        {/* Top scrim for badges - subtle */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/20 to-transparent z-10" />

        {/* Bottom scrim - subtle */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/15 to-transparent z-10" />

        {/* Media counter - top left - matching bottom pill style */}
        <div 
          className="absolute left-2 z-20 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm text-[10px] font-medium text-white"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
        >
          {activeIndex + 1}/{media.length}
        </div>

        {/* Achievement badges overlay - below media counter */}
        <AchievementBadgesOverlay 
          badgeIds={selectedBadges} 
          className="top-10 left-2" 
        />

        {/* Remove media button - top right - circle container */}
        <button
          onClick={() => onRemoveMedia(currentItem?.id || '')}
          className="absolute right-2 z-20 w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center transition-all hover:bg-black/70 active:scale-95"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
          aria-label="Remove current media"
        >
          <X className="w-3 h-3 text-white" />
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
          onJump={handleDotJump}
          bottomOffset={8}
          className="z-20"
        />
      </div>

      {/* Thumbnail strip with drag-to-reorder */}
      {media.length > 1 && (
        <MediaThumbnailStrip
          media={media}
          activeMediaId={activeMediaId}
          onSelect={handleThumbnailSelect}
          onRemove={onRemoveMedia}
          onReorder={onReorder}
          getEdits={getEdits}
          onDragStateChange={onDragStateChange}
        />
      )}
    </motion.div>
  );
}
