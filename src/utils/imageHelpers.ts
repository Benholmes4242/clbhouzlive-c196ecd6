// Generate responsive image sources for different screen sizes
export const generateSrcSet = (originalSrc: string, quality: 'low' | 'medium' | 'high'): string => {
  if (!originalSrc.includes('supabase')) return '';
  
  const sizes = [400, 800, 1200, 1600];
  const qualities = { low: 30, medium: 70, high: 90 };
  
  return sizes.map(size => {
    const url = new URL(originalSrc);
    url.searchParams.set('width', size.toString());
    url.searchParams.set('quality', qualities[quality].toString());
    url.searchParams.set('format', 'webp');
    return `${url.toString()} ${size}w`;
  }).join(', ');
};

// Generate a blur placeholder data URL
export const generateBlurPlaceholder = (): string => {
  // Create a tiny 10x10 blur placeholder
  const canvas = document.createElement('canvas');
  canvas.width = 10;
  canvas.height = 10;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  // Create gradient placeholder
  const gradient = ctx.createLinearGradient(0, 0, 10, 10);
  gradient.addColorStop(0, '#f3f4f6');
  gradient.addColorStop(1, '#e5e7eb');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 10, 10);
  
  return canvas.toDataURL('image/jpeg', 0.1);
};

// Get optimal quality based on connection
export const getOptimalQuality = (quality: 'low' | 'medium' | 'high' | 'auto'): 'low' | 'medium' | 'high' => {
  if (quality !== 'auto') return quality;
  
  const connection = (navigator as any)?.connection;
  if (!connection) return 'medium';
  
  const { effectiveType, downlink } = connection;
  
  if (effectiveType === '4g' && downlink > 5) return 'high';
  if (effectiveType === '3g' || downlink > 1.5) return 'medium';
  return 'low';
};

// Quality-based image optimization
export const getQualityOptimizedUrl = (originalSrc: string, targetQuality: 'low' | 'medium' | 'high'): string => {
  const widthMap = { low: 400, medium: 800, high: 1200 };
  const width = widthMap[targetQuality];
  
  // If it's already a Supabase storage URL, add transformation params
  if (originalSrc.includes('supabase')) {
    const url = new URL(originalSrc);
    url.searchParams.set('width', width.toString());
    url.searchParams.set('format', 'webp');
    
    const qualityMap = { low: '30', medium: '70', high: '90' };
    url.searchParams.set('quality', qualityMap[targetQuality]);
    
    return url.toString();
  }
  
  return originalSrc;
};