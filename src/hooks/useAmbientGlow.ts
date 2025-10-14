import { useEffect, useRef, useCallback, useState } from 'react';
import { extractDominantColor, getRelativeLuminance } from '@/utils/colorExtractor';

interface AmbientGlowOptions {
  videoElement: HTMLVideoElement | null;
  isActive: boolean;
  interval?: number; // ms between samples
}

interface AmbientGlowReturn {
  ambientColor: string | null;
  textColor: string;
  applyToElement: (element: HTMLElement | null) => void;
}

/**
 * Extract ambient color from video and apply as CSS variables
 */
export function useAmbientGlow({
  videoElement,
  isActive,
  interval = 700
}: AmbientGlowOptions): AmbientGlowReturn {
  const [ambientColor, setAmbientColor] = useState<string | null>(null);
  const [textColor, setTextColor] = useState<string>('rgba(255,255,255,0.92)');
  const intervalRef = useRef<NodeJS.Timeout>();
  const elementRef = useRef<HTMLElement | null>(null);
  const cacheRef = useRef<Map<string, string>>(new Map());

  const sampleColor = useCallback(() => {
    if (!videoElement || !isActive) return;

    // Check cache first
    const videoSrc = videoElement.src;
    const cacheKey = `${videoSrc}_${Math.floor(videoElement.currentTime)}`;
    
    if (cacheRef.current.has(cacheKey)) {
      const cached = cacheRef.current.get(cacheKey)!;
      setAmbientColor(cached);
      return;
    }

    const hsl = extractDominantColor(videoElement);
    if (!hsl) return;

    const colorString = `${hsl.h} ${hsl.s}% ${hsl.l}%`;
    setAmbientColor(colorString);
    
    // Cache it
    cacheRef.current.set(cacheKey, colorString);
    
    // Keep cache size manageable
    if (cacheRef.current.size > 50) {
      const firstKey = cacheRef.current.keys().next().value;
      cacheRef.current.delete(firstKey);
    }

    // Adjust text color based on luminance
    const luminance = getRelativeLuminance(hsl);
    if (luminance < 0.35) {
      setTextColor('rgba(255,255,255,0.92)');
    } else {
      setTextColor('rgba(255,255,255,0.92)'); // Keep white for consistency
    }
  }, [videoElement, isActive]);

  // Apply CSS variables to element
  const applyToElement = useCallback((element: HTMLElement | null) => {
    elementRef.current = element;
    if (!element) return;

    if (ambientColor) {
      element.style.setProperty('--ambient', ambientColor);
      element.style.setProperty('--ambient-alpha', '0.18');
      element.style.setProperty('--glass-text', textColor);
    }
  }, [ambientColor, textColor]);

  // Set up interval for color sampling
  useEffect(() => {
    if (!isActive || !videoElement) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
      return;
    }

    // Initial sample
    sampleColor();

    // Set up interval
    intervalRef.current = setInterval(sampleColor, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, videoElement, interval, sampleColor]);

  // Update element when color changes
  useEffect(() => {
    if (elementRef.current && ambientColor) {
      elementRef.current.style.setProperty('--ambient', ambientColor);
      elementRef.current.style.setProperty('--glass-text', textColor);
    }
  }, [ambientColor, textColor]);

  return {
    ambientColor,
    textColor,
    applyToElement
  };
}
