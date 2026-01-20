/**
 * Step 3: Add Photos & Videos
 * Features visual progress bars, retry buttons, and non-blocking upload UX
 */

import React, { useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Image as ImageIcon, Loader2, Check, AlertCircle, Play, RotateCcw } from 'lucide-react';
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
  onRetryMedia,
}: MediaStepProps) {
  const mediaInputRef = useRef<HTMLInputElement>(null);

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
  
  // Calculate overall progress
  const uploadingCount = media.filter(m => m.status === 'uploading' || m.status === 'queued' || m.status === 'pending').length;
  const failedCount = media.filter(m => m.status === 'failed').length;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col min-h-0 overflow-hidden"
      style={{ padding: 'var(--wizard-spacing-md)', gap: 'var(--wizard-spacing-md)' }}
    >
      <div className="text-center shrink-0">
        <h2 className="text-lg font-semibold text-[#1e293b]">
          Add photos & videos
        </h2>
        <p className="text-sm text-[#64748b] mt-0.5">
          Show off the course with up to {MAX_MEDIA_ITEMS} media items
        </p>
      </div>

      {/* Upload status banner */}
      {uploadingCount > 0 && (
        <div className="bg-primary/10 rounded-lg px-3 py-2 flex items-center gap-2">
          <Loader2 className="h-4 w-4 text-primary animate-spin" />
          <span className="text-sm text-primary font-medium">
            Uploading {uploadingCount} {uploadingCount === 1 ? 'file' : 'files'}...
          </span>
        </div>
      )}

      {failedCount > 0 && (
        <div className="bg-destructive/10 rounded-lg px-3 py-2 flex items-center gap-2">
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
        <div className="space-y-4">
          {/* Large preview of selected cover */}
          {coverMediaId && (
            <MediaPreview
              item={media.find(m => m.id === coverMediaId)}
              isCover
            />
          )}

          {/* Thumbnail strip */}
          <div className="flex gap-1 overflow-x-auto pb-2 -mx-4 px-4 -my-1 py-1">
            <AnimatePresence mode="popLayout">
              {media.map((item) => (
                <MediaThumbnail
                  key={item.id}
                  item={item}
                  isCover={item.id === coverMediaId}
                  onClick={() => onSetCover(item.id)}
                  onRemove={() => onRemoveMedia(item.id)}
                  onRetry={onRetryMedia ? () => onRetryMedia(item.id) : undefined}
                />
              ))}
            </AnimatePresence>
          </div>

          <p className="text-xs text-[#64748b] text-center">
            Tap a thumbnail to set it as cover • {media.length}/{MAX_MEDIA_ITEMS} items
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-muted rounded-xl">
          <ImageIcon className="h-12 w-12 text-[#64748b] mb-3" />
          <p className="text-sm text-[#64748b]">No media added yet</p>
          <p className="text-xs text-[#64748b] mt-1">
            This step is optional
          </p>
        </div>
      )}

      {/* Add media button - directly triggers native file picker */}
      {canAddMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="lg"
            className="gap-2"
            onClick={() => mediaInputRef.current?.click()}
          >
            <Plus className="h-5 w-5" />
            Add Media
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
  const isUploading = item.status === 'uploading' || item.status === 'queued' || item.status === 'pending';
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
      className="relative aspect-video rounded-xl overflow-hidden bg-muted"
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
      
      {/* Glassy orange cover badge */}
      {isCover && !isUploading && (
        <div 
          className="absolute top-2 left-2 text-white text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 179, 71, 0.9) 0%, rgba(247, 147, 30, 0.95) 50%, rgba(230, 126, 0, 1) 100%)',
            boxShadow: '0 2px 6px rgba(247, 147, 30, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
          }}
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
  const isUploading = item.status === 'uploading' || item.status === 'queued' || item.status === 'pending';
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
      // Extra padding around the thumbnail to prevent ring clipping
      className="relative flex-shrink-0 p-1"
    >
      <div
        className={cn(
          "relative w-20 h-20 rounded-lg overflow-hidden cursor-pointer",
          "transition-all",
          // Glassy orange ring for cover
          isCover && "ring-2 ring-offset-2 ring-offset-background",
          !isCover && "ring-2 ring-transparent",
          isFailed && "ring-2 ring-destructive"
        )}
        style={
          isCover
            ? {
                // Glassy orange ring
                '--tw-ring-color': 'rgba(247, 147, 30, 0.9)',
                boxShadow: '0 0 0 2px rgba(247, 147, 30, 0.9), 0 2px 8px rgba(247, 147, 30, 0.3)',
              } as React.CSSProperties
            : undefined
        }
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
          <div className="w-14 px-1">
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

      {/* Video indicator with play icon */}
      {isVideo && !isUploading && !isFailed && (
        <div className="absolute bottom-1 left-1 bg-black/60 rounded px-1.5 py-0.5 flex items-center gap-1">
          <Play className="h-3 w-3 text-white" fill="white" />
        </div>
      )}

      {/* Glassy orange cover badge */}
      {isCover && !isUploading && !isFailed && (
        <div 
          className="absolute top-1 left-1 rounded-full p-1"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 179, 71, 0.9) 0%, rgba(247, 147, 30, 0.95) 100%)',
            boxShadow: '0 1px 4px rgba(247, 147, 30, 0.4), inset 0 0.5px 0 rgba(255, 255, 255, 0.3)',
          }}
        >
          <Check className="h-3 w-3 text-white" strokeWidth={2.5} />
        </div>
      )}

      {/* Remove button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 rounded-full p-1 transition-colors"
      >
        <X className="h-3 w-3 text-white" />
      </button>
      </div>
    </motion.div>
  );
}
