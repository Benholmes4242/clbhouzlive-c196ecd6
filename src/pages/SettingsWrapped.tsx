import React from 'react';
import { SettingsPageV2 } from '@/components/settings/SettingsPageV2';
import { PageRoot } from '@/components/layout/PageRoot';
import { useHideBottomNav } from '@/hooks/useBottomNavVisibility';
import { useHideHeader } from '@/hooks/useHeaderVisibility';

const SettingsWrapped = () => {
  useHideBottomNav();
  useHideHeader();

  return (
    <PageRoot className="min-h-screen bg-background" hasBottomNav={false}>
      <SettingsPageV2 />
    </PageRoot>
  );
};

export default SettingsWrapped;
