
interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateFiles = (mediaFiles: File[]): ValidationResult => {
  const supportedVideoTypes = ['video/mp4', 'video/mov', 'video/quicktime', 'video/avi', 'video/x-msvideo', 'video/webm'];
  const supportedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  for (const file of mediaFiles) {
    // Add file size limits for security
    const maxFileSize = 500 * 1024 * 1024; // 500MB limit
    if (file.size > maxFileSize) {
      return {
        isValid: false,
        error: `File "${file.name}" is too large. Maximum file size is 500MB.`
      };
    }
    
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    
    // Verify MIME type matches file extension for security
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.split('.').pop();
    
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
    
    // Additional extension validation for security
    if (isImage) {
      const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      if (!fileExtension || !imageExtensions.includes(fileExtension)) {
        return {
          isValid: false,
          error: `File "${file.name}" does not have a valid image extension.`
        };
      }
    }
    
    if (isVideo) {
      const videoExtensions = ['mp4', 'mov', 'avi', 'webm'];
      if (!fileExtension || !videoExtensions.includes(fileExtension)) {
        return {
          isValid: false,
          error: `File "${file.name}" does not have a valid video extension.`
        };
      }
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
  // No file size limit - removed size check
  
  if (error?.message?.includes('timeout')) {
    return 'Upload timed out. Please check your connection and try again';
  }
  
  if (error?.message?.includes('format') || error?.message?.includes('type')) {
    return `Video format not supported: ${file.name}. Please use MP4, MOV, AVI, or WebM format`;
  }
  
  return `Upload failed for ${file.name}. Please try again`;
};
