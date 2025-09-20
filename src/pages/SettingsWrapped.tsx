import React, { useEffect } from 'react';
import { useHeaderVariant } from '@/contexts/HeaderContext';
import Settings from './Settings';

const SettingsWrapped = () => {
  const { setVariant } = useHeaderVariant();

  useEffect(() => {
    // Settings page has white background, use solid-light
    setVariant('solid-light');
  }, [setVariant]);

  return <Settings />;
};

export default SettingsWrapped;