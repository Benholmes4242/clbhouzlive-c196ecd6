import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronUp } from 'lucide-react';
import { getPrimaryScrollElement, scrollPageToTop } from '@/lib/getScrollParent';
import { useIsFullScreenSurfaceOpen } from '@/stores/fullScreenSurfaceStore';

const ScrollToTopGlass = () => {
  const [visible, setVisible] = useState(false);
  // A scroll affordance for a scrolling PAGE. While a full-screen surface
  // covers the page there is nothing to scroll, so the button is ABSENT —
  // not transparent, not click-through. This is also the fix for the button
  // (portalled to body) outranking an in-tree surface's confined zIndex.
  const surfaceOpen = useIsFullScreenSurfaceOpen();

  useEffect(() => {
    const target = getPrimaryScrollElement();
    if (!target) return;
    let ticking = false;

    const computeVisible = () => {
      // Hide when a fullscreen overlay is active
      if (document.body.classList.contains('route-fullscreen-overlay')) {
        setVisible(false);
        return;
      }
      setVisible(target.scrollTop > 400);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        computeVisible();
        ticking = false;
      });
    };

    computeVisible();

    target.addEventListener('scroll', onScroll, { passive: true } as AddEventListenerOptions);

    // Also watch for body class changes (fullscreen overlay toggle)
    const observer = new MutationObserver(() => computeVisible());
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    return () => {
      target.removeEventListener('scroll', onScroll as EventListener);
      observer.disconnect();
    };
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    scrollPageToTop('smooth');
  };

  if (surfaceOpen) return null;

  return createPortal(
    <div 
      className={`
        fixed
        bottom-24
        right-4
        z-[39]
        transition-all
        duration-200
        ease-out
        ${visible ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-90 pointer-events-none'}
      `}
    >
      <button
        type="button"
        onClick={handleClick}
        aria-label="Back to top"
        className="
          pointer-events-auto
          h-10
          w-10
          rounded-full
          flex
          items-center
          justify-center
          active:scale-95
          transition-transform
          duration-150
          touch-manipulation
        "
        style={{ 
          WebkitTapHighlightColor: 'transparent',
          background: 'rgba(0, 0, 0, 0.28)',
          backdropFilter: 'blur(22px) saturate(180%)',
          WebkitBackdropFilter: 'blur(22px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
        }}
      >
        <ChevronUp className="h-4 w-4 text-white" />
      </button>
    </div>,
    document.body
  );
};

export default ScrollToTopGlass;
