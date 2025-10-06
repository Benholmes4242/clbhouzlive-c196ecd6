import { useEffect } from 'react';

/**
 * Hook to control header visibility globally using document attribute
 * This ensures header hiding works reliably across different environments
 * and portal boundaries (e.g., real devices vs preview)
 */
export function useImmersiveHeader(active: boolean) {
  useEffect(() => {
    const el = document.documentElement; // <html>
    if (active) {
      el.setAttribute('data-immersive', 'true');
      console.log('🔍 Setting data-immersive=true on html element');
    } else {
      el.removeAttribute('data-immersive');
      console.log('🔍 Removing data-immersive from html element');
    }
    
    // Cleanup function to remove attribute when component unmounts
    return () => {
      el.removeAttribute('data-immersive');
      console.log('🔍 Cleanup: Removing data-immersive from html element');
    };
  }, [active]);
}