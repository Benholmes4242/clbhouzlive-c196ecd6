/**
 * Utility functions for generating dynamic backgrounds from profile photos
 * Inspired by Apple Music and Spotify's color-based background approach
 */

/**
 * Converts RGB to HSL for better color manipulation
 */
const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
};

/**
 * Converts HSL back to RGB
 */
const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
  h /= 360; s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h * 6) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 1/6) { r = c; g = x; b = 0; }
  else if (1/6 <= h && h < 2/6) { r = x; g = c; b = 0; }
  else if (2/6 <= h && h < 3/6) { r = 0; g = c; b = x; }
  else if (3/6 <= h && h < 4/6) { r = 0; g = x; b = c; }
  else if (4/6 <= h && h < 5/6) { r = x; g = 0; b = c; }
  else if (5/6 <= h && h < 1) { r = c; g = 0; b = x; }

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255)
  ];
};

/**
 * Extracts and harmonizes colors from an image for elegant gradients
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
      
      // Use a smaller canvas for color analysis
      const analysisSize = 150;
      canvas.width = analysisSize;
      canvas.height = analysisSize;
      
      // Draw the image scaled down
      ctx.drawImage(img, 0, 0, analysisSize, analysisSize);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, analysisSize, analysisSize);
      const data = imageData.data;
      
      // Collect colors with better filtering
      const colorMap = new Map<string, number>();
      
      for (let i = 0; i < data.length; i += 12) { // Sample more pixels
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        
        // Skip transparent pixels
        if (a < 200) continue;
        
        // Convert to HSL for better analysis
        const [h, s, l] = rgbToHsl(r, g, b);
        
        // Filter out colors that are too dark, too light, or too gray
        if (l < 20 || l > 85 || s < 15) continue;
        
        // Group similar colors with higher precision
        const hBucket = Math.round(h / 15) * 15; // Group hues in 15° buckets
        const sBucket = Math.round(s / 20) * 20; // Group saturation in 20% buckets
        const lBucket = Math.round(l / 15) * 15; // Group lightness in 15% buckets
        
        const colorKey = `${hBucket},${sBucket},${lBucket}`;
        colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
      }
      
      // Get top colors and harmonize them
      const sortedColors = Array.from(colorMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8) // Get more colors to work with
        .map(([color]) => {
          const [h, s, l] = color.split(',').map(Number);
          
          // Harmonize colors: boost saturation slightly, adjust lightness
          const harmonizedS = Math.min(s + 10, 70); // Boost saturation but cap it
          const harmonizedL = Math.max(30, Math.min(70, l)); // Keep lightness in pleasant range
          
          const [r, g, b] = hslToRgb(h, harmonizedS, harmonizedL);
          return { r, g, b, h, s: harmonizedS, l: harmonizedL, count: colorMap.get(color)! };
        });
      
      if (sortedColors.length === 0) {
        // Fallback to warm neutral colors
        resolve(['rgb(120, 119, 196)', 'rgb(255, 159, 124)', 'rgb(255, 207, 84)']);
        return;
      }
      
      // Generate harmonious color palette
      const baseColor = sortedColors[0];
      const harmonizedColors: string[] = [];
      
      // Add the primary color
      harmonizedColors.push(`rgb(${baseColor.r}, ${baseColor.g}, ${baseColor.b})`);
      
      // Generate complementary and analogous colors
      const complementaryH = (baseColor.h + 180) % 360;
      const analogous1H = (baseColor.h + 30) % 360;
      const analogous2H = (baseColor.h - 30 + 360) % 360;
      
      // Create harmonious variations
      const variations = [
        { h: complementaryH, s: Math.max(25, baseColor.s - 15), l: Math.max(40, baseColor.l + 10) },
        { h: analogous1H, s: Math.max(30, baseColor.s - 10), l: Math.min(65, baseColor.l + 15) },
        { h: analogous2H, s: Math.max(35, baseColor.s - 5), l: Math.max(35, baseColor.l - 5) }
      ];
      
      variations.forEach(({ h, s, l }) => {
        const [r, g, b] = hslToRgb(h, s, l);
        harmonizedColors.push(`rgb(${r}, ${g}, ${b})`);
      });
      
      resolve(harmonizedColors.slice(0, 3)); // Return max 3 colors
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for color analysis'));
    };
    
    img.src = imageUrl;
  });
};

/**
 * Generates a stylized color-based gradient from an image
 */
export const generateColorBasedBackground = async (imageUrl: string): Promise<string> => {
  try {
    const colors = await extractDominantColors(imageUrl);
    
    // Create a balanced, harmonious gradient
    const primaryColor = colors[0];
    const secondaryColor = colors[1] || primaryColor;
    const tertiaryColor = colors[2] || secondaryColor;
    
    // Apply gentle darkening for text contrast while maintaining color beauty
    const adjustColorForBackground = (rgb: string, darknessFactor: number = 0.7) => {
      const match = rgb.match(/\d+/g);
      if (!match) return rgb;
      
      const [r, g, b] = match.map(Number);
      
      // Convert to HSL for better control
      const [h, s, l] = rgbToHsl(r, g, b);
      
      // Adjust lightness for background use - keep it elegant but readable
      const adjustedL = Math.max(25, Math.min(55, l * darknessFactor));
      // Slightly reduce saturation for more sophisticated look
      const adjustedS = Math.max(20, s * 0.85);
      
      const [newR, newG, newB] = hslToRgb(h, adjustedS, adjustedL);
      return `rgb(${newR}, ${newG}, ${newB})`;
    };
    
    const backgroundPrimary = adjustColorForBackground(primaryColor, 0.8);
    const backgroundSecondary = adjustColorForBackground(secondaryColor, 0.65);
    const backgroundTertiary = adjustColorForBackground(tertiaryColor, 0.5);
    
    // Create a sophisticated 3-color gradient
    return `linear-gradient(135deg, ${backgroundPrimary} 0%, ${backgroundSecondary} 60%, ${backgroundTertiary} 100%)`;
  } catch (error) {
    console.error('Error generating color-based background:', error);
    // Elegant fallback gradient
    return 'linear-gradient(135deg, rgb(120, 119, 196) 0%, rgb(255, 159, 124) 60%, rgb(255, 207, 84) 100%)';
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