import { useEffect } from 'react';
import { useHeader } from '@/contexts/GlobalHeaderContext';

interface UseHeaderVisibilityOptions {
  hideOnMount?: boolean;
  showOnUnmount?: boolean;
}

/**
 * Hook to control header visibility for specific pages/components
 * Useful for full-screen flows like auth, onboarding, or media capture
 */
export const useHeaderVisibility = (
  visible: boolean = true, 
  options: UseHeaderVisibilityOptions = {}
) => {
  const { setVisible } = useHeader();
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
 * Hook specifically for full-screen flows that should hide header
 */
export const useHideHeader = () => {
  return useHeaderVisibility(false, { hideOnMount: true, showOnUnmount: true });
};

/**
 * Hook to set header variant for specific routes
 */
export const useHeaderVariant = (variant?: 'glass-dark' | 'solid-light') => {
  const { setVariant, variant: currentVariant } = useHeader();

  useEffect(() => {
    if (variant) {
      setVariant(variant);
    }
  }, [variant, setVariant]);

  return { variant: currentVariant, setVariant };
};