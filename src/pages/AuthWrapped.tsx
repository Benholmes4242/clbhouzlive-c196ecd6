import React, { useEffect } from 'react';
import { useHeaderVariant } from '@/contexts/HeaderContext';
import Auth from './Auth';

const AuthWrapped = () => {
  const { setVariant } = useHeaderVariant();

  useEffect(() => {
    // Auth pages have white background, use solid-light
    setVariant('solid-light');
  }, [setVariant]);

  return <Auth />;
};

export default AuthWrapped;