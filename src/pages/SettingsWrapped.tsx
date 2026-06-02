import React from 'react';
import { SettingsPageV2 } from '@/components/settings/SettingsPageV2';
import { PageRoot } from '@/components/layout/PageRoot';
import { useHideHeader } from '@/hooks/useHeaderVisibility';

const SettingsWrapped = () => {
  useHideHeader();

  return (
    <PageRoot className="min-h-screen bg-[#F8FAFC]" hasBottomNav={true}>
      <SettingsPageV2 />
    </PageRoot>
  );
};

export default SettingsWrapped;
