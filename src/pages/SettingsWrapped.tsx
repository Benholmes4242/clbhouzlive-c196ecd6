import React, { useEffect } from 'react';
import { useHeader } from '@/contexts/GlobalHeaderContext';
import Settings from './Settings';

const SettingsWrapped = () => {
  const { setVariant } = useHeader();

  useEffect(() => {
    // Settings page has white background, use solid-light
    setVariant('solid-light');
  }, [setVariant]);

  return <Settings />;
};

export default SettingsWrapped;