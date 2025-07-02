
interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateFiles = (mediaFiles: File[]): ValidationResult => {
  const maxSize = 500 * 1024 * 1024; // Increased to 500MB for longer videos
  const supportedVideoTypes = ['video/mp4', 'video/mov', 'video/quicktime', 'video/avi', 'video/x-msvideo', 'video/webm'];
  const supportedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  for (const file of mediaFiles) {
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `File "${file.name}" is too large. Maximum size is 500MB.`
      };
    }
    
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    
    if (isVideo && !supportedVideoTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `Video format "${file.type}" is not supported. Please use MP4, MOV, AVI, or WebM format.`
      };
    }
    
    if (isImage && !supportedImageTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `Image format "${file.type}" is not supported. Please use JPEG, PNG, GIF, or WebP format.`
      };
    }
    
    if (!isVideo && !isImage) {
      return {
        isValid: false,
        error: `File "${file.name}" is not a supported media type.`
      };
    }
  }
  
  return { isValid: true };
};

export const getFileErrorMessage = (file: File, error: any): string => {
  const maxSize = 500 * 1024 * 1024; // 500MB
  
  if (file.size > maxSize) {
    return `File too large: ${file.name} exceeds 500MB limit`;
  }
  
  if (error?.message?.includes('timeout')) {
    return 'Upload timed out. Please check your connection and try again';
  }
  
  if (error?.message?.includes('format') || error?.message?.includes('type')) {
    return `Video format not supported: ${file.name}. Please use MP4, MOV, AVI, or WebM format`;
  }
  
  return `Upload failed for ${file.name}. Please try again`;
};
