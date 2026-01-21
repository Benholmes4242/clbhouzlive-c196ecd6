/**
 * Profile Video Prefetch System
 * 
 * Prefetches HLS manifests for profile videos when user hovers over profile links.
 * Supports both own profile and other users' profiles.
 */

import { supabase } from '@/integrations/supabase/client';
import { preloadHlsManifest } from '@/utils/hlsPreload';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import { extractCloudflareUid } from '@/utils/videoIdUtils';

let prefetchPromise: Promise<string[] | null> | null = null;
let lastPrefetchTime = 0;
let lastPrefetchedIds: string[] = [];
let lastPrefetchedUserId: string | null = null;
const PREFETCH_COOLDOWN_MS = 30000;
const PROFILE_PREFETCH_COUNT = 6;

/**
 * Prefetch profile videos for a specific user
 * @param userId - User ID to prefetch videos for (null = current user)
 */
export async function prefetchProfileVideos(userId?: string | null): Promise<string[] | null> {
  const now = Date.now();
  
  // Normalize userId - undefined, null, and empty string all mean "current user"
  const normalizedUserId = userId || null;
  
  // If same user was recently prefetched, skip
  if (now - lastPrefetchTime < PREFETCH_COOLDOWN_MS && lastPrefetchedUserId === normalizedUserId) {
    console.log('[ProfilePrefetch] Skipped - within cooldown for same user');
    return lastPrefetchedIds;
  }
  
  if (prefetchPromise) {
    console.log('[ProfilePrefetch] Already in progress');
    return prefetchPromise;
  }
  
  lastPrefetchTime = now;
  
  prefetchPromise = (async () => {
    try {
      let targetUserId = normalizedUserId;
      
      // If no userId provided, get current user (own profile)
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('[ProfilePrefetch] No authenticated user');
          return null;
        }
        targetUserId = user.id;
        console.log('[ProfilePrefetch] Starting OWN profile video prefetch');
      } else {
        console.log(`[ProfilePrefetch] Starting profile video prefetch for user: ${targetUserId.slice(0, 8)}...`);
      }
      
      const startTime = performance.now();
      
      // Fetch user's recent video posts
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          post_media!inner (
            id,
            media_url,
            media_type
          )
        `)
        .eq('user_id', targetUserId)
        .eq('post_media.media_type', 'video')
        .order('created_at', { ascending: false })
        .limit(PROFILE_PREFETCH_COUNT);
      
      if (error) {
        console.error('[ProfilePrefetch] Query error:', error.message);
        return null;
      }
      
      if (!data || data.length === 0) {
        console.log('[ProfilePrefetch] No videos found for user');
        return null;
      }
      
      // Prefetch videos in parallel
      const prefetchedIds: string[] = [];
      
      for (const post of data) {
        // Access the first media item
        const mediaItems = post.post_media as Array<{ id: string; media_url: string; media_type: string }>;
        const mediaUrl = mediaItems?.[0]?.media_url;
        const streamId = extractCloudflareUid(mediaUrl || '');
        
        if (streamId) {
          prefetchedIds.push(streamId);
          const hlsUrl = generateStreamHlsUrl(streamId);
          console.log(`[ProfilePrefetch] Prefetching [${prefetchedIds.length - 1}]: ${streamId.slice(0, 8)}...`);
          preloadHlsManifest(hlsUrl, streamId);
        }
      }
      
      lastPrefetchedIds = prefetchedIds;
      lastPrefetchedUserId = targetUserId;
      const elapsed = performance.now() - startTime;
      console.log(`[ProfilePrefetch] ✅ Initiated prefetch for ${prefetchedIds.length} videos in ${elapsed.toFixed(0)}ms`);
      
      return prefetchedIds;
    } catch (err) {
      console.error('[ProfilePrefetch] Failed:', err);
      return null;
    } finally {
      prefetchPromise = null;
    }
  })();
  
  return prefetchPromise;
}

/**
 * Reset prefetch state - useful for testing or after logout
 */
export function resetProfilePrefetch(): void {
  prefetchPromise = null;
  lastPrefetchTime = 0;
  lastPrefetchedIds = [];
  lastPrefetchedUserId = null;
}

/**
 * Resolve username to user ID for prefetch
 * Returns null if username cannot be resolved
 */
export async function resolveUsernameToId(username: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('username', username)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return data.id;
  } catch {
    return null;
  }
}
