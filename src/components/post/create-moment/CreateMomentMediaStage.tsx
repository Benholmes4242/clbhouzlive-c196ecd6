import { useMemo, useRef, useCallback, useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Play } from "lucide-react";
import { ComposerMediaItem } from "@/hooks/useSnapModal";
import MediaCarousel from "@/components/posts/MediaCarousel";
import { MediaNavigationDots } from "@/components/posts/user-post/overlays/MediaNavigationDots";
import { StudioEdits, StudioTool, TextOverlay } from "@/types/studio";

import SoundtrackStrip from "@/components/studio/SoundtrackStrip";
import TextOverlayRenderer from "@/components/studio/TextOverlayRenderer";
import { useToast } from "@/hooks/use-toast";
import { AchievementBadgesOverlay } from "@/components/post/badges/AchievementBadgesOverlay";
import { useLocalStorage } from "@/hooks/useLocalStorage";

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
  // Per-item processing state (videos being processed)
  processingMediaIds?: Set<string>;
  // Per-item warning state (poster generation failed)
  warningMediaIds?: Set<string>;
  // Items being animated out before removal
  removingMediaIds?: Set<string>;
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
  processingMediaIds,
  warningMediaIds,
  removingMediaIds,
}: CreateMomentMediaStageProps) {
  const prefersReducedMotion = useReducedMotion();
  const { toast } = useToast();
  const stageContainerRef = useRef<HTMLDivElement>(null);
  const mediaContainerRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<{ scrollToIndex: (index: number) => void } | null>(null);
  
  // Persist display mode preference (Fill vs Fit)
  const [displayMode, setDisplayMode] = useLocalStorage<'fill' | 'fit'>('mediaDisplayMode', 'fill');

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
      className="h-full w-full flex flex-col min-h-0"
      data-ecm-no-dismiss="true"
    >
      {/* Main carousel area - flex-1 min-h-0 to constrain within available space */}
      <div ref={stageContainerRef} className="flex-1 min-h-0 relative overflow-hidden" data-ecm-no-dismiss="true">
        {/* Media container wrapper for drag calculations */}
        <div ref={mediaContainerRef} className="relative h-full w-full flex items-center justify-center">
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
            hideVideoOverlays={true}
            displayMode={displayMode}
            onDisplayModeChange={setDisplayMode}
            isWizardContext={true}
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

        {/* Top scrim for badges - only in fill mode */}
        {displayMode === 'fill' && (
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/20 to-transparent z-10" />
        )}

        {/* Bottom scrim - only in fill mode */}
        {displayMode === 'fill' && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/15 to-transparent z-10" />
        )}

        {/* Achievement badges overlay - top left below header */}
        <AchievementBadgesOverlay 
          badgeIds={selectedBadges} 
          className="left-4 top-[calc(env(safe-area-inset-top,0px)+52px)]"
        />

        {/* Video timestamp - bottom left corner for videos only - consistent pill style */}
        {currentItem?.type === 'video' && currentItem?.duration && (
          <div className="absolute bottom-3 left-3 z-20 h-7 px-2.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center">
            <span className="text-xs text-white font-medium tabular-nums">
              {Math.floor(currentItem.duration / 60)}:{String(Math.floor(currentItem.duration % 60)).padStart(2, '0')}
            </span>
          </div>
        )}

        {/* Play icon - bottom right corner for videos only - consistent pill style */}
        {currentItem?.type === 'video' && (
          <div className="absolute bottom-3 right-3 z-20 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center pointer-events-none">
            <Play className="w-3.5 h-3.5 text-white fill-white" />
          </div>
        )}

        {/* Soundtrack strip - centered bottom when music is selected (shows for whole post) */}
        {activeMusic && (
          <div className="absolute bottom-[8px] left-1/2 -translate-x-1/2 z-20 max-w-[200px]">
            <SoundtrackStrip 
              music={activeMusic as { trackId: string; title: string; artist?: string; r2Key?: string; url?: string; startAt?: number; volume?: number }}
              variant="preview"
            />
          </div>
        )}

        {/* Navigation dots - 12px above bottom, clubhouse-style subdued colors */}
        <MediaNavigationDots
          mediaCount={media.length}
          currentIndex={activeIndex}
          onJump={handleDotJump}
          bottomOffset={12}
          className="z-20"
          activeColor="bg-white/50"
          inactiveColor="bg-white/25"
        />
      </div>

    </motion.div>
  );
}
