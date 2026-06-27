import { useEffect, useState } from 'react';

/**
 * Reads the `--tour-hero-overlay` flag set by TournamentDetailPage to signal
 * global chrome (CompactHeader, ShellSlot) to switch to transparent overlay
 * styling while the cinematic hero covers the viewport top.
 *
 * Uses a CustomEvent for instant updates; falls back to reading the CSS var
 * on mount so newly-mounted chrome picks up the current state.
 */
export function useTourHeroOverlay(): boolean {
  const [active, setActive] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.style
      .getPropertyValue('--tour-hero-overlay')
      .trim() === '1';
  });

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<boolean>).detail;
      setActive(Boolean(detail));
    };
    window.addEventListener('tour-hero-overlay', handler as EventListener);
    return () => window.removeEventListener('tour-hero-overlay', handler as EventListener);
  }, []);

  return active;
}
