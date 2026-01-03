/**
 * Infer media type from file (handles iOS empty MIME type)
 * iOS Safari often returns empty file.type for videos from photo library
 */
export const getMediaType = (file: File): 'image' | 'video' | 'unknown' => {
  const mime = file.type.toLowerCase();
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  
  // Check MIME first
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  
  // Fallback to extension (iOS often returns empty MIME for videos)
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif'];
  const videoExts = ['mp4', 'mov', 'webm', 'm4v', '3gp', 'avi'];
  
  if (imageExts.includes(ext)) return 'image';
  if (videoExts.includes(ext)) return 'video';
  
  // Log for debugging unknown types
  console.warn('[getMediaType] Unknown file type:', { name: file.name, type: file.type, ext });
  
  return 'unknown';
};

export const isVideoFile = (file: File): boolean => getMediaType(file) === 'video';
export const isImageFile = (file: File): boolean => getMediaType(file) === 'image';
