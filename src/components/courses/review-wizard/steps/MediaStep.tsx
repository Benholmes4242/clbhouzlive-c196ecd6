/**
 * Step 3: Add Photos & Videos
 * Features visual progress bars, retry buttons, counter pill, and gradient overlay
 */

import React, { useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Camera, Loader2, Check, AlertCircle, Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { ReviewMediaItem } from '../types';

interface MediaStepProps {
  media: ReviewMediaItem[];
  coverMediaId: string | null;
  onAddImages: (files: File[]) => void;
  onAddVideo: (file: File) => void;
  onRemoveMedia: (id: string) => void;
  onSetCover: (id: string) => void;
  onRetryMedia?: (id: string) => void;
}

const MAX_MEDIA_ITEMS = 6;

export function MediaStep({
  media,
  coverMediaId,
  onAddImages,
  onAddVideo,
  onRemoveMedia,
  onSetCover,
  onRetryMedia = () => {},
}: MediaStepProps) {
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleMediaSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = MAX_MEDIA_ITEMS - media.length;
    const filesToProcess = files.slice(0, remainingSlots);

    // Separate images and videos
    const imageFiles: File[] = [];
    const videoFiles: File[] = [];

    filesToProcess.forEach(file => {
      if (file.type.startsWith('video/')) {
        videoFiles.push(file);
      } else if (file.type.startsWith('image/')) {
        imageFiles.push(file);
      }
    });

    // Add images
    if (imageFiles.length > 0) {
      onAddImages(imageFiles);
    }

    // Add videos (one at a time)
    videoFiles.forEach(video => {
      onAddVideo(video);
    });

    // Reset input
    if (mediaInputRef.current) {
      mediaInputRef.current.value = '';
    }
  }, [media.length, onAddImages, onAddVideo]);

  const canAddMore = media.length < MAX_MEDIA_ITEMS;
  
  // Calculate counts - with upload-on-submit pattern, pending files are just "selected" not "uploading"
  // Only show "failed" status for items that actually failed (not pending selection)
  const failedCount = media.filter(m => m.status === 'failed').length;
  const selectedCount = media.filter(m => m.status === 'pending' || m.status === 'existing').length;

  // Handle thumbnail click to update active index
  const handleThumbnailClick = (id: string, index: number) => {
    setActiveIndex(index);
    onSetCover(id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col min-h-0 overflow-hidden pt-6"
      style={{ gap: 'var(--wizard-spacing-md)' }}
    >
      {/* Only show header text when no media is added */}
      {media.length === 0 && (
        <div className="text-center shrink-0 px-4">
          <h2 className="text-lg font-semibold text-foreground">
            Add photos & videos
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Show off the course with up to {MAX_MEDIA_ITEMS} media items
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Maximum 6 items</p>
        </div>
      )}

      {/* Status info - show selected count, not uploading (files upload on submit) */}
      {failedCount > 0 && (
        <div className="bg-destructive/10 rounded-lg px-3 py-2 flex items-center gap-2 mx-4">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="text-sm text-destructive font-medium">
            {failedCount} upload{failedCount === 1 ? '' : 's'} failed
          </span>
        </div>
      )}

      {/* Hidden file input for images and videos */}
      <input
        ref={mediaInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handleMediaSelect}
        className="hidden"
      />

      {/* Media grid */}
      {media.length > 0 ? (
        <div className="space-y-3">
          {/* Large preview of selected cover */}
          {coverMediaId && (
            <div className="relative mx-4">
              <MediaPreview
                item={media.find(m => m.id === coverMediaId)}
                isCover
              />
              {/* Media counter pill */}
              {media.length > 1 && (
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full font-medium z-10">
                  {activeIndex + 1}/{media.length}
                </div>
              )}
              {/* Bottom gradient fade */}
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent pointer-events-none rounded-b-xl" />
            </div>
          )}

          {/* Thumbnail strip */}
          <div className="mx-4">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide w-full py-1">
              <AnimatePresence mode="popLayout">
                {media.map((item, index) => (
                  <MediaThumbnail
                    key={item.id}
                    item={item}
                    isCover={item.id === coverMediaId}
                    onClick={() => handleThumbnailClick(item.id, index)}
                    onRemove={() => onRemoveMedia(item.id)}
                    onRetry={onRetryMedia ? () => onRetryMedia(item.id) : undefined}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center px-4">
            Tap a thumbnail to set it as cover • {media.length}/{MAX_MEDIA_ITEMS} items
            {media.length >= MAX_MEDIA_ITEMS && (
              <span className="text-amber-600 ml-1">• Maximum reached</span>
            )}
          </p>
        </div>
      ) : (
        /* Empty state - Card pattern */
        <div className="mx-4 flex flex-col items-center justify-center py-12 bg-white border border-border/60 rounded-2xl shadow-sm">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
            <Camera className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-base font-medium text-foreground mb-1">Add photos & videos</p>
          <p className="text-sm text-muted-foreground mb-4">
            Show off the course views and conditions
          </p>
          <Button
            variant="secondary"
            size="lg"
            className="gap-2 bg-muted hover:bg-muted/80 border-0 transition-all duration-200"
            onClick={() => mediaInputRef.current?.click()}
          >
            <Plus className="h-5 w-5" />
            Add Media
          </Button>
        </div>
      )}

      {/* Add media button when already has some media */}
      {media.length > 0 && (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            size="lg"
            className={cn(
              "gap-2 bg-muted hover:bg-muted/80 border-0 transition-all duration-200",
              !canAddMore && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => canAddMore && mediaInputRef.current?.click()}
            disabled={!canAddMore}
          >
            <Plus className="h-5 w-5" />
            {canAddMore ? 'Add Media' : 'Maximum Reached'}
          </Button>
        </div>
      )}
    </motion.div>
  );
}

interface MediaPreviewProps {
  item: ReviewMediaItem | undefined;
  isCover: boolean;
}

function MediaPreview({ item, isCover }: MediaPreviewProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);

  if (!item) return null;

  const isVideo = item.type === 'video';
  const isUploading = item.status === 'uploading' || item.status === 'queued';
  const progress = item.progress || { loaded: 0, total: 0, percent: 0 };

  const handleVideoTap = () => {
    if (!videoRef.current || isUploading) return;
    
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
  };

  // Use posterUrl for videos, previewUrl for images
  const displayUrl = isVideo 
    ? (item.posterUrl || item.previewUrl) 
    : item.previewUrl;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative aspect-video overflow-hidden bg-muted rounded-xl"
    >
      {isVideo && !isUploading ? (
        <div 
          className="w-full h-full cursor-pointer"
          onClick={handleVideoTap}
        >
          <video
            ref={videoRef}
            src={item.uploadedUrl || undefined}
            poster={item.posterUrl || item.previewUrl || undefined}
            className="w-full h-full object-cover"
            playsInline
            onEnded={handleVideoEnded}
          />
          {/* Instagram-style play icon overlay - show when paused */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center transition-transform hover:scale-105">
                <Play className="h-8 w-8 text-white ml-1" fill="white" />
              </div>
            </div>
          )}
        </div>
      ) : (
        <img
          src={displayUrl}
          alt="Cover preview"
          className="w-full h-full object-cover"
        />
      )}

      {/* Upload progress overlay */}
      {isUploading && (
        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 text-white animate-spin" />
          <div className="w-3/4 max-w-[200px]">
            <Progress value={progress.percent} className="h-2" />
            <p className="text-white text-xs text-center mt-1">
              {progress.percent}%
              {progress.eta && progress.eta < 60 && (
                <span className="ml-1 opacity-75">
                  • {Math.ceil(progress.eta)}s left
                </span>
              )}
            </p>
          </div>
        </div>
      )}
      
      {/* Cover badge - matches upload banner style: bg-primary/10 with text-primary */}
      {isCover && !isUploading && (
        <div 
          className="absolute top-2 left-2 text-primary text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 bg-primary/10 backdrop-blur-sm"
        >
          <Check className="h-3 w-3" strokeWidth={2.5} />
          Cover
        </div>
      )}
    </motion.div>
  );
}

interface MediaThumbnailProps {
  item: ReviewMediaItem;
  isCover: boolean;
  onClick: () => void;
  onRemove: () => void;
  onRetry?: () => void;
}

function MediaThumbnail({ item, isCover, onClick, onRemove, onRetry }: MediaThumbnailProps) {
  const isUploading = item.status === 'uploading' || item.status === 'queued';
  const isFailed = item.status === 'failed';
  const isVideo = item.type === 'video';
  const progress = item.progress || { loaded: 0, total: 0, percent: 0 };

  // Use posterUrl for videos, previewUrl for images
  const displayUrl = isVideo 
    ? (item.posterUrl || item.previewUrl) 
    : item.previewUrl;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={cn(
        "relative flex-shrink-0 cursor-pointer w-16 h-16 rounded-xl overflow-hidden transition-all",
        isCover ? "ring-2 ring-primary scale-[1.02]" : "opacity-70 hover:opacity-100",
        isFailed && "ring-2 ring-destructive"
      )}
      onClick={onClick}
    >
      <img
        src={displayUrl || ''}
        alt=""
        className="w-full h-full object-cover"
      />

      {/* Progress bar overlay for uploading */}
      {isUploading && (
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
          <div className="w-10 px-1">
            <Progress value={progress.percent} className="h-1" />
          </div>
          <span className="text-white text-[10px] mt-1 font-medium">
            {progress.percent}%
          </span>
        </div>
      )}

      {/* Failed state with retry */}
      {isFailed && (
        <div className="absolute inset-0 bg-destructive/80 flex flex-col items-center justify-center">
          <AlertCircle className="h-4 w-4 text-white mb-1" />
          {onRetry && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRetry();
              }}
              className="flex items-center gap-0.5 text-white text-[10px] font-medium"
            >
              <RotateCcw className="h-3 w-3" />
              Retry
            </button>
          )}
        </div>
      )}

      {/* Video indicator - circular, same size as remove button, bottom left */}
      {isVideo && !isUploading && !isFailed && (
        <div className="absolute bottom-1 left-1 w-4 h-4 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center z-20">
          <Play className="h-2 w-2 text-white ml-0.5" fill="white" />
        </div>
      )}

      {/* Cover indicator dot */}
      {isCover && !isUploading && !isFailed && (
        <span 
          className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-white shadow-sm z-30"
          aria-label="Cover image"
        />
      )}

      {/* Remove button - bottom right */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-red-500/80 backdrop-blur-sm hover:bg-red-500 flex items-center justify-center z-20 transition-colors"
        aria-label="Remove media"
      >
        <X className="w-2 h-2 text-white" />
      </button>
    </motion.div>
  );
}
