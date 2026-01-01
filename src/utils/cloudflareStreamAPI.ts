// Cloudflare Stream API integration for fetching HLS manifest URLs

interface CloudflareStreamVideo {
  uid: string;
  status: {
    state: 'ready' | 'inprogress' | 'error';
  };
  playback?: {
    hls?: string;
    dash?: string;
  };
  thumbnail?: string;
  preview?: string;
  meta?: {
    name?: string;
  };
}

interface CloudflareStreamResponse {
  success: boolean;
  result?: CloudflareStreamVideo;
  errors?: Array<{ code: number; message: string; }>;
}

// Cache for API responses to avoid repeated calls
const streamCache = new Map<string, { data: CloudflareStreamVideo; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch video details from Cloudflare Stream API
 */
export async function fetchCloudflareStreamVideo(videoId: string): Promise<CloudflareStreamVideo | null> {
  // Check cache first
  const cached = streamCache.get(videoId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    // Use Supabase edge function to fetch from Cloudflare API
    // This avoids CORS issues and keeps API credentials secure
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data, error } = await supabase.functions.invoke('cloudflare-stream-details', {
      body: { videoId }
    });

    if (error) {
      console.error('Error fetching Cloudflare Stream video details:', error);
      return null;
    }

    if (!data.success || !data.result) {
      console.warn('Cloudflare Stream API returned unsuccessful response:', data);
      return null;
    }

    // Cache the result
    streamCache.set(videoId, {
      data: data.result,
      timestamp: Date.now()
    });

    return data.result;
  } catch (error) {
    console.error('Failed to fetch Cloudflare Stream video details:', error);
    return null;
  }
}

/**
 * Get HLS URL for a Cloudflare Stream video
 */
export async function getCloudflareStreamHLS(videoId: string): Promise<string | null> {
  const video = await fetchCloudflareStreamVideo(videoId);
  
  if (!video || video.status.state !== 'ready') {
    // Fallback to constructed URL if API fails or video not ready
    return `https://videodelivery.net/${videoId}/manifest/video.m3u8`;
  }

  return video.playback?.hls || `https://videodelivery.net/${videoId}/manifest/video.m3u8`;
}

/**
 * Get poster/thumbnail URL for a Cloudflare Stream video
 */
export async function getCloudflareStreamPoster(videoId: string, options: {
  width?: number;
  height?: number;
  time?: number;
} = {}): Promise<string | null> {
  const video = await fetchCloudflareStreamVideo(videoId);
  
  if (!video || video.status.state !== 'ready') {
    // Fallback to constructed URL if API fails
    const { width = 1280, height = 720, time = 1 } = options;
    return `https://videodelivery.net/${videoId}/thumbnails/thumbnail.jpg?width=${width}&height=${height}&time=${time}s`;
  }

  // Use API thumbnail if available, otherwise construct one
  if (video.thumbnail) {
    return video.thumbnail;
  }

  const { width = 1280, height = 720, time = 1 } = options;
  return `https://videodelivery.net/${videoId}/thumbnails/thumbnail.jpg?width=${width}&height=${height}&time=${time}s`;
}

/**
 * Batch fetch multiple video details (useful for feeds)
 */
export async function batchFetchCloudflareStreamVideos(videoIds: string[]): Promise<Map<string, CloudflareStreamVideo>> {
  const results = new Map<string, CloudflareStreamVideo>();
  
  // Check cache first
  const uncachedIds: string[] = [];
  for (const id of videoIds) {
    const cached = streamCache.get(id);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      results.set(id, cached.data);
    } else {
      uncachedIds.push(id);
    }
  }

  // Fetch uncached videos in parallel (with rate limiting)
  if (uncachedIds.length > 0) {
    const batchSize = 5; // Process 5 at a time to avoid rate limits
    
    for (let i = 0; i < uncachedIds.length; i += batchSize) {
      const batch = uncachedIds.slice(i, i + batchSize);
      
      const promises = batch.map(async (videoId) => {
        const video = await fetchCloudflareStreamVideo(videoId);
        return { videoId, video };
      });

      const batchResults = await Promise.allSettled(promises);
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled' && result.value.video) {
          results.set(result.value.videoId, result.value.video);
        }
      }
      
      // Small delay between batches to be nice to the API
      if (i + batchSize < uncachedIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  return results;
}

/**
 * Clear cache for a specific video (useful after uploads)
 */
export function clearVideoCache(videoId: string): void {
  streamCache.delete(videoId);
}

/**
 * Clear entire cache
 */
export function clearAllVideoCache(): void {
  streamCache.clear();
}
