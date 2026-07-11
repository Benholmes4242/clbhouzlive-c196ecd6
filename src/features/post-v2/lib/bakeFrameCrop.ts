// Bake a frame + reposition + zoom into a new image File.
// Uses the same math as frameCropMath so the preview and the uploaded pixel
// are identical. When frame='original' and no adjustment has been made
// (pos=center, scale=1), callers should skip this and submit the file
// untouched - this function still handles that case correctly, just wastefully.

import { baseCoverCrop, frameRatio } from './frameCropMath';

export type FrameId = 'original' | '4:5' | '1:1' | '9:16';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function bakeFrameCrop(
  file: File,
  frame: FrameId,
  pos: { x: number; y: number } = { x: 50, y: 50 },
  scale: number = 1,
): Promise<File> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const target = frameRatio(frame, iw / ih);
    const base = baseCoverCrop(iw, ih, target);
    const s = Math.max(1, Math.min(3, Number.isFinite(scale) ? scale : 1));
    const cropW = base.w / s;
    const cropH = base.h / s;
    const sx = Math.max(0, Math.min(iw - cropW, ((pos.x ?? 50) / 100) * (iw - cropW)));
    const sy = Math.max(0, Math.min(ih - cropH, ((pos.y ?? 50) / 100) * (ih - cropH)));

    const MAX_EDGE = 2048;
    const scaleOut = Math.min(1, MAX_EDGE / Math.max(cropW, cropH));
    const outW = Math.round(cropW * scaleOut);
    const outH = Math.round(cropH * scaleOut);

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas ctx unavailable');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sx, sy, cropW, cropH, 0, 0, outW, outH);

    const isPng = file.type === 'image/png';
    const outType = isPng ? 'image/png' : 'image/jpeg';
    const ext = isPng ? 'png' : 'jpg';
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
        outType,
        0.92,
      );
    });
    const baseName = file.name.replace(/\.[^.]+$/, '');
    const safeFrame = frame.replace(':', 'x');
    return new File([blob], `${baseName}-${safeFrame}.${ext}`, {
      type: outType,
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
