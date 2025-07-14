import { useEffect, useState, useCallback } from 'react';
import { preloadCriticalImages } from '@/utils/imageOptimization';

export const useMobileOptimizations = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [networkType, setNetworkType] = useState<string>('4g');

  useEffect(() => {
    // Detect mobile device
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Detect network speed
    const checkNetworkType = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        setNetworkType(connection?.effectiveType || '4g');
      }
    };

    checkIsMobile();
    checkNetworkType();

    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Preload strategy based on device and network
  const preloadStrategy = useCallback((imageUrls: string[]) => {
    const isSlowNetwork = networkType === 'slow-2g' || networkType === '2g';
    const preloadCount = isSlowNetwork ? 1 : isMobile ? 2 : 3;
    
    preloadCriticalImages(imageUrls.slice(0, preloadCount));
  }, [isMobile, networkType]);

  // Get optimal image quality based on network
  const getOptimalQuality = useCallback(() => {
    if (networkType === 'slow-2g' || networkType === '2g') return 60;
    if (networkType === '3g') return 70;
    return 75;
  }, [networkType]);

  // Get optimal batch size for loading
  const getBatchSize = useCallback(() => {
    if (networkType === 'slow-2g' || networkType === '2g') return 2;
    if (isMobile) return 5;
    return 10;
  }, [isMobile, networkType]);

  return {
    isMobile,
    networkType,
    preloadStrategy,
    getOptimalQuality,
    getBatchSize,
    isSlowNetwork: networkType === 'slow-2g' || networkType === '2g'
  };
};