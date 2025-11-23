// Detect if user is on a mobile device
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

// Detect if user is on iOS specifically
export const isIOSDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

// Get reduced page size for mobile devices
export const getOptimalPageSize = (defaultSize: number): number => {
  if (isMobileDevice()) {
    return Math.floor(defaultSize * 0.6); // 60% of default on mobile
  }
  return defaultSize;
};
