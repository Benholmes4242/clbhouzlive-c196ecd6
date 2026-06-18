export interface RecentMedia {
  photos: string[];
  videos: string[];
}

const KEY = "recent-media-cache-v1";

export async function loadRecentMedia(): Promise<RecentMedia> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { photos: [], videos: [] };
    const parsed = JSON.parse(raw);
    return {
      photos: Array.isArray(parsed.photos) ? parsed.photos : [],
      videos: Array.isArray(parsed.videos) ? parsed.videos : [],
    };
  } catch {
    return { photos: [], videos: [] };
  }
}

export async function saveRecentMedia(media: RecentMedia): Promise<void> {
  try {
    localStorage.setItem(KEY, JSON.stringify(media));
  } catch {
    // ignore quota / availability errors
  }
}
