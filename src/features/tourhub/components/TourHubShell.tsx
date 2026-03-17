import { ReactNode, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { useHeader } from '@/contexts/GlobalHeaderContext';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';
import { openTourNav } from '../contexts/TourNavContext';

interface TourHubShellProps {
  children: ReactNode;
  /** Enable immersive full-bleed mode (hero behind status bar) — used by tournament detail pages */
  immersive?: boolean;
}

/**
 * Fixed burger menu button — rendered once in TourHubShell so it's always
 * outside any motion/transform container that would break `position: fixed`.
 */
function TourHubBurger() {
  return (
    <button
      className="fixed z-[60] flex items-center justify-center"
      style={{
        top: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 12px)',
        left: 16,
        width: 44,
        height: 44,
      }}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); openTourNav(); }}
      aria-label="Open tour menu"
    >
      <Menu
        className="w-[22px] h-[22px]"
        strokeWidth={2}
        style={{ color: '#FFFFFF', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))' }}
      />
    </button>
  );
}

export function TourHubShell({ children, immersive = false }: TourHubShellProps) {
  const { setVariant } = useHeader();

  // All Tour Hub pages use immersiveStatusBar={true} on PageRoot, which disables
  // PageRoot's default hook. This call takes ownership so the transparent status bar
  // is re-applied on iOS resume (prevents grey safe-area flash).
  useMedianStatusBar("dark", "transparent", true, false);

  useEffect(() => {
    setVariant('solid-light');
    return () => setVariant('solid-light');
  }, [setVariant]);

  // Tournament detail pages: immersive negative-margin + max-width container
  if (immersive) {
    return (
      <PageRoot
        className="min-h-screen w-full bg-background"
        immersive
        immersiveStatusBar
      >
        <TourHubBurger />
        <div className="w-full max-w-5xl mx-auto">
          {children}
        </div>
      </PageRoot>
    );
  }

  // All tabs (overview, players, schedule, leaders, college): full-bleed into safe area
  return (
    <PageRoot
      className="min-h-screen w-full bg-background"
      immersiveStatusBar
    >
      <TourHubBurger />
      {children}
    </PageRoot>
  );
}
