import { Capacitor } from '@capacitor/core';
import { Media } from '@capacitor-community/media';
import heic2any from 'heic2any';

/**
 * Represents an album in the gallery
 */
export interface GalleryAlbum {
  id: string;
  name: string;
  count: number;
  type: 'smart' | 'user';
}

/**
 * Represents a media item in the gallery
 */
export interface GalleryMediaItem {
  id: string;
  type: 'image' | 'video';
  uri: string;
  thumbnailUri?: string;
  width?: number;
  height?: number;
  duration?: number; // seconds, for videos
  creationDate?: Date;
  modificationDate?: Date;
  filename?: string;
}

/**
 * Pagination info for gallery queries
 */
export interface GalleryPage {
  items: GalleryMediaItem[];
  hasMore: boolean;
  nextCursor?: string;
  totalCount?: number;
}

/**
 * Options for fetching gallery media
 */
export interface FetchGalleryOptions {
  albumId?: string;
  limit?: number;
  cursor?: string;
  mediaTypes?: ('image' | 'video')[];
  sortBy?: 'creationDate' | 'modificationDate';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Check if we can access the gallery directly
 */
export function canAccessGalleryDirectly(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Request photo library permissions
 */
export async function requestGalleryPermission(): Promise<'granted' | 'denied' | 'limited'> {
  if (!Capacitor.isNativePlatform()) {
    return 'granted'; // Web doesn't need permission for file picker
  }
  
  try {
    // The Media plugin handles permissions internally
    // Attempting to get albums will trigger permission request
    await Media.getAlbums();
    return 'granted';
  } catch (error: any) {
    if (error?.message?.includes('denied') || error?.message?.includes('permission')) {
      return 'denied';
    }
    // Some errors might indicate limited access on iOS 14+
    if (error?.message?.includes('limited')) {
      return 'limited';
    }
    throw error;
  }
}

/**
 * Fetch available albums from the device
 */
export async function fetchAlbums(): Promise<GalleryAlbum[]> {
  if (!Capacitor.isNativePlatform()) {
    return [];
  }
  
  try {
    const result = await Media.getAlbums();
    
    const albums: GalleryAlbum[] = (result.albums || []).map((album: any) => ({
      id: album.identifier,
      name: album.name,
      count: album.count || 0,
      type: album.type === 'smart' ? 'smart' : 'user',
    }));
    
    // Sort: smart albums first (Recents, Favorites), then alphabetically
    albums.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'smart' ? -1 : 1;
      }
      // Prioritize "Recents" and "Camera Roll" 
      const priorityNames = ['recents', 'recent photos', 'camera roll', 'all photos'];
      const aIsPriority = priorityNames.some(n => a.name.toLowerCase().includes(n));
      const bIsPriority = priorityNames.some(n => b.name.toLowerCase().includes(n));
      if (aIsPriority !== bIsPriority) {
        return aIsPriority ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
    
    return albums;
  } catch (error) {
    console.error('[GalleryService] Failed to fetch albums:', error);
    return [];
  }
}

/**
 * Fetch media items from the gallery with pagination
 */
export async function fetchGalleryMedia(
  options: FetchGalleryOptions = {}
): Promise<GalleryPage> {
  const {
    albumId,
    limit = 50,
    cursor,
    mediaTypes = ['image', 'video'],
    sortOrder = 'desc',
  } = options;
  
  if (!Capacitor.isNativePlatform()) {
    return { items: [], hasMore: false };
  }
  
  try {
    const mediaOptions: any = {
      quantity: limit,
      sort: sortOrder === 'desc' ? 'newest' : 'oldest',
    };
    
    if (albumId) {
      mediaOptions.albumIdentifier = albumId;
    }
    
    // Filter by media type
    if (mediaTypes.length === 1) {
      mediaOptions.types = mediaTypes[0] === 'image' ? 'photos' : 'videos';
    } else {
      mediaOptions.types = 'all';
    }
    
    // Handle pagination cursor (offset-based for this plugin)
    if (cursor) {
      mediaOptions.offset = parseInt(cursor, 10);
    }
    
    const result = await Media.getMedias(mediaOptions);
    
    const items: GalleryMediaItem[] = (result.medias || []).map((media: any) => ({
      id: media.identifier,
      type: media.type === 'video' ? 'video' : 'image',
      uri: media.path || '',
      thumbnailUri: media.thumbnailPath,
      width: media.width,
      height: media.height,
      duration: media.duration,
      creationDate: media.creationDate ? new Date(media.creationDate) : undefined,
      filename: media.filename,
    }));
    
    // Calculate next cursor
    const currentOffset = cursor ? parseInt(cursor, 10) : 0;
    const nextOffset = currentOffset + items.length;
    const hasMore = items.length === limit; // Assume more if we got a full page
    
    return {
      items,
      hasMore,
      nextCursor: hasMore ? String(nextOffset) : undefined,
    };
  } catch (error) {
    console.error('[GalleryService] Failed to fetch media:', error);
    return { items: [], hasMore: false };
  }
}

/**
 * Get a specific media item's full-resolution URI
 */
export async function getFullResolutionMedia(
  mediaId: string
): Promise<{ uri: string; blob?: Blob } | null> {
  if (!Capacitor.isNativePlatform()) {
    return null;
  }
  
  try {
    // The media path from getMedias should already be accessible
    // For full resolution, we may need to fetch the original
    const result = await Media.getMedias({
      quantity: 1,
      // Filter to specific media if the plugin supports it
    });
    
    // Find the media by ID
    const media = (result.medias as any[])?.find((m: any) => m.identifier === mediaId);
    
    if (media?.path) {
      return { uri: media.path };
    }
    
    return null;
  } catch (error) {
    console.error('[GalleryService] Failed to get full resolution media:', error);
    return null;
  }
}

/**
 * Convert a gallery item URI to a File object for upload
 * Handles HEIC conversion automatically
 */
export async function galleryItemToFile(item: GalleryMediaItem): Promise<File> {
  // Fetch the blob from the URI
  const response = await fetch(item.uri);
  if (!response.ok) {
    throw new Error(`Failed to fetch media: ${response.status}`);
  }
  
  let blob = await response.blob();
  let mimeType = blob.type || (item.type === 'video' ? 'video/mp4' : 'image/jpeg');
  let extension = item.type === 'video' ? 'mp4' : 'jpg';
  
  // Check for HEIC and convert if needed
  const isHeic = mimeType.toLowerCase().includes('heic') || 
                 mimeType.toLowerCase().includes('heif') ||
                 item.filename?.toLowerCase().endsWith('.heic') ||
                 item.filename?.toLowerCase().endsWith('.heif');
  
  if (item.type === 'image' && isHeic) {
    console.log('[GalleryService] Converting HEIC to JPEG...');
    try {
      const converted = await heic2any({
        blob,
        toType: 'image/jpeg',
        quality: 0.9,
      });
      blob = Array.isArray(converted) ? converted[0] : converted;
      mimeType = 'image/jpeg';
      extension = 'jpg';
    } catch (error) {
      console.error('[GalleryService] HEIC conversion failed:', error);
      // Continue with original blob - browser may still handle it
    }
  }
  
  // Create File object
  const filename = item.filename || `media_${Date.now()}.${extension}`;
  return new File([blob], filename, { type: mimeType });
}
