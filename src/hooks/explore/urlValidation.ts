
export const isValidImageUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    console.log('Invalid URL - empty or not string:', url);
    return false;
  }
  
  // Check for common invalid patterns
  if (url === 'null' || url === 'undefined' || url === '') {
    console.log('Invalid URL - null/undefined string:', url);
    return false;
  }
  
  // Check if it's a valid URL format
  try {
    new URL(url);
    console.log('Valid URL:', url);
    return true;
  } catch {
    // If it's not a full URL, check if it's a relative path
    const isValid = url.startsWith('/') || url.startsWith('http');
    console.log('URL validation result:', url, isValid);
    return isValid;
  }
};
