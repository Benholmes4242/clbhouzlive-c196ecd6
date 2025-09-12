const KEY = "clbhouz_recent_media_v1";

export type RecentMediaCache = { 
  photos: string[]; 
  videos: string[] 
};

export async function saveRecentMedia(data: RecentMediaCache): Promise<void> {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save recent media to localStorage:', error);
  }
}

export async function loadRecentMedia(): Promise<RecentMediaCache> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { photos: [], videos: [] };
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to load recent media from localStorage:', error);
    return { photos: [], videos: [] };
  }
}

// Add a single media item to recent cache
export async function addToRecentMedia(url: string, type: 'photo' | 'video'): Promise<void> {
  const current = await loadRecentMedia();
  
  if (type === 'photo') {
    current.photos = [url, ...current.photos.filter(p => p !== url)].slice(0, 3);
  } else {
    current.videos = [url, ...current.videos.filter(v => v !== url)].slice(0, 3);
  }
  
  await saveRecentMedia(current);
}

// Clear recent media cache
export async function clearRecentMedia(): Promise<void> {
  try {
    localStorage.removeItem(KEY);
  } catch (error) {
    console.warn('Failed to clear recent media cache:', error);
  }
}