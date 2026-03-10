import React from 'react';
import { SettingsPageV2 } from '@/components/settings/SettingsPageV2';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { useHideHeader } from '@/hooks/useHeaderVisibility';

const SettingsWrapped = () => {
  useHideBottomNav();
  useHideHeader();

  return <SettingsPageV2 />;
};

export default SettingsWrapped;
