// MediaPickerScreen — Step 1: File selection + validation + multi-select
// Native file input with validation, multi-select order badges

import React, { useCallback, useRef, useState } from 'react';
import { Camera, Image as ImageIcon, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { StudioHeader } from '../components/StudioHeader';
import { usePostStudioContext } from '../usePostStudio';
import { validateMediaFile, POST_LIMITS, ALLOWED_VIDEO_TYPES, ALLOWED_IMAGE_TYPES } from '../constants';
import type { StudioMediaItem } from '../types';

/** Generate a video poster thumbnail from a file */
async function generatePoster(file: File): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    const url = URL.createObjectURL(file);
    video.src = url;
    video.onloadeddata = () => { video.currentTime = 0.1; };
    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    video.onerror = () => { URL.revokeObjectURL(url); resolve(''); };
  });
}

/** Get video duration from a file */
async function getVideoDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    const url = URL.createObjectURL(file);
    video.src = url;
    video.onloadedmetadata = () => {
      resolve(isFinite(video.duration) ? video.duration : null);
      URL.revokeObjectURL(url);
    };
    video.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
  });
}

/** Get image dimensions from a file */
async function getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => { resolve({ width: img.naturalWidth, height: img.naturalHeight }); URL.revokeObjectURL(url); };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

/** Convert files to StudioMediaItems with validation */
async function filesToMediaItems(files: File[]): Promise<StudioMediaItem[]> {
  const items: StudioMediaItem[] = [];
  for (const file of files) {
    const isVideo = file.type.startsWith('video/');
    let duration: number | null = null;
    if (isVideo) { duration = await getVideoDuration(file); }
    const validation = validateMediaFile(file, duration ?? undefined);
    if (!validation.valid) { toast.error(validation.error ?? `Invalid file: ${file.name}`); continue; }
    const previewUrl = URL.createObjectURL(file);
    if (isVideo) {
      const thumbnailUrl = await generatePoster(file);
      items.push({ id: crypto.randomUUID(), file, mediaType: 'video', previewUrl, thumbnailUrl: thumbnailUrl || undefined, duration, trimStart: 0, trimEnd: duration, posterTimestamp: 0, posterPreviewUrl: null, width: null, height: null, validationError: null });
    } else {
      const dims = await getImageDimensions(file);
      items.push({ id: crypto.randomUUID(), file, mediaType: 'image', previewUrl, duration: null, trimStart: 0, trimEnd: null, posterTimestamp: 0, posterPreviewUrl: null, width: dims?.width ?? null, height: dims?.height ?? null, validationError: null });
    }
  }
  return items;
}

export function MediaPickerScreen() {
  const { state, addMedia, setStep, openPanel } = usePostStudioContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const hasMedia = state.mediaItems.length > 0;
  const mediaCount = state.mediaItems.length;

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = e.target.files;
      if (!fileList || fileList.length === 0) return;
      const files = Array.from(fileList);
      const remaining = POST_LIMITS.MAX_MEDIA_COUNT - state.mediaItems.length;
      if (files.length > remaining) {
        toast.error(`You can add ${remaining} more item${remaining !== 1 ? 's' : ''} (max ${POST_LIMITS.MAX_MEDIA_COUNT})`);
      }
      const toProcess = files.slice(0, Math.max(0, remaining));
      if (toProcess.length === 0) return;
      setIsProcessing(true);
      try {
        const items = await filesToMediaItems(toProcess);
        if (items.length > 0) addMedia(items);
      } catch (err) {
        console.error('[MediaPicker] Failed to process files:', err);
        toast.error('Failed to process some files');
      } finally {
        setIsProcessing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [state.mediaItems.length, addMedia]
  );

  const acceptTypes = [...ALLOWED_VIDEO_TYPES, ...ALLOWED_IMAGE_TYPES].join(',');

  return (
    <div className="flex-1 flex flex-col bg-clbhouzBg">
      <StudioHeader
        title="New Post"
        step="MEDIA_PICKER"
        rightAction={
          hasMedia
            ? { label: `Next (${mediaCount})`, onClick: () => setStep('COMPOSER'), variant: 'primary' }
            : undefined
        }
      />

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept={acceptTypes} multiple onChange={handleFileSelect} className="hidden" />

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
        {/* Selected media preview grid */}
        {hasMedia && (
          <div className="w-full max-w-sm">
            <div className="grid grid-cols-3 gap-2">
              <AnimatePresence>
                {state.mediaItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="relative aspect-square rounded-xl overflow-hidden bg-muted"
                  >
                    <img
                      src={item.thumbnailUrl || item.previewUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    {/* Order badge */}
                    <div className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-primary-foreground text-xs font-bold">{index + 1}</span>
                    </div>
                    {/* Video indicator */}
                    {item.mediaType === 'video' && (
                      <div className="absolute bottom-1.5 right-1.5 bg-black/60 rounded px-1.5 py-0.5">
                        <span className="text-white text-[10px] font-medium">
                          {item.duration ? formatTime(item.duration) : 'Video'}
                        </span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!hasMedia && (
          <div className="text-center space-y-3">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto">
              <Camera className="w-8 h-8 text-primary" />
            </div>
            <p className="text-foreground text-xl font-bold">Share a moment</p>
            <p className="text-muted-foreground text-sm max-w-[240px] text-center mx-auto">
              Select photos or videos from your library
            </p>
          </div>
        )}

        {/* Processing indicator */}
        {isProcessing && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            Processing...
          </div>
        )}
      </div>

      {/* Bottom action row */}
      <div className="flex items-center justify-around py-4 px-6 bg-background border-t border-border/50 shrink-0">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center gap-1 min-w-[60px] min-h-[44px]"
          disabled={isProcessing}
        >
          <ImageIcon className="w-6 h-6 text-primary" />
          <span className="text-xs text-primary font-medium">Gallery</span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-14 h-14 rounded-full bg-primary flex items-center justify-center min-h-[44px] shadow-[0_4px_16px_rgba(245,158,11,0.35)]"
          disabled={isProcessing}
        >
          <Camera className="w-6 h-6 text-primary-foreground" />
        </button>

        <button
          onClick={() => openPanel('drafts')}
          className="flex flex-col items-center gap-1 min-w-[60px] min-h-[44px]"
        >
          <FileText className="w-6 h-6 text-primary" />
          <span className="text-xs text-primary font-medium">Drafts</span>
        </button>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
