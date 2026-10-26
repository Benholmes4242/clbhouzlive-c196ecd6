/** Serial decoded-frame probes. A failed preview never rejects valid metadata. */
let probeTail: Promise<unknown> = Promise.resolve();
export function nearBlack(pixels: Uint8ClampedArray): boolean {
  let sum = 0; for (let i = 0; i < pixels.length; i += 4) sum += .2126 * pixels[i] + .7152 * pixels[i + 1] + .0722 * pixels[i + 2];
  return pixels.length > 0 && sum / (pixels.length / 4) < 8;
}
export function probeVideo(file: File, registerBlob: (url: string) => string): Promise<{ duration: number; posterUrl: string | null }> {
  const task = probeTail.then(() => readVideo(file, registerBlob));
  probeTail = task.catch(() => {}); return task;
}
function readVideo(file: File, registerBlob: (url: string) => string): Promise<{ duration: number; posterUrl: string | null }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file); const v = document.createElement('video');
    v.muted = true; v.playsInline = true; v.preload = 'metadata';
    let duration: number | null = null; let done = false; let retried = false;
    let timer: ReturnType<typeof setTimeout> | undefined; let frameTimer: ReturnType<typeof setTimeout> | undefined; let frameId: number | undefined;
    const dispose = () => { clearTimeout(timer); clearTimeout(frameTimer); if (frameId != null) v.cancelVideoFrameCallback?.(frameId); v.onseeked = null; v.onloadedmetadata = null; v.onerror = null; v.removeAttribute('src'); URL.revokeObjectURL(url); };
    const finish = (posterUrl: string | null) => { if (done) return; done = true; dispose(); resolve({ duration: duration ?? 0, posterUrl }); };
    const draw = () => {
      if (done) return;
      try {
        const canvas = document.createElement('canvas'); canvas.width = v.videoWidth; canvas.height = v.videoHeight;
        const ctx = canvas.getContext('2d'); if (!ctx || !canvas.width || !canvas.height) return finish(null);
        ctx.drawImage(v, 0, 0);
        const sample = document.createElement('canvas'); sample.width = 16; sample.height = 16;
        const small = sample.getContext('2d'); if (!small) return finish(null);
        small.drawImage(canvas, 0, 0, 16, 16);
        if (nearBlack(small.getImageData(0, 0, 16, 16).data)) {
          if (retried) return finish(null); retried = true; v.currentTime = 1; return;
        }
        canvas.toBlob(blob => { if (!done) finish(blob ? registerBlob(URL.createObjectURL(blob)) : null); }, 'image/jpeg', .7);
      } catch { finish(null); }
    };
    v.onloadedmetadata = () => {
      duration = Number.isFinite(v.duration) ? v.duration : 0;
      timer = setTimeout(() => finish(null), 8000);
      try { v.currentTime = Math.min(.1, (v.duration || 1) / 2); } catch { finish(null); }
    };
    v.onseeked = () => { if (done) return; if (v.requestVideoFrameCallback) frameId = v.requestVideoFrameCallback(draw); else frameTimer = setTimeout(draw, 150); };
    v.onerror = () => { if (duration !== null) return finish(null); if (done) return; done = true; dispose(); reject(new Error('Could not read video metadata')); };
    v.src = url;
  });
}
