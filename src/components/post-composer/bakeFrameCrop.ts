// Bake a frame + reposition into a new image File.
// frame: '4:5' | '1:1' (object-fit: cover @ object-position pos.x% pos.y%)
// 'original' should NOT call this — submit the file untouched.

export type FrameId = 'original' | '4:5' | '1:1';

const FRAME_RATIO: Record<Exclude<FrameId, 'original'>, number> = {
  '4:5': 4 / 5,
  '1:1': 1,
};

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
  frame: Exclude<FrameId, 'original'>,
  pos: { x: number; y: number }
): Promise<File> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const srcRatio = iw / ih;
    const target = FRAME_RATIO[frame];

    // cover-fit: crop rect inside source matching target ratio
    let cropW: number, cropH: number;
    if (srcRatio > target) {
      // source wider → crop horizontally
      cropH = ih;
      cropW = cropH * target;
    } else {
      cropW = iw;
      cropH = cropW / target;
    }
    // object-position: 50% means center; map pos.x 0..100 → sx 0..(iw-cropW)
    const sx = Math.max(0, Math.min(iw - cropW, ((pos.x ?? 50) / 100) * (iw - cropW)));
    const sy = Math.max(0, Math.min(ih - cropH, ((pos.y ?? 50) / 100) * (ih - cropH)));

    const MAX_EDGE = 2048;
    const scale = Math.min(1, MAX_EDGE / Math.max(cropW, cropH));
    const outW = Math.round(cropW * scale);
    const outH = Math.round(cropH * scale);

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
        0.92
      );
    });
    const baseName = file.name.replace(/\.[^.]+$/, '');
    return new File([blob], `${baseName}-${frame.replace(':', 'x')}.${ext}`, {
      type: outType,
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
