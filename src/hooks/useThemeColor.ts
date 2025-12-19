import { useEffect } from 'react';

/**
 * Dynamically updates the theme-color meta tag for iOS PWA safe areas.
 * Call with a color value to set, or leave empty to reset to default.
 */
export const useThemeColor = (color: string = '#F8FAFC') => {
  useEffect(() => {
    const meta = document.getElementById('theme-color-meta') as HTMLMetaElement | null;
    if (meta) {
      meta.content = color;
    }
    
    return () => {
      // Reset to default on unmount
      if (meta) {
        meta.content = '#F8FAFC';
      }
    };
  }, [color]);
};
