import React, { useEffect } from 'react';
import { useHeader } from '@/contexts/GlobalHeaderContext';
import Auth from './Auth';

const AuthWrapped = () => {
  const { setVariant } = useHeader();

  useEffect(() => {
    // Auth pages now use dark header
    setVariant('glass-dark');
  }, [setVariant]);

  return <Auth />;
};

export default AuthWrapped;