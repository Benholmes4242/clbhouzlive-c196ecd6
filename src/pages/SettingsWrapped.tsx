import React, { useEffect } from 'react';
import { useHeader } from '@/contexts/GlobalHeaderContext';
import Settings from './Settings';

const SettingsWrapped = () => {
  const { setVariant } = useHeader();

  useEffect(() => {
    // Settings page now uses dark header
    setVariant('glass-dark');
  }, [setVariant]);

  return <Settings />;
};

export default SettingsWrapped;