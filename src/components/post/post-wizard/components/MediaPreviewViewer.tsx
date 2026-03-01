import { useState, useCallback, useRef, useEffect } from 'react';
import { X, Wand2, Play, Pause, Volume2, VolumeX, Scissors, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { OrderedMediaItem } from '../types';
import type { StudioEdits } from '@/types/studio';
import { getFilterClass } from '@/utils/studioFilters';
import { getPixelLayerStyle, getCropWrapperClass } from '@/utils/studioEdit';
import TextOverlayRenderer from '@/components/studio/TextOverlayRenderer';
import { VideoScrubber } from '@/components/video/VideoScrubber';
import { cn } from '@/lib/utils';
import { useGlobalAudio } from '@/contexts/GlobalAudioContext';
import { MediaRuntime } from '@/media/runtime/MediaRuntime';
import { VideoTrimmer } from './VideoTrimmer';
import { PosterFramePicker } from './PosterFramePicker';
import { MediaNavigationDots } from '@/components/posts/user-post/overlays/MediaNavigationDots';

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

interface MediaPreviewViewerProps {
  items: OrderedMediaItem[];
  initialIndex: number;
  onClose: () => void;
  onStudio?: (itemId: string) => void;
  onSetCover?: (index: number) => void;
  coverIndex: number;
  studioEditsByMediaId?: Record<string, StudioEdits>;
  /** Hide the studio wand button (default: true) */
  showStudio?: boolean;
  /** Callback when trim range changes */
  onTrimChange?: (mediaIndex: number, trimStart: number | null, trimEnd: number | null) => void;
  /** Callback when poster timestamp changes */
  onPosterTimestampChange?: (mediaIndex: number, timestamp: number | null) => void;
}

export function MediaPreviewViewer({ items, initialIndex, onClose, onStudio, onSetCover, coverIndex, studioEditsByMediaId, showStudio = true, onTrimChange, onPosterTimestampChange }: MediaPreviewViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchStartTime = useRef<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [showTrimmer, setShowTrimmer] = useState(false);
  const [showPosterPicker, setShowPosterPicker] = useState(false);

  // Fix 4: Use GlobalAudioContext for persistent mute state
  const { isGloballyMuted, toggleGlobalMute } = useGlobalAudio();

  // Time readout state for video scrub bar
  const [videoTime, setVideoTime] = useState<{ current: number; duration: number }>({ current: 0, duration: 0 });

  // Fix 5: Pause all feed videos when viewer opens
  useEffect(() => {
    MediaRuntime.pauseAll();
  }, []);

  const item = items[currentIndex];
  const isCover = currentIndex === coverIndex;

  // Pause non-active videos & play active one on slide change
  useEffect(() => {
    setIsPlaying(true);
    setShowPlayIcon(false);
    setShowTrimmer(false);
    setShowPosterPicker(false);

    // Pause all non-active videos
    const allVideos = document.querySelectorAll('.preview-viewer-slide video');
    allVideos.forEach(v => {
      const video = v as HTMLVideoElement;
      if (video !== videoRef.current) {
        video.pause();
      }
    });

    // Play the active video
    if (videoRef.current && videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
    }
  }, [currentIndex]);

  // Release decoder on viewer close
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
      }
    };
  }, []);

  // Track video time for readout
  useEffect(() => {
    const video = videoRef.current;
    if (!video || items[currentIndex]?.type !== 'video') {
      setVideoTime({ current: 0, duration: 0 });
      return;
    }
    const handleTimeUpdate = () => {
      setVideoTime({ current: video.currentTime, duration: video.duration || 0 });
    };
    const handleLoadedMetadata = () => {
      setVideoTime(prev => ({ ...prev, duration: video.duration || 0 }));
    };
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [currentIndex, items]);

  const goTo = useCallback((idx: number) => {
    // Pause current video before switching
    videoRef.current?.pause();
    setCurrentIndex(Math.max(0, Math.min(items.length - 1, idx)));
  }, [items.length]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    touchStartTime.current = Date.now();
    setIsSwiping(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    // If vertical movement dominates, don't track horizontal swipe
    if (Math.abs(dy) > Math.abs(dx) * 1.5) return;
    setSwipeOffset(dx);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;
    setIsSwiping(false);
    setSwipeOffset(0);

    // Tap detection (not a swipe)
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;

    // Swipe down to close
    if (dy > 100 && Math.abs(dx) < 80) {
      onClose();
      return;
    }

    // Fix 6: Velocity-based swipe detection
    const elapsed = Date.now() - touchStartTime.current;
    const velocityX = Math.abs(dx) / Math.max(elapsed, 1); // px per ms
    const isHorizontalSwipe =
      (velocityX > 0.3 && Math.abs(dx) > 20) || // fast flick
      Math.abs(dx) > 50; // slow drag (existing threshold)

    if (isHorizontalSwipe) {
      if (dx < 0 && currentIndex < items.length - 1) {
        goTo(currentIndex + 1);
      } else if (dx > 0 && currentIndex > 0) {
        goTo(currentIndex - 1);
      }
    }
  }, [currentIndex, items.length, goTo, onClose]);

  const handleStudio = useCallback(() => {
    if (item) onStudio(item.id);
  }, [item, onStudio]);

  const togglePlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
    setShowPlayIcon(true);
    setTimeout(() => setShowPlayIcon(false), 600);
  }, []);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleGlobalMute();
    // iOS requires play() within user gesture when unmuting
    if (videoRef.current && isGloballyMuted) {
      videoRef.current.muted = false;
      videoRef.current.play().catch(() => {});
    }
  }, [toggleGlobalMute, isGloballyMuted]);

  // Fix React muted attribute bug — React doesn't update video.muted after mount
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isGloballyMuted;
    }
  }, [isGloballyMuted]);

  if (!item) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[10002] flex flex-col bg-black"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* Solid black nav bar — matches Studio pattern */}
      <div
        className="flex-shrink-0"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 44px)' }}
      >
        <div className="h-11 flex items-center justify-between px-4">
          <button
            onClick={onClose}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
            className="w-11 h-11 rounded-full flex items-center justify-center active:bg-white/10 transition-colors"
            aria-label="Close preview"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-2">
            {items.length > 1 && !isCover && (
              <button
                onClick={() => onSetCover?.(currentIndex)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold text-white/90 active:bg-white/10 transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
              >
                Set as Cover
              </button>
            )}
            {item.type === 'video' && (
              <>
                <button
                  onClick={toggleMute}
                  onTouchStart={(e) => e.stopPropagation()}
                  onTouchEnd={(e) => e.stopPropagation()}
                  className="w-9 h-9 rounded-full flex items-center justify-center active:bg-white/10 transition-colors"
                  aria-label={isGloballyMuted ? 'Unmute' : 'Mute'}
                >
                  {isGloballyMuted ? (
                    <VolumeX className="w-4 h-4 text-white" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-white" />
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowPosterPicker(prev => !prev);
                    setShowTrimmer(false);
                  }}
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center transition-colors',
                    showPosterPicker ? 'bg-primary/20' : 'active:bg-white/10'
                  )}
                  aria-label="Choose cover frame"
                >
                  <ImageIcon className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={() => {
                    setShowTrimmer(prev => !prev);
                    setShowPosterPicker(false);
                  }}
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center transition-colors',
                    showTrimmer ? 'bg-primary/20' : 'active:bg-white/10'
                  )}
                  aria-label="Trim video"
                >
                  <Scissors className="w-4 h-4 text-white" />
                </button>
              </>
            )}
            {showStudio && (
              <button
                onClick={handleStudio}
                className="w-9 h-9 rounded-full flex items-center justify-center active:bg-white/10 transition-colors"
                aria-label="Open studio"
              >
                <Wand2 className="w-4 h-4 text-white" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Media canvas */}
      <div
        className="flex-1 relative overflow-hidden min-h-0"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {[-1, 0, 1].map(offset => {
          const idx = currentIndex + offset;
          if (idx < 0 || idx >= items.length) return null;

          const slideItem = items[idx];
          const isActive = offset === 0;
          const slideEdits = studioEditsByMediaId?.[slideItem.id];
          const slideFilterClass = slideEdits?.filter && slideEdits.filter !== 'normal'
            ? getFilterClass(slideEdits.filter)
            : '';
          const slidePixelStyle = getPixelLayerStyle(slideEdits);
          const slideCropClass = getCropWrapperClass(slideEdits?.crop);

          return (
            <div
              key={slideItem.id}
              className="absolute inset-0 flex items-center justify-center preview-viewer-slide"
              style={{
                transform: `translateX(calc(${offset * 100}% + ${isSwiping ? swipeOffset : 0}px))`,
                transition: isSwiping ? 'none' : 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                willChange: 'transform',
                zIndex: isActive ? 2 : 1,
              }}
            >
              <div className={cn('relative w-full h-full flex items-center justify-center', slideCropClass)}>
                {slideItem.type === 'video' ? (
                  <div
                    className="relative w-full h-full flex items-center justify-center"
                    onClick={isActive ? togglePlayback : undefined}
                  >
                    <video
                      ref={isActive ? videoRef : undefined}
                      src={slideItem.previewUrl}
                      poster={slideItem.thumbnailUrl}
                      preload="auto"
                      autoPlay={isActive}
                      loop
                      playsInline
                      muted={!isActive || isGloballyMuted}
                      className={cn('max-w-full max-h-full object-contain', slideFilterClass)}
                      style={slidePixelStyle}
                      onPlay={isActive ? () => setIsPlaying(true) : undefined}
                      onPause={isActive ? () => setIsPlaying(false) : undefined}
                    />

                    {/* Tap-to-play/pause icon — only on active slide */}
                    {isActive && (
                      <AnimatePresence>
                        {showPlayIcon && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0 flex items-center justify-center pointer-events-none"
                          >
                            <div
                              className="w-16 h-16 rounded-full flex items-center justify-center"
                              style={{
                                background: 'rgba(0,0,0,0.5)',
                                backdropFilter: 'blur(12px)',
                              }}
                            >
                              {isPlaying ? (
                                <Pause className="w-7 h-7 text-white" fill="white" />
                              ) : (
                                <Play className="w-7 h-7 text-white ml-1" fill="white" />
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}


                    {/* Text overlays — only on active slide */}
                    {isActive && slideEdits?.textOverlays && slideEdits.textOverlays.length > 0 && (
                      <TextOverlayRenderer
                        textOverlays={slideEdits.textOverlays}
                        isEditable={false}
                        safeAreaContext="feed"
                      />
                    )}
                  </div>
                ) : (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img
                      src={slideItem.previewUrl}
                      alt=""
                      className={cn('max-w-full max-h-full object-contain', slideFilterClass)}
                      style={slidePixelStyle}
                      draggable={false}
                    />

                    {/* Text overlays — only on active slide */}
                    {isActive && slideEdits?.textOverlays && slideEdits.textOverlays.length > 0 && (
                      <TextOverlayRenderer
                        textOverlays={slideEdits.textOverlays}
                        isEditable={false}
                        safeAreaContext="feed"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Video trimmer — between video and scrubber */}
      {item.type === 'video' && showTrimmer && (
        <div
          className="flex-shrink-0 overflow-y-auto"
          style={{ maxHeight: '35vh' }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <VideoTrimmer
            videoUrl={item.previewUrl}
            duration={item.duration || 0}
            onTrimChange={(trimStart, trimEnd) => {
              onTrimChange?.(currentIndex, trimStart, trimEnd);
            }}
            initialStart={item.trimStart ?? undefined}
            initialEnd={item.trimEnd ?? undefined}
          />
        </div>
      )}

      {/* Poster frame picker — mutually exclusive with trimmer */}
      {item.type === 'video' && showPosterPicker && (
        <div
          className="flex-shrink-0 overflow-y-auto"
          style={{ maxHeight: '35vh' }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <PosterFramePicker
            videoUrl={item.previewUrl}
            duration={item.duration || 0}
            onSelect={(timestamp) => {
              onPosterTimestampChange?.(currentIndex, timestamp);
            }}
            initialTime={item.posterTimestamp ?? undefined}
            trimStart={item.trimStart}
            trimEnd={item.trimEnd}
          />
        </div>
      )}

      {/* Bottom bar — matches top nav bar pattern */}
      <div className="flex-shrink-0 bg-black">
        {/* Video scrubber + time readout */}
        {item.type === 'video' && (
          <div
            className="flex items-center gap-3 px-4 pt-2"
            key={`scrubber-${currentIndex}`}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <div className="flex-1 relative" style={{ height: 3 }}>
              <VideoScrubber
                videoEl={videoRef.current}
                variant="wizard"
                height={3}
              />
            </div>
            <span
              className="text-[11px] font-medium tabular-nums text-white/70 flex-shrink-0"
              style={{ minWidth: '70px', textAlign: 'right' }}
            >
              {formatTime(videoTime.current)} / {formatTime(videoTime.duration)}
            </span>
          </div>
        )}

        {/* Pagination dots — clubhouse-style */}
        {items.length > 1 && (
          <div
            className="relative h-8"
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <MediaNavigationDots
              mediaCount={items.length}
              currentIndex={currentIndex}
              onJump={goTo}
              bottomOffset={8}
              activeColor="bg-primary"
              inactiveColor="bg-primary/30"
            />
          </div>
        )}

        {/* Bottom spacer when no dots */}
        {items.length <= 1 && <div className="h-3" />}

        {/* Bottom safe area bar */}
        <div className="h-11" />
      </div>
    </motion.div>
  );
}
