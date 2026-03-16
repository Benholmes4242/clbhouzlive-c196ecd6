// MediaPickerScreen — Step 1: The invitation
// Pure. Minimal. One line of text, one button. Apple-grade restraint.

import React, { useCallback, useRef, useState } from 'react';
import { Camera, Layers, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { StudioHeader } from '../components/StudioHeader';
import { usePostStudioContext } from '../usePostStudio';
import { validateMediaFile, POST_LIMITS, ALLOWED_VIDEO_TYPES, ALLOWED_IMAGE_TYPES } from '../constants';
import { BG_BASE, BG_CARD, AMBER_GRADIENT, AMBER_DIM, TEXT_PRIMARY } from '../tokens';
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
            ? { label: 'Next', onClick: () => setStep('COMPOSER'), variant: 'primary' as const }
            : undefined
        }
      />

      <input ref={fileInputRef} type="file" accept={acceptTypes} multiple onChange={handleFileSelect} className="hidden" />

      <div className="flex-1 flex flex-col">
        {/* ── Empty state — minimal ── */}
        {!hasMedia && (
          <div className="flex-1 flex flex-col items-center justify-center px-8">
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: TEXT_PRIMARY,
                letterSpacing: '-0.04em',
                lineHeight: 1.1,
                textAlign: 'center',
              }}
            >
              Share a moment.
            </motion.h2>

            {/* Processing indicator — only appears when a file is being processed */}
            <AnimatePresence>
              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 mt-8 text-sm"
                  style={{ color: 'rgba(255,255,255,0.35)' }}
                >
                  <div
                    className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: 'rgba(255,255,255,0.20)', borderTopColor: 'transparent' }}
                  />
                  Preparing…
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── Media grid — shown once user has selected items ── */}
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
                    {/* Order badge */}
                    <div
                      className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: AMBER_GRADIENT, boxShadow: '0 2px 8px rgba(200,135,10,0.30)' }}
                    >
                      <span className="text-[11px] font-bold text-black">{index + 1}</span>
                    </div>
                    {/* Video duration badge */}
                    {item.mediaType === 'video' && (
                      <div
                        className="absolute bottom-1.5 right-1.5 flex items-center rounded-md"
                        style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.10)', padding: '2px 5px' }}
                      >
                        <span className="text-[9px] font-semibold leading-none block" style={{ color: 'rgba(255,255,255,0.90)', letterSpacing: '0.02em' }}>
                          {item.duration ? formatTime(item.duration) : 'Video'}
                        </span>
                      </div>
                    )}
                    {/* First-item amber border */}
                    <div
                      className="absolute inset-0 rounded-2xl pointer-events-none"
                      style={{ boxShadow: index === 0 ? 'inset 0 0 0 2px rgba(232,152,10,0.55)' : 'none' }}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <AnimatePresence>
              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center gap-2 py-3 text-sm"
                  style={{ color: 'rgba(255,255,255,0.35)' }}
                >
                  <div
                    className="w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: 'rgba(255,255,255,0.20)', borderTopColor: 'transparent' }}
                  />
                  Processing…
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Bottom action bar ── */}
      <div className="shrink-0 relative">
        {/* Fade vignette */}
        <div
          className="absolute left-0 right-0 pointer-events-none"
          style={{ top: -40, height: 40, background: `linear-gradient(to top, ${BG_BASE}, transparent)` }}
        />
        <div
          className="px-8 flex items-center justify-between"
          style={{
            paddingTop: 16,
            paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)',
            borderTop: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          {/* Gallery */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="flex flex-col items-center gap-1.5 disabled:opacity-30"
            style={{ minWidth: 64, minHeight: 44, justifyContent: 'center' }}
          >
            <Layers className="w-6 h-6" style={{ color: 'rgba(255,255,255,0.55)' }} strokeWidth={2} />
            <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.03em' }}>
              Gallery
            </span>
          </motion.button>

          {/* Primary camera CTA — the only amber element on screen */}
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="relative flex items-center justify-center disabled:opacity-40"
            style={{
              width: 76,
              height: 76,
              borderRadius: '50%',
              background: AMBER_GRADIENT,
              boxShadow: '0 4px 20px rgba(200,135,10,0.35), 0 1px 0 rgba(255,255,255,0.15) inset',
            }}
          >
            <Camera className="w-7 h-7 text-black" strokeWidth={1.75} />
          </motion.button>

          {/* Drafts */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => openPanel('drafts')}
            className="flex flex-col items-center gap-1.5"
            style={{ minWidth: 64, minHeight: 44, justifyContent: 'center' }}
          >
            <BookOpen className="w-6 h-6" style={{ color: 'rgba(255,255,255,0.55)' }} strokeWidth={1.5} />
            <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.03em' }}>
              Drafts
            </span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
