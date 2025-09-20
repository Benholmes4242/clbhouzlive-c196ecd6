import React, { useEffect } from 'react';
import { useHeaderVariant } from '@/contexts/HeaderContext';
import { useHeaderVariantSetter } from '@/hooks/useHeaderVariant';
import Auth from './Auth';

const AuthWrapped = () => {
  const { setVariant } = useHeaderVariant();

  useEffect(() => {
    // Auth pages have white background, use solid-light
    setVariant('solid-light');
  }, [setVariant]);

  // Set header variant for auth
  useHeaderVariantSetter('solid-light');

  return <Auth />;
};

export default AuthWrapped;