/**
 * Median.co Native Bridge Detection
 * 
 * Checks if the app is running inside Median's native webview
 * and what native APIs are available.
 */

interface MedianBridgeInfo {
  isMedianApp: boolean;
  bridgeName: 'median' | 'gonern' | null;
  hasFileUpload: boolean;
  hasBackgroundFetch: boolean;
  hasDownloadManager: boolean;
  platform: 'ios' | 'android' | 'web';
  version: string | null;
}

export function detectMedianBridge(): MedianBridgeInfo {
  const w = window as any;

  const isMedian = !!(w.median || w.gonern);
  const bridgeName = w.median ? 'median' : w.gonern ? 'gonern' : null;

  const ua = navigator.userAgent.toLowerCase();
  let platform: 'ios' | 'android' | 'web' = 'web';
  if (isMedian) {
    if (/iphone|ipad|ipod/.test(ua)) platform = 'ios';
    else if (/android/.test(ua)) platform = 'android';
  }

  const bridge = w.median || w.gonern;
  const hasFileUpload = !!(bridge?.file?.upload || bridge?.fileUploader);
  const hasBackgroundFetch = !!(bridge?.backgroundFetch || bridge?.fetch?.background);
  const hasDownloadManager = !!(bridge?.downloadManager || bridge?.download);

  let version: string | null = null;
  try {
    version = bridge?.app?.version || bridge?.getAppVersion?.() || null;
  } catch {
    version = null;
  }

  const info: MedianBridgeInfo = {
    isMedianApp: isMedian,
    bridgeName,
    hasFileUpload,
    hasBackgroundFetch,
    hasDownloadManager,
    platform,
    version,
  };

  console.log('[MedianBridge] Detection result:', info);
  return info;
}

/**
 * Check if we can use native background upload.
 * Currently returns false — will be enabled once we verify
 * Median's native upload API supports TUS or equivalent.
 */
export function canUseNativeUpload(): boolean {
  // TODO: Enable once verified with Median
  return false;
}

/**
 * Get a user-friendly warning message about background upload limitations
 * based on the current platform.
 */
export function getBackgroundUploadWarning(fileSizeMB: number): string | null {
  const info = detectMedianBridge();

  if (info.isMedianApp && info.platform === 'ios' && fileSizeMB > 200) {
    return 'Large upload — please keep the app open until it completes. iOS may pause uploads in the background.';
  }

  if (info.isMedianApp && info.platform === 'android' && fileSizeMB > 500) {
    return 'Large upload in progress — keeping the app open is recommended.';
  }

  if (!info.isMedianApp && fileSizeMB > 100) {
    return 'Large upload — please keep this tab open until it completes.';
  }

  return null;
}
