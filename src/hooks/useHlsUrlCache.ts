import { getCloudflareStreamHLS } from '@/utils/cloudflareStreamAPI';

// Cache for HLS URLs to avoid redundant API calls
const hlsUrlCache = new Map<string, Promise<string>>();

export const useHlsUrlCache = () => {
  const getHlsUrl = async (uid: string): Promise<string> => {
    if (hlsUrlCache.has(uid)) {
      return hlsUrlCache.get(uid)!;
    }

    // Cache the promise to prevent duplicate requests
    const urlPromise = getCloudflareStreamHLS(uid);
    hlsUrlCache.set(uid, urlPromise);
    
    try {
      const url = await urlPromise;
      // Replace promise with resolved value for immediate returns
      hlsUrlCache.set(uid, Promise.resolve(url));
      return url;
    } catch (error) {
      // Remove failed requests from cache
      hlsUrlCache.delete(uid);
      throw error;
    }
  };

  const preloadHlsUrl = (uid: string) => {
    // Fire and forget - start loading but don't wait
    getHlsUrl(uid).catch(() => {
      // Silently handle errors for preload
    });
  };

  const preloadHlsUrls = (uids: string[]) => {
    // Preload up to 6 URLs to avoid overwhelming the API
    uids.slice(0, 6).forEach(preloadHlsUrl);
  };

  return {
    getHlsUrl,
    preloadHlsUrl,
    preloadHlsUrls
  };
};

// Warm hls.js chunk early
export const warmHlsJs = () => {
  // Fire and forget to warm the code-split chunk
  import('hls.js').catch(() => {
    // Silently handle import errors
  });
};