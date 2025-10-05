import { useEffect } from 'react';

/**
 * Hook to control header visibility globally using document attribute
 * Ensures reliability across environments and when multiple immersive surfaces
 * are mounted at the same time by using a reference counter.
 */
let immersiveCounter = 0; // module-scoped counter survives re-renders

export function useImmersiveHeader(active: boolean) {
  useEffect(() => {
    const el = document.documentElement; // <html>
    let applied = false;

    const apply = () => {
      if (applied) return;
      immersiveCounter += 1;
      applied = true;
      el.setAttribute('data-immersive', 'true');
      el.setAttribute('data-immersive-count', String(immersiveCounter));
      console.log('🔍 immersive++ set data-immersive (count):', immersiveCounter);
    };

    const remove = () => {
      if (!applied) return;
      immersiveCounter = Math.max(immersiveCounter - 1, 0);
      applied = false;
      if (immersiveCounter === 0) {
        el.removeAttribute('data-immersive');
      }
      el.setAttribute('data-immersive-count', String(immersiveCounter));
      console.log('🔍 immersive-- updated (count):', immersiveCounter);
    };

    if (active) {
      apply();
    }

    // Cleanup on unmount or when `active` changes
    return () => {
      remove();
    };
  }, [active]);
}
