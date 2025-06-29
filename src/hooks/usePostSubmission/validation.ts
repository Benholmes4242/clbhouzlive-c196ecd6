
export const validatePostSubmission = (user: any, content: string, mediaFiles: File[]): boolean => {
  return !(!user || (!content.trim() && mediaFiles.length === 0));
};

export const hasVideos = (mediaFiles: File[]): boolean => {
  return mediaFiles.some(file => file.type.startsWith('video/'));
};
