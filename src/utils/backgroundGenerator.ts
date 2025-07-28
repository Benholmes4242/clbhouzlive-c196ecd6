/**
 * Utility functions for generating dynamic backgrounds from profile photos
 * Inspired by Apple Music and Spotify's color-based background approach
 */

/**
 * Extracts dominant colors from an image using canvas analysis
 */
export const extractDominantColors = (imageUrl: string): Promise<string[]> => {
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
      
      // Use a smaller canvas for color analysis (performance)
      const analysisSize = 100;
      canvas.width = analysisSize;
      canvas.height = analysisSize;
      
      // Draw the image scaled down
      ctx.drawImage(img, 0, 0, analysisSize, analysisSize);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, analysisSize, analysisSize);
      const data = imageData.data;
      
      // Collect colors (sample every 4th pixel for performance)
      const colorMap = new Map<string, number>();
      
      for (let i = 0; i < data.length; i += 16) { // Skip pixels for performance
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        
        // Skip transparent or very light/dark pixels
        if (a < 128 || (r + g + b) < 50 || (r + g + b) > 650) continue;
        
        // Group similar colors together (reduce precision)
        const rBucket = Math.floor(r / 32) * 32;
        const gBucket = Math.floor(g / 32) * 32;
        const bBucket = Math.floor(b / 32) * 32;
        
        const colorKey = `${rBucket},${gBucket},${bBucket}`;
        colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
      }
      
      // Sort colors by frequency and get top colors
      const sortedColors = Array.from(colorMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5) // Get top 5 colors
        .map(([color]) => {
          const [r, g, b] = color.split(',').map(Number);
          return `rgb(${r}, ${g}, ${b})`;
        });
      
      // Ensure we have at least 2 colors for gradient
      if (sortedColors.length < 2) {
        sortedColors.push('rgb(64, 64, 64)', 'rgb(32, 32, 32)');
      }
      
      resolve(sortedColors);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for color analysis'));
    };
    
    img.src = imageUrl;
  });
};

/**
 * Generates a color palette gradient from an image
 */
export const generateColorBasedBackground = async (imageUrl: string): Promise<string> => {
  try {
    const colors = await extractDominantColors(imageUrl);
    
    // Create a gradient using the dominant colors
    const primaryColor = colors[0];
    const secondaryColor = colors[1] || colors[0];
    
    // Convert RGB to darker, more muted versions for better text contrast
    const darkenColor = (rgb: string, factor: number = 0.3) => {
      const match = rgb.match(/\d+/g);
      if (!match) return rgb;
      
      const [r, g, b] = match.map(Number);
      return `rgb(${Math.floor(r * factor)}, ${Math.floor(g * factor)}, ${Math.floor(b * factor)})`;
    };
    
    const darkPrimary = darkenColor(primaryColor, 0.4);
    const darkSecondary = darkenColor(secondaryColor, 0.2);
    
    return `linear-gradient(135deg, ${darkPrimary} 0%, ${darkSecondary} 50%, rgba(0, 0, 0, 0.8) 100%)`;
  } catch (error) {
    console.error('Error generating color-based background:', error);
    // Fallback to default gradient
    return 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-foreground)) 100%)';
  }
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