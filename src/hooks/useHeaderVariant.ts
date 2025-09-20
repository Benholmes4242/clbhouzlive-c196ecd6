import { useEffect } from 'react';
import { useHeaderVariant as useHeaderVariantContext } from '@/contexts/HeaderContext';

/**
 * Hook to set the header variant for a specific route/page
 */
export const useHeaderVariantSetter = (variant: 'glass-dark' | 'solid-light') => {
  const { setVariant } = useHeaderVariantContext();

  useEffect(() => {
    setVariant(variant);
  }, [variant, setVariant]);
};