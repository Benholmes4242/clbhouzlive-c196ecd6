import { ComposerMediaItem } from "@/hooks/useSnapModal";

export async function normalizeFilesToMediaItems(files: File[]): Promise<ComposerMediaItem[]> {
  const tasks = files.map(async (file, idx) => {
    try {
      const type: "image" | "video" = file.type.startsWith("video") ? "video" : "image";
      const previewUrl = URL.createObjectURL(file);

      // Optional: read duration with a timeout using a separate blob URL
      let duration: number | undefined = undefined;
      if (type === 'video') {
        try {
          const tmpUrl = URL.createObjectURL(file);
          duration = await readVideoDuration(tmpUrl, 1200);
        } catch {
          duration = undefined;
        }
      }

      return {
        id: crypto.randomUUID?.() ?? `${Date.now()}-${idx}`,
        type,
        file,
        previewUrl,
        duration,
      } as ComposerMediaItem;
    } catch (e) {
      console.warn('[normalize] item failed, falling back:', file.name, e);
      const url = URL.createObjectURL(file);
      return {
        id: crypto.randomUUID?.() ?? `${Date.now()}-${idx}`,
        type: file.type.startsWith('video') ? 'video' : 'image',
        file,
        previewUrl: url,
      } as ComposerMediaItem;
    }
  });

  const settled = await Promise.allSettled(tasks);
  const items = settled
    .filter((s): s is PromiseFulfilledResult<ComposerMediaItem> => s.status === 'fulfilled')
    .map((s) => s.value);

  if (!items.length) throw new Error('All media normalization failed');
  return items;
}

function readVideoDuration(src: string, timeoutMs = 1200): Promise<number | undefined> {
  return new Promise((resolve) => {
    const v = document.createElement('video');
    let done = false;

    const cleanup = () => {
      if (!done) {
        done = true;
        if (src.startsWith('blob:')) URL.revokeObjectURL(src);
      }
    };

    const to = setTimeout(() => {
      cleanup();
      resolve(undefined);
    }, timeoutMs);

    v.preload = 'metadata';
    v.onloadedmetadata = () => {
      clearTimeout(to);
      const d = isFinite(v.duration) ? v.duration : undefined;
      cleanup();
      resolve(d);
    };
    v.onerror = () => {
      clearTimeout(to);
      cleanup();
      resolve(undefined);
    };
    v.src = src;
  });
}

// Helper to revoke object URLs to prevent memory leaks
export function revokeMediaItemUrls(items: ComposerMediaItem[]) {
  items.forEach(item => {
    if (item.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(item.previewUrl);
    }
  });
}

// Generate video thumbnail/poster frame
export async function generateVideoPoster(videoFile: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.currentTime = 1; // Seek to 1 second for better frame
    
    video.onloadeddata = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(URL.createObjectURL(blob));
        } else {
          reject(new Error('Could not generate video poster'));
        }
      }, 'image/jpeg', 0.8);
    };
    
    video.onerror = () => reject(new Error('Could not load video'));
    video.src = URL.createObjectURL(videoFile);
  });
}