/**
 * Lightweight color extraction from video frames
 */

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface HSL {
  h: number;
  s: number;
  l: number;
}

/**
 * Extract dominant color from video frame via canvas sampling
 */
export function extractDominantColor(video: HTMLVideoElement): HSL | null {
  if (!video || video.readyState < 2) return null;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  // Downsample to 16x16 for performance
  canvas.width = 16;
  canvas.height = 16;

  try {
    ctx.drawImage(video, 0, 0, 16, 16);
    const imageData = ctx.getImageData(0, 0, 16, 16);
    const pixels = imageData.data;

    let r = 0, g = 0, b = 0, count = 0;

    // Average all pixels
    for (let i = 0; i < pixels.length; i += 4) {
      r += pixels[i];
      g += pixels[i + 1];
      b += pixels[i + 2];
      count++;
    }

    const rgb: RGB = {
      r: Math.round(r / count),
      g: Math.round(g / count),
      b: Math.round(b / count)
    };

    return rgbToHsl(rgb);
  } catch (err) {
    // CORS or video not ready
    return null;
  }
}

/**
 * Convert RGB to HSL
 */
function rgbToHsl({ r, g, b }: RGB): HSL {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

/**
 * Calculate relative luminance for contrast checking
 */
export function getRelativeLuminance(hsl: HSL): number {
  // Simple approximation: use lightness value
  return hsl.l / 100;
}
