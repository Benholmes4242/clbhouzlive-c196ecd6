// ComposerMedia — shared types & helpers for the post composer media flow.

import type { FrameId } from './FrameChooser';

export interface ComposerMediaItem {
  id: string;
  type: 'image' | 'video';
  file: File;
  previewUrl: string;
  posterUrl?: string;
  width: number;
  height: number;
  aspectRatio: number;
  pos: { x: number; y: number };
  frame: FrameId;
}

let __idCounter = 0;
export const nextMediaId = () => `m_${Date.now()}_${++__idCounter}`;

export function measureImage(file: File): Promise<{ width: number; height: number; previewUrl: string }> {
  return new Promise((resolve, reject) => {
    const previewUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight, previewUrl });
    img.onerror = () => {
      URL.revokeObjectURL(previewUrl);
      reject(new Error('image load failed'));
    };
    img.src = previewUrl;
  });
}

export function measureVideo(
  file: File
): Promise<{ width: number; height: number; previewUrl: string; posterUrl?: string }> {
  return new Promise((resolve, reject) => {
    const previewUrl = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.muted = true;
    (v as HTMLVideoElement).playsInline = true;
    let done = false;
    const finish = (posterUrl?: string) => {
      if (done) return;
      done = true;
      resolve({
        width: v.videoWidth || 16,
        height: v.videoHeight || 9,
        previewUrl,
        posterUrl,
      });
    };
    v.onloadedmetadata = () => {
      const seekTo = Math.min(0.1, (v.duration || 1) / 2);
      const onSeeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = v.videoWidth || 16;
          canvas.height = v.videoHeight || 9;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
            finish(canvas.toDataURL('image/jpeg', 0.8));
            return;
          }
        } catch {
          // fall through
        }
        finish();
      };
      v.addEventListener('seeked', onSeeked, { once: true });
      try {
        v.currentTime = seekTo;
      } catch {
        finish();
      }
      setTimeout(() => finish(), 1500);
    };
    v.onerror = () => {
      URL.revokeObjectURL(previewUrl);
      reject(new Error('video load failed'));
    };
    v.src = previewUrl;
  });
}

export async function filesToComposerMedia(files: File[]): Promise<ComposerMediaItem[]> {
  const out: ComposerMediaItem[] = [];
  for (const f of files) {
    try {
      const isVideo = f.type.startsWith('video/');
      const m = isVideo ? await measureVideo(f) : await measureImage(f);
      out.push({
        id: nextMediaId(),
        type: isVideo ? 'video' : 'image',
        file: f,
        previewUrl: m.previewUrl,
        posterUrl: isVideo ? (m as { posterUrl?: string }).posterUrl : undefined,
        width: m.width,
        height: m.height,
        aspectRatio: m.width / Math.max(1, m.height),
        pos: { x: 50, y: 50 },
        frame: 'original',
      });
    } catch {
      // skip bad file
    }
  }
  return out;
}
