import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to determine if text should be dark or light based on background brightness
 * Returns true for dark text (light background), false for light text (dark background)
 */
export const useAdaptiveTextColor = (elementRef: React.RefObject<HTMLElement>) => {
  const [shouldUseDarkText, setShouldUseDarkText] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!elementRef.current) return;

    const detectBackgroundBrightness = () => {
      try {
        const element = elementRef.current;
        if (!element) return;

        // Create a canvas to capture the background
        if (!canvasRef.current) {
          canvasRef.current = document.createElement('canvas');
        }
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Get element position and size
        const rect = element.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        // Try to get computed background color
        const computedStyle = window.getComputedStyle(element);
        let backgroundColor = computedStyle.backgroundColor;
        
        // If transparent, traverse up the DOM tree to find a background
        let currentElement: Element | null = element;
        while (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
          currentElement = currentElement.parentElement;
          if (!currentElement || currentElement === document.body) break;
          backgroundColor = window.getComputedStyle(currentElement).backgroundColor;
        }

        // Parse RGB values
        const rgbMatch = backgroundColor.match(/rgba?\(([^)]+)\)/);
        if (!rgbMatch) {
          // Fallback: analyze backdrop blur effect by sampling colors
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          
          // Sample multiple points around the search bar area
          const samplePoints = [
            { x: centerX, y: centerY },
            { x: centerX - 50, y: centerY },
            { x: centerX + 50, y: centerY },
            { x: centerX, y: centerY - 20 },
            { x: centerX, y: centerY + 20 }
          ];

          // Use document.elementFromPoint to check what's behind
          const backgroundElements = samplePoints.map(point => 
            document.elementFromPoint(point.x, point.y)
          ).filter(el => el && el !== element && !element.contains(el));

          if (backgroundElements.length > 0) {
            // Get the most common background element
            const bgElement = backgroundElements[0];
            const bgStyle = window.getComputedStyle(bgElement);
            
            // Check for background images or gradients
            const bgImage = bgStyle.backgroundImage;
            if (bgImage && bgImage !== 'none') {
              // For complex backgrounds, default to light text
              setShouldUseDarkText(false);
              return;
            }
            
            backgroundColor = bgStyle.backgroundColor;
          }
        }

        if (rgbMatch) {
          const [r, g, b] = rgbMatch[1].split(',').map(str => parseInt(str.trim()));
          
          // Calculate relative luminance using WCAG formula
          const sRGBToLinear = (color: number) => {
            color = color / 255;
            return color <= 0.03928 ? color / 12.92 : Math.pow((color + 0.055) / 1.055, 2.4);
          };

          const luminance = 0.2126 * sRGBToLinear(r) + 
                           0.7152 * sRGBToLinear(g) + 
                           0.0722 * sRGBToLinear(b);

          // If luminance > 0.5, use dark text; otherwise use light text
          setShouldUseDarkText(luminance > 0.5);
        } else {
          // Fallback for complex backgrounds - default to light text
          setShouldUseDarkText(false);
        }
      } catch (error) {
        console.warn('Error detecting background brightness:', error);
        // Fallback to light text
        setShouldUseDarkText(false);
      }
    };

    // Initial detection
    detectBackgroundBrightness();

    // Re-detect on scroll, resize, or other layout changes
    const handleLayoutChange = () => {
      setTimeout(detectBackgroundBrightness, 100);
    };

    window.addEventListener('scroll', handleLayoutChange);
    window.addEventListener('resize', handleLayoutChange);
    
    // Use MutationObserver to detect style changes
    const observer = new MutationObserver(handleLayoutChange);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style', 'class'],
      subtree: true
    });

    return () => {
      window.removeEventListener('scroll', handleLayoutChange);
      window.removeEventListener('resize', handleLayoutChange);
      observer.disconnect();
    };
  }, [elementRef]);

  return shouldUseDarkText;
};