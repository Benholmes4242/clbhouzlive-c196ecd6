import { create } from 'zustand';

export interface MediaViewerItem {
  id: string;
  type: 'video' | 'image';
  hlsUrl?: string;
  mp4Url?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  src?: string;
  width?: number;
  height?: number;
}

interface MediaViewerState {
  isOpen: boolean;
  items: MediaViewerItem[];
  currentIndex: number;
  openViewer: (items: any[], startIndex?: number) => void;
  closeViewer: () => void;
  goTo: (index: number) => void;
  next: () => void;
  prev: () => void;
}

/** Normalize any item shape into MediaViewerItem */
function normalizeItem(raw: any): MediaViewerItem {
  const type: 'video' | 'image' =
    raw.type === 'video' || raw.mediaType === 'video'
      ? 'video'
      : 'image';

  // Resolve the display URL
  const src =
    raw.src ||
    raw.mediaUrl ||
    raw.media_url ||
    raw.imageUrl ||
    raw.hlsUrl ||
    raw.mp4Url ||
    raw.post_media?.[0]?.media_url ||
    '';

  const thumbnailUrl =
    raw.thumbnailUrl ||
    raw.thumbnailSrc ||
    raw.posterUrl ||
    raw.poster_url ||
    raw.post_media?.[0]?.poster_url ||
    undefined;

  return {
    id: raw.id || String(Math.random()),
    type,
    src,
    imageUrl: type === 'image' ? src : undefined,
    hlsUrl: type === 'video' && src.includes('.m3u8') ? src : raw.hlsUrl,
    mp4Url: type === 'video' && !src.includes('.m3u8') ? src : raw.mp4Url,
    thumbnailUrl,
    width: raw.width,
    height: raw.height,
  };
}

export const useMediaViewer = create<MediaViewerState>((set, get) => ({
  isOpen: false,
  items: [],
  currentIndex: 0,

  openViewer: (rawItems, startIndex = 0) => {
    console.log('[MediaViewer] openViewer called', { rawItems, startIndex });
    const items = rawItems.map(normalizeItem);
    console.log('[MediaViewer] normalized items', items);
    set({ isOpen: true, items, currentIndex: Math.max(0, Math.min(startIndex, items.length - 1)) });
  },

  closeViewer: () => set({ isOpen: false, items: [], currentIndex: 0 }),

  goTo: (index) => {
    const { items } = get();
    if (index >= 0 && index < items.length) set({ currentIndex: index });
  },

  next: () => {
    const { currentIndex, items } = get();
    if (currentIndex < items.length - 1) set({ currentIndex: currentIndex + 1 });
  },

  prev: () => {
    const { currentIndex } = get();
    if (currentIndex > 0) set({ currentIndex: currentIndex - 1 });
  },
}));
