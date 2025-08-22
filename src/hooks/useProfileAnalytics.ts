import { useEffect, useRef } from 'react';
import { track } from '@vercel/analytics';

// Analytics events for profile interactions
export const useProfileAnalytics = (profileId?: string) => {
  const scrollDepthRef = useRef<{ 25: boolean; 50: boolean; 75: boolean }>({
    25: false,
    50: false,
    75: false
  });

  // Track mobile crop events
  const trackMobileCropOpened = () => {
    track('ProfilePhoto_MobileCrop_Opened', {
      profileId: profileId || 'unknown',
      timestamp: new Date().toISOString()
    });
  };

  const trackMobileCropSaved = (cropData?: { x: number; y: number; width: number; height: number }) => {
    track('ProfilePhoto_MobileCrop_Saved', {
      profileId: profileId || 'unknown',
      cropDataString: cropData ? JSON.stringify(cropData) : null,
      timestamp: new Date().toISOString()
    });
  };

  // Track profile video events
  const trackProfileVideoPlay = () => {
    track('ProfileVideo_Play', {
      profileId: profileId || 'unknown',
      timestamp: new Date().toISOString()
    });
  };

  const trackProfileVideoEnd = () => {
    track('ProfileVideo_End', {
      profileId: profileId || 'unknown',
      timestamp: new Date().toISOString()
    });
  };

  // Track scroll depth through profile header
  const trackScrollDepth = (scrollTop: number, headerHeight: number) => {
    if (!headerHeight) return;

    const scrollPercent = (scrollTop / headerHeight) * 100;
    
    // Track 25% threshold
    if (scrollPercent >= 25 && !scrollDepthRef.current[25]) {
      scrollDepthRef.current[25] = true;
      track('ProfileHeader_ScrollDepth', {
        profileId: profileId || 'unknown',
        depth: '25%',
        timestamp: new Date().toISOString()
      });
    }
    
    // Track 50% threshold
    if (scrollPercent >= 50 && !scrollDepthRef.current[50]) {
      scrollDepthRef.current[50] = true;
      track('ProfileHeader_ScrollDepth', {
        profileId: profileId || 'unknown',
        depth: '50%',
        timestamp: new Date().toISOString()
      });
    }
    
    // Track 75% threshold
    if (scrollPercent >= 75 && !scrollDepthRef.current[75]) {
      scrollDepthRef.current[75] = true;
      track('ProfileHeader_ScrollDepth', {
        profileId: profileId || 'unknown',
        depth: '75%',
        timestamp: new Date().toISOString()
      });
    }
  };

  // Reset scroll depth tracking when profile changes
  useEffect(() => {
    scrollDepthRef.current = { 25: false, 50: false, 75: false };
  }, [profileId]);

  return {
    trackMobileCropOpened,
    trackMobileCropSaved,
    trackProfileVideoPlay,
    trackProfileVideoEnd,
    trackScrollDepth
  };
};