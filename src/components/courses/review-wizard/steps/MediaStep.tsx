/**
 * Step 3: Add Photos & Videos
 */

import React, { useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Video, X, Image as ImageIcon, Loader2, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ReviewMediaItem } from '../types';

interface MediaStepProps {
  media: ReviewMediaItem[];
  coverMediaId: string | null;
  onAddImages: (files: File[]) => void;
  onAddVideo: (file: File) => void;
  onRemoveMedia: (id: string) => void;
  onSetCover: (id: string) => void;
}

const MAX_MEDIA_ITEMS = 6;
const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/png,image/webp,image/heic';
const ACCEPTED_VIDEO_TYPES = 'video/mp4,video/quicktime,video/webm';

export function MediaStep({
  media,
  coverMediaId,
  onAddImages,
  onAddVideo,
  onRemoveMedia,
  onSetCover,
}: MediaStepProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const remainingSlots = MAX_MEDIA_ITEMS - media.length;
      onAddImages(files.slice(0, remainingSlots));
    }
    // Reset input
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  }, [media.length, onAddImages]);

  const handleVideoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAddVideo(file);
    }
    // Reset input
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  }, [onAddVideo]);

  const canAddMore = media.length < MAX_MEDIA_ITEMS;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col gap-6 p-4"
    >
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground">
          Add photos & videos
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Show off the course with up to {MAX_MEDIA_ITEMS} media items
        </p>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES}
        multiple
        onChange={handleImageSelect}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        type="file"
        accept={ACCEPTED_VIDEO_TYPES}
        onChange={handleVideoSelect}
        className="hidden"
      />

      {/* Add buttons */}
      {canAddMore && (
        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={() => imageInputRef.current?.click()}
            className="gap-2 flex-1 max-w-[150px]"
          >
            <Camera className="h-5 w-5" />
            Photos
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => videoInputRef.current?.click()}
            className="gap-2 flex-1 max-w-[150px]"
          >
            <Video className="h-5 w-5" />
            Video
          </Button>
        </div>
      )}

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
          <div className="flex gap-2 overflow-x-auto pb-2">
            <AnimatePresence mode="popLayout">
              {media.map((item) => (
                <MediaThumbnail
                  key={item.id}
                  item={item}
                  isCover={item.id === coverMediaId}
                  onClick={() => onSetCover(item.id)}
                  onRemove={() => onRemoveMedia(item.id)}
                />
              ))}
            </AnimatePresence>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Tap a thumbnail to set it as cover • {media.length}/{MAX_MEDIA_ITEMS} items
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-muted rounded-xl">
          <ImageIcon className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No media added yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            This step is optional
          </p>
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
  if (!item) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative aspect-video rounded-xl overflow-hidden bg-muted"
    >
      {item.type === 'video' ? (
        <video
          src={item.uploadedUrl || undefined}
          poster={item.posterUrl || undefined}
          className="w-full h-full object-cover"
          controls
        />
      ) : (
        <img
          src={item.previewUrl}
          alt="Cover preview"
          className="w-full h-full object-cover"
        />
      )}
      
      {isCover && (
        <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium">
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
}

function MediaThumbnail({ item, isCover, onClick, onRemove }: MediaThumbnailProps) {
  const isUploading = item.status === 'uploading';
  const isFailed = item.status === 'failed';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={cn(
        "relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden cursor-pointer",
        "ring-2 transition-all",
        isCover ? "ring-primary ring-offset-2" : "ring-transparent",
        isFailed && "ring-destructive"
      )}
      onClick={onClick}
    >
      <img
        src={item.previewUrl || item.posterUrl || ''}
        alt=""
        className="w-full h-full object-cover"
      />

      {/* Status overlay */}
      {isUploading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <Loader2 className="h-5 w-5 text-white animate-spin" />
        </div>
      )}

      {isFailed && (
        <div className="absolute inset-0 bg-destructive/50 flex items-center justify-center">
          <AlertCircle className="h-5 w-5 text-white" />
        </div>
      )}

      {/* Video indicator */}
      {item.type === 'video' && !isUploading && (
        <div className="absolute bottom-1 left-1 bg-black/60 rounded px-1">
          <Video className="h-3 w-3 text-white" />
        </div>
      )}

      {/* Cover badge */}
      {isCover && !isUploading && (
        <div className="absolute top-1 left-1 bg-primary rounded-full p-0.5">
          <Check className="h-3 w-3 text-primary-foreground" />
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
    </motion.div>
  );
}
