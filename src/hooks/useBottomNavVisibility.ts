import { useEffect } from 'react';
import { useBottomNavigation } from '@/contexts/BottomNavigationContext';

interface UseBottomNavVisibilityOptions {
  hideOnMount?: boolean;
  showOnUnmount?: boolean;
}

/**
 * Hook to control bottom navigation visibility for specific pages/components
 * Useful for full-screen flows like auth, onboarding, or media capture
 */
export const useBottomNavVisibility = (
  visible: boolean = true, 
  options: UseBottomNavVisibilityOptions = {}
) => {
  const { setVisible } = useBottomNavigation();
  const { hideOnMount = false, showOnUnmount = true } = options;

  useEffect(() => {
    if (hideOnMount) {
      setVisible(false);
    } else {
      setVisible(visible);
    }

    // Cleanup: restore visibility when component unmounts
    return () => {
      if (showOnUnmount) {
        setVisible(true);
      }
    };
  }, [visible, setVisible, hideOnMount, showOnUnmount]);

  return { setVisible };
};

/**
 * Hook specifically for full-screen flows that should hide bottom nav
 */
export const useHideBottomNav = () => {
  return useBottomNavVisibility(false, { hideOnMount: true, showOnUnmount: true });
};

/**
 * Hook to temporarily hide bottom nav (e.g., during media capture)
 */
export const useTemporaryHideBottomNav = () => {
  const { hideBottomNav, showBottomNav } = useBottomNavigation();
  
  return {
    hide: hideBottomNav,
    show: showBottomNav,
  };
};