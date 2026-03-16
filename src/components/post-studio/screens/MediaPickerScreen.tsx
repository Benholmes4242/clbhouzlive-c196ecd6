// MediaPickerScreen — Step 1: Cinematic entry into the studio
// Dark immersive stage. Golf energy. Not a file picker — a creative launchpad.

import React, { useCallback, useRef, useState } from 'react';
import { Camera, Layers, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { StudioHeader } from '../components/StudioHeader';
import { usePostStudioContext } from '../usePostStudio';
import { validateMediaFile, POST_LIMITS, ALLOWED_VIDEO_TYPES, ALLOWED_IMAGE_TYPES } from '../constants';
import { BG_BASE, AMBER, AMBER_DEEP, AMBER_DIM, AMBER_GHOST, AMBER_GRADIENT, BG_CARD, TEXT_PRIMARY, TEXT_SECONDARY } from '../tokens';
import type { StudioMediaItem } from '../types';

async function generatePoster(file: File): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata'; video.muted = true; video.playsInline = true;
    const url = URL.createObjectURL(file);
    video.src = url;
    video.onloadeddata = () => { video.currentTime = 0.1; };
    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    video.onerror = () => { URL.revokeObjectURL(url); resolve(''); };
  });
}

async function getVideoDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    const url = URL.createObjectURL(file);
    video.src = url;
    video.onloadedmetadata = () => { resolve(isFinite(video.duration) ? video.duration : null); URL.revokeObjectURL(url); };
    video.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
  });
}

async function getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => { resolve({ width: img.naturalWidth, height: img.naturalHeight }); URL.revokeObjectURL(url); };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

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

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function MediaPickerScreen({ onClose }: { onClose?: () => void }) {
  const { state, addMedia, setStep, openPanel } = usePostStudioContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const hasMedia = state.mediaItems.length > 0;
  const mediaCount = state.mediaItems.length;
  const acceptTypes = [...ALLOWED_VIDEO_TYPES, ...ALLOWED_IMAGE_TYPES].join(',');

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
        if (items.length > 0) {
          addMedia(items);
          setTimeout(() => setStep('COMPOSER'), 300);
        }
      } catch (err) {
        console.error('[MediaPicker] Failed to process files:', err);
        toast.error('Failed to process some files');
      } finally {
        setIsProcessing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [state.mediaItems.length, addMedia, setStep]
  );

  return (
    <div className="flex-1 flex flex-col" style={{ background: BG_BASE }}>
      <StudioHeader
        title="New Moment"
        step="MEDIA_PICKER"
        leftAction={
          onClose
            ? { label: '', onClick: onClose, icon: 'close' as const }
            : undefined
        }
        rightAction={
          hasMedia
            ? { label: `Next (${mediaCount})`, onClick: () => setStep('COMPOSER'), variant: 'primary' as const }
            : undefined
        }
      />

      <input ref={fileInputRef} type="file" accept={acceptTypes} multiple onChange={handleFileSelect} className="hidden" />

      <div className="flex-1 flex flex-col">
        {!hasMedia && (
          <div className="flex-1 flex flex-col items-center justify-center px-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative mb-8"
            >
              {/* Dramatic spotlight glow */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(200,135,10,0.13) 0%, transparent 70%)',
                  transform: 'scale(3.5)',
                }}
              />
              {/* Pulsing ring animation */}
              <motion.div
                animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.1, 0.3] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full"
                style={{ border: '1px solid rgba(200,135,10,0.22)' }}
              />
              <div
                className="w-32 h-32 rounded-full flex items-center justify-center relative"
                style={{
                  background: 'linear-gradient(135deg, rgba(200,135,10,0.20) 0%, rgba(200,135,10,0.07) 100%)',
                  border: '1px solid rgba(200,135,10,0.22)',
                  boxShadow: '0 0 24px rgba(200,135,10,0.08), inset 0 1px 0 rgba(255,255,255,0.07)',
                }}
              >
                <Camera className="w-11 h-11" style={{ color: 'rgba(245,158,11,0.90)' }} strokeWidth={1.5} />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-center space-y-2 mb-10"
            >
              <p className="text-[26px] font-bold" style={{ color: TEXT_PRIMARY, letterSpacing: '-0.03em' }}>Share a moment</p>
              <p className="text-sm max-w-[220px] mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.48)' }}>
                Photos, videos, course reviews — your story on the fairway.
              </p>
            </motion.div>

            <AnimatePresence>
              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2.5 text-sm mb-6"
                  style={{ color: AMBER_DIM }}
                >
                  <div
                    className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: 'rgba(232,152,10,0.35)', borderTopColor: 'transparent' }}
                  />
                  Preparing…
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {hasMedia && (
          <div className="flex-1 flex flex-col px-5 pt-5 pb-4">
            <div className="grid grid-cols-3 gap-2 mb-4">
              <AnimatePresence>
                {state.mediaItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.85, opacity: 0 }}
                    transition={{ type: 'spring', damping: 22, stiffness: 380 }}
                    className="relative aspect-square rounded-2xl overflow-hidden"
                    style={{ background: BG_CARD }}
                  >
                    <img src={item.thumbnailUrl || item.previewUrl} alt="" className="w-full h-full object-cover" />
                    <div
                      className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: AMBER_GRADIENT, boxShadow: '0 2px 8px rgba(245,158,11,0.5)' }}
                    >
                      <span className="text-[11px] font-bold text-black">{index + 1}</span>
                    </div>
                    {item.mediaType === 'video' && (
                      <div className="absolute bottom-1.5 right-1.5 flex items-center rounded-md" style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.10)', padding: '2px 5px' }}>
                        <span className="text-[9px] font-semibold leading-none block" style={{ color: 'rgba(255,255,255,0.90)', letterSpacing: '0.02em' }}>{item.duration ? formatTime(item.duration) : 'Video'}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ boxShadow: index === 0 ? 'inset 0 0 0 2px rgba(245,158,11,0.60)' : 'none' }} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {isProcessing && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-2.5 py-3 text-sm" style={{ color: AMBER_DIM }}>
                  <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'rgba(245,158,11,0.4)', borderTopColor: 'transparent' }} />
                  Processing…
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="shrink-0 relative">
        {/* Fade gradient above bar */}
        <div className="absolute left-0 right-0" style={{ top: -32, height: 32, background: `linear-gradient(to top, ${BG_BASE}, transparent)`, pointerEvents: 'none' }} />
        <div
          className="px-6 py-5 flex items-center justify-around"
          style={{
            background: `linear-gradient(to bottom, rgba(8,8,8,0) 0%, rgba(8,8,8,0.97) 20%)`,
            borderTop: '1px solid rgba(255,255,255,0.05)',
            paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 20px)',
          }}
        >
          <motion.button whileTap={{ scale: 0.92 }} onClick={() => fileInputRef.current?.click()} disabled={isProcessing} className="flex flex-col items-center gap-1.5 min-w-[60px] min-h-[44px] justify-center disabled:opacity-40">
            <Layers className="w-6 h-6" style={{ color: 'rgba(245,158,11,0.85)' }} strokeWidth={1.75} />
            <span className="text-[11px] font-semibold" style={{ color: AMBER_DIM, letterSpacing: '0.02em' }}>Gallery</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.91 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="relative flex items-center justify-center disabled:opacity-40"
            style={{ width: 72, height: 72, borderRadius: '50%', background: AMBER_GRADIENT, boxShadow: '0 4px 16px rgba(200,135,10,0.30)' }}
          >
            <Camera className="w-7 h-7 text-black" strokeWidth={1.75} />
          </motion.button>

          <motion.button whileTap={{ scale: 0.92 }} onClick={() => openPanel('drafts')} className="flex flex-col items-center gap-1.5 min-w-[60px] min-h-[44px] justify-center">
            <BookOpen className="w-6 h-6" style={{ color: 'rgba(245,158,11,0.85)' }} strokeWidth={1.75} />
            <span className="text-[11px] font-semibold" style={{ color: AMBER_DIM, letterSpacing: '0.02em' }}>Drafts</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
