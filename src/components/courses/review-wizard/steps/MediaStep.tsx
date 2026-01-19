/**
 * Step 3: Add Photos & Videos
 * Merged upload button with dropdown, buttons below preview
 */

import React, { useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Image as ImageIcon, Loader2, Check, AlertCircle, Play, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  const [dropdownOpen, setDropdownOpen] = useState(false);

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
      className="flex flex-col gap-6 p-4 overflow-x-hidden"
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
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
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

      {/* Merged add button (below preview) */}
      {canAddMore && (
        <div className="flex justify-center">
          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="lg"
                className="gap-2"
              >
                <Plus className="h-5 w-5" />
                Add Media
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              <DropdownMenuItem 
                onClick={() => {
                  setDropdownOpen(false);
                  imageInputRef.current?.click();
                }}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Add Photos
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  setDropdownOpen(false);
                  videoInputRef.current?.click();
                }}
              >
                <Play className="h-4 w-4 mr-2" />
                Add Video
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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

  const isVideo = item.type === 'video';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative aspect-video rounded-xl overflow-hidden bg-muted"
    >
      {isVideo ? (
        <>
          <video
            src={item.uploadedUrl || undefined}
            poster={item.posterUrl || undefined}
            className="w-full h-full object-cover"
            controls
          />
          {/* Play icon overlay when not playing */}
          {!item.uploadedUrl && item.posterUrl && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                <Play className="h-6 w-6 text-white ml-0.5" fill="white" />
              </div>
            </div>
          )}
        </>
      ) : (
        <img
          src={item.previewUrl}
          alt="Cover preview"
          className="w-full h-full object-cover"
        />
      )}
      
      {/* Glassy orange cover badge */}
      {isCover && (
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
}

function MediaThumbnail({ item, isCover, onClick, onRemove }: MediaThumbnailProps) {
  const isUploading = item.status === 'uploading';
  const isFailed = item.status === 'failed';
  const isVideo = item.type === 'video';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={cn(
        "relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden cursor-pointer",
        "transition-all",
        // Glassy orange ring for cover
        isCover && "ring-2 ring-offset-2",
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

      {/* Video indicator with play icon */}
      {isVideo && !isUploading && (
        <div className="absolute bottom-1 left-1 bg-black/60 rounded px-1.5 py-0.5 flex items-center gap-1">
          <Play className="h-3 w-3 text-white" fill="white" />
        </div>
      )}

      {/* Glassy orange cover badge */}
      {isCover && !isUploading && (
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
    </motion.div>
  );
}
