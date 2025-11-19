import { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';

const ScrollToTopGlass = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    console.log('🔝 ScrollToTopGlass mounted');
    
    const checkScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      const shouldShow = scrollY > 400;
      console.log('🔝 Scroll check:', { scrollY, shouldShow });
      setVisible(shouldShow);
    };

    // Check initial position
    checkScroll();
    
    // Add listeners to both window and document
    const handleScroll = () => {
      console.log('🔝 Scroll event triggered!');
      checkScroll();
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    document.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    
    // Also check on resize in case that's what's needed
    window.addEventListener('resize', checkScroll, { passive: true });
    
    // Force check every second for debugging
    const interval = setInterval(() => {
      console.log('🔝 Interval check');
      checkScroll();
    }, 1000);
    
    return () => {
      console.log('🔝 ScrollToTopGlass unmounting');
      window.removeEventListener('scroll', handleScroll, true);
      document.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', checkScroll);
      clearInterval(interval);
    };
  }, []);

  console.log('🔝 ScrollToTopGlass render, visible:', visible);

  if (!visible) {
    console.log('🔝 Not visible, returning null');
    return null;
  }

  console.log('🔝 Rendering button!');

  return (
    <button
      type="button"
      onClick={() => {
        console.log('🔝 Button clicked!');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }}
      aria-label="Back to top"
      style={{ 
        position: 'fixed',
        top: '12px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.28)',
        backdropFilter: 'blur(22px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '9999px',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        cursor: 'pointer'
      }}
    >
      <ChevronUp style={{ width: '16px', height: '16px', color: 'white' }} />
    </button>
  );
};

export default ScrollToTopGlass;
