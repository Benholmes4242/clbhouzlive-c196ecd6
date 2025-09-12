import { saveRecentMedia, loadRecentMedia } from "@/lib/recentMediaCache";
import { ComposerMediaItem } from "@/hooks/useSnapModal";

let isListenerInitialized = false;

// Call this once in app bootstrap
export function initRecentMediaListener() {
  if (isListenerInitialized) return;
  
  window.addEventListener("postCompleted", async (e: any) => {
    try {
      // Get the last composed items from the event or from global state
      const items: ComposerMediaItem[] = e.detail?.mediaItems || [];
      
      if (items.length === 0) return;
      
      const newPhotos = items
        .filter(i => i.type === "image")
        .slice(0, 3)
        .map(i => i.previewUrl);
        
      const newVideos = items
        .filter(i => i.type === "video")
        .slice(0, 3)
        .map(i => i.previewUrl);

      const prev = await loadRecentMedia();
      
      // Only update if we have new media
      const updatedPhotos = newPhotos.length > 0 ? newPhotos : prev.photos;
      const updatedVideos = newVideos.length > 0 ? newVideos : prev.videos;
      
      await saveRecentMedia({
        photos: updatedPhotos,
        videos: updatedVideos,
      });
      
      console.log('Updated recent media cache after post completion');
    } catch (error) {
      console.warn('Failed to update recent media cache:', error);
    }
  });
  
  isListenerInitialized = true;
}

// Helper to manually update cache (useful for immediate UI updates)
export async function updateRecentMediaFromItems(items: ComposerMediaItem[]) {
  try {
    const newPhotos = items
      .filter(i => i.type === "image")
      .slice(0, 3)
      .map(i => i.previewUrl);
      
    const newVideos = items
      .filter(i => i.type === "video")
      .slice(0, 3)
      .map(i => i.previewUrl);

    const prev = await loadRecentMedia();
    
    await saveRecentMedia({
      photos: newPhotos.length > 0 ? newPhotos : prev.photos,
      videos: newVideos.length > 0 ? newVideos : prev.videos,
    });
  } catch (error) {
    console.warn('Failed to manually update recent media cache:', error);
  }
}