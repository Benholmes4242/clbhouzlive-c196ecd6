import { useState, useEffect, useRef } from 'react';

export type GlassMode = 'standard' | 'elevated' | 'dark';

interface AdaptiveGlassConfig {
  lightThreshold?: number;
  darkThreshold?: number;
  updateInterval?: number;
}

export const useAdaptiveGlass = (config: AdaptiveGlassConfig = {}) => {
  const {
    lightThreshold = 0.85,
    darkThreshold = 0.35,
    updateInterval = 100
  } = config;

  const [glassMode, setGlassMode] = useState<GlassMode>('standard');
  const sentinelRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();

  // Calculate luminance from RGB values
  const calculateLuminance = (r: number, g: number, b: number): number => {
    // Convert to sRGB
    const rs = r / 255;
    const gs = g / 255;
    const bs = b / 255;

    // Apply gamma correction
    const rLinear = rs <= 0.03928 ? rs / 12.92 : Math.pow((rs + 0.055) / 1.055, 2.4);
    const gLinear = gs <= 0.03928 ? gs / 12.92 : Math.pow((gs + 0.055) / 1.055, 2.4);
    const bLinear = bs <= 0.03928 ? bs / 12.92 : Math.pow((bs + 0.055) / 1.055, 2.4);

    // Calculate relative luminance
    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
  };

  // Sample background luminance using canvas
  const sampleBackgroundLuminance = (): number => {
    if (!sentinelRef.current) return 0.5; // Default fallback

    const rect = sentinelRef.current.getBoundingClientRect();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return 0.5;

    // Set canvas size to sample area
    const sampleWidth = Math.min(rect.width, 100);
    const sampleHeight = Math.min(rect.height, 20);
    canvas.width = sampleWidth;
    canvas.height = sampleHeight;

    try {
      // Draw current viewport content to canvas
      ctx.drawImage(
        document.documentElement as any,
        rect.left, rect.top, sampleWidth, sampleHeight,
        0, 0, sampleWidth, sampleHeight
      );

      // Get image data and calculate average luminance
      const imageData = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
      const data = imageData.data;
      
      let totalLuminance = 0;
      const pixelCount = data.length / 4;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        totalLuminance += calculateLuminance(r, g, b);
      }

      return totalLuminance / pixelCount;
    } catch (error) {
      // Fallback: analyze page sections
      return analyzePageSections();
    }
  };

  // Fallback method: analyze page sections
  const analyzePageSections = (): number => {
    if (!sentinelRef.current) return 0.5;

    const rect = sentinelRef.current.getBoundingClientRect();
    const elements = document.elementsFromPoint(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2
    );

    // Check for common light backgrounds
    for (const element of elements) {
      const computed = getComputedStyle(element);
      const bgColor = computed.backgroundColor;
      
      if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
        // Parse RGB values from computed style
        const rgb = bgColor.match(/\d+/g);
        if (rgb && rgb.length >= 3) {
          const luminance = calculateLuminance(
            parseInt(rgb[0]),
            parseInt(rgb[1]),
            parseInt(rgb[2])
          );
          return luminance;
        }
      }
    }

    // Check if we're over media content
    const hasMedia = elements.some(el => {
      const element = el as HTMLElement;
      return (
        el.tagName === 'IMG' || 
        el.tagName === 'VIDEO' ||
        el.classList.contains('bg-gradient') ||
        (element.style && element.style.backgroundImage)
      );
    });

    return hasMedia ? 0.3 : 0.9; // Dark for media, light for content
  };

  // Update glass mode based on luminance
  const updateGlassMode = () => {
    const luminance = sampleBackgroundLuminance();
    
    let newMode: GlassMode;
    if (luminance >= lightThreshold) {
      newMode = 'elevated'; // Over white/light content
    } else if (luminance >= darkThreshold) {
      newMode = 'standard'; // Over colored/media content
    } else {
      newMode = 'dark'; // Over very dark content
    }

    setGlassMode(prev => prev !== newMode ? newMode : prev);
  };

  // Set up continuous monitoring
  useEffect(() => {
    const monitor = () => {
      updateGlassMode();
      animationFrameRef.current = requestAnimationFrame(() => {
        setTimeout(monitor, updateInterval);
      });
    };

    monitor();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [lightThreshold, darkThreshold, updateInterval]);

  // CSS variables for current mode
  const glassStyles = {
    '--glass-mode': glassMode,
    '--glass-bg': getGlassBackground(glassMode),
    '--glass-blur': getGlassBlur(glassMode),
    '--glass-border': getGlassBorder(glassMode),
    '--glass-shadow': getGlassShadow(glassMode),
    '--glass-text': getGlassTextColor(glassMode),
  } as React.CSSProperties;

  return {
    glassMode,
    glassStyles,
    sentinelRef,
    updateGlassMode
  };
};

// Helper functions for mode-specific styles
const getGlassBackground = (mode: GlassMode): string => {
  switch (mode) {
    case 'elevated':
      return 'rgba(255, 255, 255, 0.85)';
    case 'dark':
      return 'rgba(18, 18, 18, 0.36)';
    default:
      return 'rgba(255, 255, 255, 0.22)';
  }
};

const getGlassBlur = (mode: GlassMode): string => {
  switch (mode) {
    case 'elevated':
      return 'blur(8px)';
    case 'dark':
      return 'blur(14px)';
    default:
      return 'blur(14px)';
  }
};

const getGlassBorder = (mode: GlassMode): string => {
  switch (mode) {
    case 'elevated':
      return '1px solid rgba(0, 0, 0, 0.06)';
    case 'dark':
      return '1px solid rgba(255, 255, 255, 0.18)';
    default:
      return '1px solid rgba(255, 255, 255, 0.35)';
  }
};

const getGlassShadow = (mode: GlassMode): string => {
  switch (mode) {
    case 'elevated':
      return '0 8px 28px rgba(0, 0, 0, 0.10), 0 1px 0 rgba(0, 0, 0, 0.06)';
    case 'dark':
      return 'none';
    default:
      return '0 6px 24px rgba(0, 0, 0, 0.08)';
  }
};

const getGlassTextColor = (mode: GlassMode): string => {
  switch (mode) {
    case 'elevated':
      return '#111111';
    default:
      return '#ffffff';
  }
};