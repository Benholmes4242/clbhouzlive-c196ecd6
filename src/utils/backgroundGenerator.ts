/**
 * Utility functions for generating dynamic backgrounds from profile photos
 * Inspired by Apple Music and Spotify's dynamic background approach
 */

/**
 * Creates a canvas element with a blurred and colorized version of the source image
 * This mimics Apple Music's background generation approach
 */
export const generateDynamicBackground = (
  imageUrl: string,
  width: number = 400,
  height: number = 600
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw the image scaled to fill the canvas
      const scale = Math.max(width / img.width, height / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const offsetX = (width - scaledWidth) / 2;
      const offsetY = (height - scaledHeight) / 2;
      
      ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
      
      // Apply blur effect using canvas filter
      ctx.filter = 'blur(40px) saturate(1.2) brightness(0.8)';
      ctx.drawImage(canvas, 0, 0);
      
      // Add a subtle gradient overlay for better text contrast
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
      gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.4)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
      
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      
      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      resolve(dataUrl);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageUrl;
  });
};

/**
 * Creates CSS for a dynamic background with proper gradients and overlays
 */
export const createDynamicBackgroundStyle = (
  imageUrl: string | null,
  fallbackGradient: string = 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-foreground)))'
): React.CSSProperties => {
  if (!imageUrl) {
    return {
      background: fallbackGradient,
    };
  }
  
  return {
    backgroundImage: `
      linear-gradient(180deg, 
        rgba(0, 0, 0, 0.3) 0%, 
        rgba(0, 0, 0, 0.4) 70%, 
        rgba(0, 0, 0, 0.6) 100%
      ),
      url(${imageUrl})
    `,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    filter: 'blur(20px) saturate(1.2)',
    transform: 'scale(1.1)', // Prevent edge artifacts
  };
};

/**
 * Generates a gradient overlay for ensuring text readability
 */
export const createTextOverlay = (): React.CSSProperties => {
  return {
    background: `
      linear-gradient(180deg, 
        rgba(0, 0, 0, 0.2) 0%, 
        rgba(0, 0, 0, 0.3) 50%, 
        rgba(0, 0, 0, 0.5) 100%
      )
    `,
  };
};