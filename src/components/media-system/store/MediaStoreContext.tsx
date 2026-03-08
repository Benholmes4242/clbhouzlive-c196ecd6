import { createContext, useContext, type ReactNode } from 'react';
import { useStore } from 'zustand';
import type { MediaStore, MediaStoreState } from './createMediaStore';

export const MediaStoreContext = createContext<MediaStore | null>(null);

export function MediaStoreProvider({ store, children }: { store: MediaStore; children: ReactNode }) {
  return (
    <MediaStoreContext.Provider value={store}>
      {children}
    </MediaStoreContext.Provider>
  );
}

export function useScopedMediaStore<T>(selector: (state: MediaStoreState) => T): T {
  const store = useContext(MediaStoreContext);
  if (!store) throw new Error('useScopedMediaStore must be used within MediaStoreProvider');
  return useStore(store, selector);
}

export function useScopedMediaStoreApi(): MediaStore {
  const store = useContext(MediaStoreContext);
  if (!store) throw new Error('useScopedMediaStoreApi must be used within MediaStoreProvider');
  return store;
}
