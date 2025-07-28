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
 * Extracts environmental colors prioritizing backgrounds over foreground elements
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
      
      const analysisSize = 120;
      canvas.width = analysisSize;
      canvas.height = analysisSize;
      ctx.drawImage(img, 0, 0, analysisSize, analysisSize);
      
      const imageData = ctx.getImageData(0, 0, analysisSize, analysisSize);
      const data = imageData.data;
      
      // Sample from edges and corners first (likely background/environmental)
      const environmentalColors = new Map<string, number>();
      const allColors = new Map<string, number>();
      
      for (let i = 0; i < data.length; i += 8) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        
        if (a < 200) continue;
        
        const [h, s, l] = rgbToHsl(r, g, b);
        
        // Filter for pleasant, mid-tone colors
        if (l < 25 || l > 75 || s < 10 || s > 85) continue;
        
        // Group colors with refined precision
        const hBucket = Math.round(h / 20) * 20;
        const sBucket = Math.round(s / 25) * 25;
        const lBucket = Math.round(l / 20) * 20;
        const colorKey = `${hBucket},${sBucket},${lBucket}`;
        
        const pixelIndex = Math.floor(i / 4);
        const x = pixelIndex % analysisSize;
        const y = Math.floor(pixelIndex / analysisSize);
        
        // Prioritize edge pixels (likely environmental/background)
        const isEdgePixel = x < 20 || x > analysisSize - 20 || y < 20 || y > analysisSize - 20;
        const weight = isEdgePixel ? 3 : 1;
        
        allColors.set(colorKey, (allColors.get(colorKey) || 0) + weight);
        
        if (isEdgePixel) {
          environmentalColors.set(colorKey, (environmentalColors.get(colorKey) || 0) + weight);
        }
      }
      
      // Prefer environmental colors, fallback to all colors
      const sourceColors = environmentalColors.size > 2 ? environmentalColors : allColors;
      
      if (sourceColors.size === 0) {
        resolve(['rgb(108, 117, 125)', 'rgb(134, 142, 150)']); // Neutral fallback
        return;
      }
      
      const sortedColors = Array.from(sourceColors.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([color]) => {
          const [h, s, l] = color.split(',').map(Number);
          
          // Apply sophisticated neutralizing: reduce saturation, balance lightness
          const neutralizedS = Math.min(45, s * 0.7); // Strong desaturation
          const neutralizedL = Math.max(35, Math.min(65, l * 0.9)); // Mid-tone range
          
          const [r, g, b] = hslToRgb(h, neutralizedS, neutralizedL);
          return { r, g, b, h, s: neutralizedS, l: neutralizedL, count: sourceColors.get(color)! };
        });
      
      // Generate cohesive 1-2 color palette
      const primaryColor = sortedColors[0];
      const colors: string[] = [];
      
      // Primary color (most dominant)
      colors.push(`rgb(${primaryColor.r}, ${primaryColor.g}, ${primaryColor.b})`);
      
      // Find most harmonious second color
      let secondaryColor = primaryColor;
      
      for (let i = 1; i < sortedColors.length; i++) {
        const candidate = sortedColors[i];
        const hueDiff = Math.abs(candidate.h - primaryColor.h);
        const normalizedHueDiff = Math.min(hueDiff, 360 - hueDiff);
        
        // Prefer analogous colors (15-45 degrees apart) or neutrals
        if (normalizedHueDiff < 45 || normalizedHueDiff > 315) {
          secondaryColor = candidate;
          break;
        }
      }
      
      // If we found a different secondary color, use it
      if (secondaryColor !== primaryColor) {
        colors.push(`rgb(${secondaryColor.r}, ${secondaryColor.g}, ${secondaryColor.b})`);
      } else {
        // Generate a subtle variation of the primary
        const variantL = Math.max(30, Math.min(70, primaryColor.l + (primaryColor.l > 50 ? -10 : 10)));
        const variantS = Math.max(15, primaryColor.s * 0.8);
        const [vR, vG, vB] = hslToRgb(primaryColor.h, variantS, variantL);
        colors.push(`rgb(${vR}, ${vG}, ${vB})`);
      }
      
      resolve(colors);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for color analysis'));
    };
    
    img.src = imageUrl;
  });
};

/**
 * Generates a cohesive, muted gradient from extracted environmental colors
 */
export const generateColorBasedBackground = async (imageUrl: string): Promise<string> => {
  try {
    const colors = await extractDominantColors(imageUrl);
    
    // Use only 1-2 key colors for cohesive, premium look
    const primaryColor = colors[0];
    const secondaryColor = colors[1] || primaryColor;
    
    // Apply sophisticated color adjustment for background use
    const createBackgroundColor = (rgb: string, adjustment: number = 0.75) => {
      const match = rgb.match(/\d+/g);
      if (!match) return rgb;
      
      const [r, g, b] = match.map(Number);
      const [h, s, l] = rgbToHsl(r, g, b);
      
      // Create muted, sophisticated background tones
      const backgroundL = Math.max(30, Math.min(50, l * adjustment)); // Darker for text contrast
      const backgroundS = Math.max(15, Math.min(35, s * 0.6)); // Heavily desaturated
      
      const [newR, newG, newB] = hslToRgb(h, backgroundS, backgroundL);
      return `rgb(${newR}, ${newG}, ${newB})`;
    };
    
    const backgroundPrimary = createBackgroundColor(primaryColor, 0.8);
    const backgroundSecondary = createBackgroundColor(secondaryColor, 0.6);
    
    // Create subtle, cohesive 2-color gradient with soft text overlay
    return `linear-gradient(135deg, ${backgroundPrimary} 0%, ${backgroundSecondary} 100%), 
            linear-gradient(180deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.25) 100%)`;
  } catch (error) {
    console.error('Error generating color-based background:', error);
    // Neutral, elegant fallback
    return 'linear-gradient(135deg, rgb(75, 85, 99) 0%, rgb(55, 65, 81) 100%), linear-gradient(180deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.25) 100%)';
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