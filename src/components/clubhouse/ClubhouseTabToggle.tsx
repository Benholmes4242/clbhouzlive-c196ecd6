import { useLayoutEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export type ClubhouseTab = 'foryou' | 'friends';

interface ClubhouseTabToggleProps {
  activeTab: ClubhouseTab;
  onTabChange: (tab: ClubhouseTab) => void;
  className?: string;
}

/**
 * Tab toggle for Clubhouse feed - fixed position on video content area
 * Uses z-30 so it sits above video but below header (z-header = 40+)
 * Becomes more visible when header fades away
 */
export const ClubhouseTabToggle = ({
  activeTab,
  onTabChange,
  className,
}: ClubhouseTabToggleProps) => {
  const [rightInsetPx, setRightInsetPx] = useState<number | null>(null);

  // Compute a right boundary so the *center of the Suggested↔Yours gap* sits
  // at the midpoint between the left edge of the screen and the Search icon.
  useLayoutEffect(() => {
    let raf = 0;

    const update = () => {
      cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(() => {
        const searchButton = document.querySelector<HTMLElement>('button[aria-label="Search"]');
        if (!searchButton) {
          setRightInsetPx(null);
          return;
        }

        const rect = searchButton.getBoundingClientRect();
        const searchLeftX = rect.left;
        const inset = Math.max(0, window.innerWidth - searchLeftX);
        setRightInsetPx(inset);
      });
    };

    update();
    window.addEventListener('resize', update);

    const searchButton = document.querySelector<HTMLElement>('button[aria-label="Search"]');
    const ro =
      typeof ResizeObserver !== 'undefined' && searchButton
        ? new ResizeObserver(update)
        : null;

    if (searchButton && ro) ro.observe(searchButton);

    return () => {
      window.removeEventListener('resize', update);
      if (ro) ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  const halfGapPx = 6; // gap-3 / 2
  const leftOffsetPx = 42; // shift tabs left

  return (
    <div
      className={cn(
        'fixed left-0 z-30 flex items-center justify-center pointer-events-none',
        className
      )}
      style={{
        top: 'calc(env(safe-area-inset-top) + 16px)',
        // Fallback preserves previous layout if Search isn't found.
        right: (rightInsetPx ?? 100) + leftOffsetPx,
      }}
    >
      {/* Position each label around the exact centerline so the *gap center* is centered */}
      <div className="relative h-7 w-full pointer-events-auto">
        <button
          onClick={() => onTabChange('foryou')}
          className={cn(
            'absolute inset-y-0 flex items-center text-sm font-semibold transition-all duration-200 whitespace-nowrap',
            `right-[calc(50%+${halfGapPx}px)]`,
            activeTab === 'foryou' ? 'text-white' : 'text-white/50'
          )}
        >
          Suggested
        </button>

        <button
          onClick={() => onTabChange('friends')}
          className={cn(
            'absolute inset-y-0 flex items-center text-sm font-semibold transition-all duration-200 whitespace-nowrap',
            `left-[calc(50%+${halfGapPx}px)]`,
            activeTab === 'friends' ? 'text-white' : 'text-white/50'
          )}
        >
          Yours
        </button>
      </div>
    </div>
  );
};
