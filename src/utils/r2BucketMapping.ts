// R2 Bucket Mapping — Backward-Compatible Read Support
// This utility ensures existing media in legacy R2 buckets continues to load correctly

/**
 * Legacy prefix patterns that map to old R2 buckets
 * These remain readable during the migration period
 */
const LEGACY_PREFIX_TO_OLD_BUCKET: Record<string, string> = {
  'avatars/': 'clbhouz-media',
  'profile-images/': 'clbhouz-media',
  'profile-backgrounds/': 'clbhouz-media',
  'post-media/images/': 'clbhouz-media',
  'post-media/img/': 'clbhouz-media',
  'course-media/images/': 'clbhouz-golf-courses',
  'course-images/': 'clbhouz-golf-courses',
  'course-review-media/': 'clbhouz-golf-courses',
  'logos/': 'clbhouz-media',
  'club-logos/': 'clbhouz-media',
  'system/': 'clbhouz-media',
  'system-assets/': 'clbhouz-media',
  // Additional patterns
  'courses/': 'clbhouz-golf-courses',
};

/**
 * New normalized bucket names (for reference)
 */
export const NEW_BUCKET_NAMES = [
  'clbhouz-profile-images',
  'clbhouz-profile-banners',
  'clbhouz-post-images',
  'clbhouz-course-images',
  'clbhouz-club-logos',
  'clbhouz-review-images',
  'clbhouz-system-assets',
] as const;

/**
 * Detects if a URL uses a legacy bucket prefix
 */
export const hasLegacyPrefix = (url: string): boolean => {
  if (!url || !url.includes('media.clbhouz.co.uk')) {
    return false;
  }

  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname.substring(1); // Remove leading slash

    // Check if path starts with any legacy prefix
    return Object.keys(LEGACY_PREFIX_TO_OLD_BUCKET).some(prefix => 
      path.startsWith(prefix)
    );
  } catch {
    return false;
  }
};

/**
 * Detects if a URL uses a new normalized bucket name
 */
export const hasNewBucketPrefix = (url: string): boolean => {
  if (!url || !url.includes('media.clbhouz.co.uk')) {
    return false;
  }

  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname.substring(1);

    return NEW_BUCKET_NAMES.some(bucket => path.startsWith(bucket));
  } catch {
    return false;
  }
};

/**
 * Gets the bucket source for a given URL
 * Returns 'legacy', 'new', or 'unknown'
 */
export const getR2BucketSource = (url: string): 'legacy' | 'new' | 'unknown' => {
  if (!url) return 'unknown';
  
  if (hasLegacyPrefix(url)) return 'legacy';
  if (hasNewBucketPrefix(url)) return 'new';
  
  return 'unknown';
};

/**
 * Validates that an R2 URL is accessible
 * Both legacy and new bucket URLs should work during migration
 */
export const isValidR2Url = (url: string): boolean => {
  if (!url || !url.includes('media.clbhouz.co.uk')) {
    return false;
  }

  const source = getR2BucketSource(url);
  return source === 'legacy' || source === 'new';
};

/**
 * Gets diagnostic info for an R2 URL (useful for debugging)
 */
export const getR2UrlInfo = (url: string) => {
  const source = getR2BucketSource(url);
  const isValid = isValidR2Url(url);
  
  let bucket = 'unknown';
  if (source === 'legacy') {
    const urlObj = new URL(url);
    const path = urlObj.pathname.substring(1);
    const matchedPrefix = Object.keys(LEGACY_PREFIX_TO_OLD_BUCKET).find(prefix => 
      path.startsWith(prefix)
    );
    bucket = matchedPrefix ? LEGACY_PREFIX_TO_OLD_BUCKET[matchedPrefix] : 'unknown';
  } else if (source === 'new') {
    const urlObj = new URL(url);
    const path = urlObj.pathname.substring(1);
    const matchedBucket = NEW_BUCKET_NAMES.find(name => path.startsWith(name));
    bucket = matchedBucket || 'unknown';
  }

  return {
    url,
    source,
    bucket,
    isValid,
  };
};
