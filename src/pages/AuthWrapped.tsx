import React, { useEffect } from 'react';
import { useHeader } from '@/contexts/GlobalHeaderContext';
import Auth from './Auth';

const AuthWrapped = () => {
  const { setVariant } = useHeader();

  useEffect(() => {
    // Auth pages have white background, use solid-light
    setVariant('solid-light');
  }, [setVariant]);

  return <Auth />;
};

export default AuthWrapped;