import React, { useEffect } from 'react';
import { useHeader } from '@/contexts/GlobalHeaderContext';
import Settings from './Settings';

const SettingsWrapped = () => {
  // No need to set variant anymore - it's locked to glass-dark
  return <Settings />;
};

export default SettingsWrapped;