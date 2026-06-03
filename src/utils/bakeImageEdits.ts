import type { SimpleEdits, SimpleTextStyle } from '@/types/studioSimple';
import { SIMPLE_FILTERS, ratioToNumber } from '@/types/studioSimple';

const MAX_EDGE = 2048;

/** Render src image + edits to a flat JPEG Blob. Order: crop → rotate/flip → filter → text. */
export async function bakeImageEdits(src: string, edits: SimpleEdits): Promise<Blob> {
  const img = await loadImage(src);
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;

  // 1. Crop rect in source pixels
  const ratio = edits.crop?.ratio ?? 'original';
  const zoom = Math.max(1, edits.crop?.zoom ?? 1);
  const offX = edits.crop?.offsetX ?? 0; // -1..1
  const offY = edits.crop?.offsetY ?? 0;

  let cropW: number, cropH: number;
  if (ratio === 'original') {
    cropW = iw / zoom;
    cropH = ih / zoom;
  } else {
    const target = ratioToNumber(ratio, iw / ih);
    const srcRatio = iw / ih;
    if (srcRatio > target) {
      cropH = ih / zoom;
      cropW = cropH * target;
    } else {
      cropW = iw / zoom;
      cropH = cropW / target;
    }
  }
  const maxOffX = (iw - cropW) / 2;
  const maxOffY = (ih - cropH) / 2;
  const cx = iw / 2 + offX * maxOffX;
  const cy = ih / 2 + offY * maxOffY;
  const sx = Math.max(0, Math.min(iw - cropW, cx - cropW / 2));
  const sy = Math.max(0, Math.min(ih - cropH, cy - cropH / 2));

  // 2. Output size (post-rotation) downscaled to MAX_EDGE
  const rotate = (edits.rotate ?? 0) as 0 | 90 | 180 | 270;
  const rotated90 = rotate === 90 || rotate === 270;
  let outW = rotated90 ? cropH : cropW;
  let outH = rotated90 ? cropW : cropH;
  const scale = Math.min(1, MAX_EDGE / Math.max(outW, outH));
  outW = Math.round(outW * scale);
  outH = Math.round(outH * scale);

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d')!;

  // 3. Apply filter + rotate/flip then draw cropped source
  ctx.save();
  ctx.filter = cssFor(edits.filter);
  ctx.translate(outW / 2, outH / 2);
  ctx.rotate((rotate * Math.PI) / 180);
  ctx.scale(edits.flipH ? -1 : 1, edits.flipV ? -1 : 1);
  const drawW = cropW * scale;
  const drawH = cropH * scale;
  ctx.drawImage(img, sx, sy, cropW, cropH, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();

  // 4. Text overlays (no filter)
  ctx.filter = 'none';
  for (const t of edits.text ?? []) {
    drawTextOverlay(ctx, t, outW, outH);
  }

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
      'image/jpeg',
      0.92
    );
  });
}

function drawTextOverlay(
  ctx: CanvasRenderingContext2D,
  t: { text: string; x: number; y: number; scale: number; style: SimpleTextStyle },
  W: number,
  H: number
) {
  const basePx = Math.round(Math.min(W, H) * 0.06);
  const fontPx = Math.max(12, Math.round(basePx * (t.scale || 1)));
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const x = t.x * W;
  const y = t.y * H;

  if (t.style === 'serif') {
    ctx.font = `700 ${fontPx}px Georgia, serif`;
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = fontPx * 0.18;
    ctx.shadowOffsetY = fontPx * 0.04;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(t.text, x, y);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  } else if (t.style === 'outline') {
    ctx.font = `800 ${fontPx}px system-ui, -apple-system, "Segoe UI", sans-serif`;
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, fontPx * 0.12);
    ctx.strokeStyle = '#0F172A';
    ctx.strokeText(t.text, x, y);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(t.text, x, y);
  } else {
    // bold
    ctx.font = `800 ${fontPx}px system-ui, -apple-system, "Segoe UI", sans-serif`;
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = fontPx * 0.22;
    ctx.shadowOffsetY = fontPx * 0.05;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(t.text, x, y);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }
}

function cssFor(filter?: string) {
  return SIMPLE_FILTERS.find((f) => f.id === filter)?.css ?? 'none';
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const i = new Image();
    i.crossOrigin = 'anonymous';
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
}
