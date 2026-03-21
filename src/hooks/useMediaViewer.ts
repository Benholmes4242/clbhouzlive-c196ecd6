import { create } from 'zustand';

export interface MediaViewerItem {
  id: string;
  type: 'video' | 'image';
  hlsUrl?: string;
  mp4Url?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  src?: string; // fallback URL used by call sites
  width?: number;
  height?: number;
}

interface MediaViewerState {
  isOpen: boolean;
  items: MediaViewerItem[];
  currentIndex: number;
  openViewer: (items: MediaViewerItem[], startIndex?: number) => void;
  closeViewer: () => void;
  goTo: (index: number) => void;
  next: () => void;
  prev: () => void;
}

export const useMediaViewer = create<MediaViewerState>((set, get) => ({
  isOpen: false,
  items: [],
  currentIndex: 0,

  openViewer: (items, startIndex = 0) =>
    set({ isOpen: true, items, currentIndex: Math.max(0, Math.min(startIndex, items.length - 1)) }),

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
