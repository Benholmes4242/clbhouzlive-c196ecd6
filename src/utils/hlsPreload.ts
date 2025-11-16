/**
 * HLS Preloading Utility
 * Preloads HLS manifests to reduce autoplay delay
 */

export const preloadHlsManifest = async (hlsUrl: string) => {
  try {
    await fetch(hlsUrl, { method: 'GET', mode: 'no-cors' });
  } catch {
    // Fail silently – this is a best-effort optimisation
  }
};
