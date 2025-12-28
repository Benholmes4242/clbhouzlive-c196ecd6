/**
 * URL validation utility - validates silently, only logs errors
 */
export const isValidImageUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return false;
  }
  
  // Check for common invalid patterns
  if (url === 'null' || url === 'undefined' || url === '') {
    return false;
  }
  
  // Check if it's a valid URL format
  try {
    new URL(url);
    return true;
  } catch {
    // If it's not a full URL, check if it's a relative path
    return url.startsWith('/') || url.startsWith('http');
  }
};
