import { useState, useEffect } from 'react';

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent;
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      setIsMobile(mobileRegex.test(userAgent));
    };

    checkMobile();
    // Listen for orientation changes (mobile feature)
    window.addEventListener('orientationchange', checkMobile);
    
    return () => {
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []);

  return isMobile;
};