import { useEffect } from 'react';
import { useBottomNavigation } from '@/contexts/BottomNavigationContext';

/**
 * Hook to set the bottom navigation variant for a specific route/page
 */
export const useBottomNavigationVariant = (variant: 'default' | 'clubhouse') => {
  const { setVariant } = useBottomNavigation();

  useEffect(() => {
    setVariant(variant);
  }, [variant, setVariant]);
};