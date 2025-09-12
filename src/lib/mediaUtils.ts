import { ComposerMediaItem } from "@/hooks/useSnapModal";

export async function normalizeFilesToMediaItems(files: File[]): Promise<ComposerMediaItem[]> {
  const items = await Promise.all(files.map(async (file, idx) => {
    const type: "image" | "video" = file.type.startsWith("video") ? "video" : "image";
    const previewUrl = URL.createObjectURL(file); // image thumb or video poster (temp)
    
    // For videos, we could generate a proper video frame here if needed
    // For now, we'll use the blob URL which shows first frame
    
    return {
      id: crypto.randomUUID?.() ?? `${Date.now()}-${idx}`,
      type,
      file,
      previewUrl,
      duration: undefined // Could add video duration detection here if needed
    };
  }));
  return items;
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