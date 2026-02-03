import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  canAccessGalleryDirectly,
  requestGalleryPermission,
  fetchAlbums,
  fetchGalleryMedia,
  GalleryAlbum,
  GalleryMediaItem,
  FetchGalleryOptions,
} from '@/utils/capacitor/galleryService';

// Global debug log for visual debug panel
export const galleryDebugLog: string[] = [];
export const addGalleryDebug = (msg: string) => {
  const entry = `${new Date().toISOString().split('T')[1].slice(0, 8)} ${msg}`;
  galleryDebugLog.push(entry);
  // Keep only last 50 entries
  if (galleryDebugLog.length > 50) {
    galleryDebugLog.shift();
  }
  console.log('[GalleryDebug]', msg);
};

interface UseGalleryOptions {
  autoLoad?: boolean;
  initialAlbumId?: string;
  pageSize?: number;
}

interface UseGalleryReturn {
  // State
  isSupported: boolean;
  permissionStatus: 'unknown' | 'granted' | 'denied' | 'limited';
  albums: GalleryAlbum[];
  currentAlbum: GalleryAlbum | null;
  mediaItems: GalleryMediaItem[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  
  // Actions
  requestPermission: () => Promise<boolean>;
  selectAlbum: (albumId: string | null) => void;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useGallery(options: UseGalleryOptions = {}): UseGalleryReturn {
  const { autoLoad = true, initialAlbumId, pageSize = 50 } = options;
  
  const [isSupported] = useState(() => canAccessGalleryDirectly());
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied' | 'limited'>('unknown');
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [currentAlbumId, setCurrentAlbumId] = useState<string | null>(initialAlbumId || null);
  const [mediaItems, setMediaItems] = useState<GalleryMediaItem[]>([]);
  // Start with loading state true if autoLoad is enabled and we're on a supported platform
  const [isLoading, setIsLoading] = useState(autoLoad && isSupported);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const cursorRef = useRef<string | undefined>(undefined);
  const isMountedRef = useRef(true);
  
  // Get current album object
  const currentAlbum = albums.find(a => a.id === currentAlbumId) || null;
  
  // Request permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    
    try {
      const status = await requestGalleryPermission();
      if (isMountedRef.current) {
        setPermissionStatus(status);
      }
      return status === 'granted' || status === 'limited';
    } catch (err) {
      console.error('[useGallery] Permission request failed:', err);
      if (isMountedRef.current) {
        setPermissionStatus('denied');
      }
      return false;
    }
  }, [isSupported]);
  
  // Load albums
  const loadAlbums = useCallback(async () => {
    if (!isSupported) return;
    
    try {
      const albumList = await fetchAlbums();
      if (isMountedRef.current) {
        setAlbums(albumList);
        // Auto-select first album if none selected
        if (!currentAlbumId && albumList.length > 0) {
          setCurrentAlbumId(albumList[0].id);
        }
      }
    } catch (err) {
      console.error('[useGallery] Failed to load albums:', err);
    }
  }, [isSupported, currentAlbumId]);
  
  // Load media for current album
  const loadMedia = useCallback(async (append = false) => {
    if (!isSupported || permissionStatus === 'denied') {
      addGalleryDebug(`loadMedia skipped: isSupported=${isSupported}, permissionStatus=${permissionStatus}`);
      return;
    }
    
    const loadingState = append ? setIsLoadingMore : setIsLoading;
    loadingState(true);
    setError(null);
    
    addGalleryDebug(`Fetching media from album: ${currentAlbumId || 'all'}, append=${append}`);
    
    try {
      const fetchOptions: FetchGalleryOptions = {
        albumId: currentAlbumId || undefined,
        limit: pageSize,
        cursor: append ? cursorRef.current : undefined,
        sortOrder: 'desc',
      };
      
      const result = await fetchGalleryMedia(fetchOptions);
      
      addGalleryDebug(`Media loaded: ${result.items.length} items, hasMore=${result.hasMore}`);
      
      if (isMountedRef.current) {
        if (append) {
          setMediaItems(prev => [...prev, ...result.items]);
        } else {
          setMediaItems(result.items);
        }
        setHasMore(result.hasMore);
        cursorRef.current = result.nextCursor;
      }
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      addGalleryDebug(`ERROR loading media: ${errMsg}`);
      console.error('[useGallery] Failed to load media:', err);
      if (isMountedRef.current) {
        setError(errMsg);
      }
    } finally {
      if (isMountedRef.current) {
        loadingState(false);
      }
    }
  }, [isSupported, permissionStatus, currentAlbumId, pageSize]);
  
  // Select album
  const selectAlbum = useCallback((albumId: string | null) => {
    setCurrentAlbumId(albumId);
    cursorRef.current = undefined;
    setMediaItems([]);
    setHasMore(false);
  }, []);
  
  // Load more (pagination)
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;
    await loadMedia(true);
  }, [hasMore, isLoadingMore, loadMedia]);
  
  // Refresh
  const refresh = useCallback(async () => {
    cursorRef.current = undefined;
    await loadMedia(false);
  }, [loadMedia]);
  
  // Initial load with debug logging
  useEffect(() => {
    isMountedRef.current = true;
    
    // Add platform debug info
    addGalleryDebug(`Init: autoLoad=${autoLoad}, isSupported=${isSupported}`);
    addGalleryDebug(`Platform: ${Capacitor.getPlatform()}, isNative=${Capacitor.isNativePlatform()}`);
    
    if (!autoLoad || !isSupported) {
      addGalleryDebug(`Skipping auto-load: autoLoad=${autoLoad}, isSupported=${isSupported}`);
      if (isMountedRef.current) {
        setIsLoading(false);
      }
      return;
    }
    
    addGalleryDebug('Starting auto-load...');
    
    const initialize = async () => {
      try {
        addGalleryDebug('Requesting permission...');
        const granted = await requestPermission();
        addGalleryDebug(`Permission result: ${granted ? 'granted' : 'denied'}`);
        
        if (granted) {
          addGalleryDebug('Loading albums...');
          await loadAlbums();
          addGalleryDebug('Albums loaded successfully');
        } else {
          addGalleryDebug('Permission denied, stopping initialization');
          if (isMountedRef.current) {
            setIsLoading(false);
          }
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        addGalleryDebug(`ERROR in auto-load: ${errMsg}`);
        console.error('[useGallery] Auto-load failed:', err);
        if (isMountedRef.current) {
          setIsLoading(false);
          setError(errMsg);
        }
      }
    };
    
    initialize();
    
    return () => {
      isMountedRef.current = false;
    };
  }, [autoLoad, isSupported, requestPermission, loadAlbums]);
  
  // Load media when album changes
  useEffect(() => {
    if (permissionStatus === 'granted' || permissionStatus === 'limited') {
      loadMedia(false);
    }
  }, [currentAlbumId, permissionStatus, loadMedia]);
  
  return {
    isSupported,
    permissionStatus,
    albums,
    currentAlbum,
    mediaItems,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    requestPermission,
    selectAlbum,
    loadMore,
    refresh,
  };
}
