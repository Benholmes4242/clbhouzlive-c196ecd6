import React, { useEffect } from 'react';
import { useHeader } from '@/contexts/GlobalHeaderContext';
import { SettingsPageV2 } from '@/components/settings/SettingsPageV2';

const SettingsWrapped = () => {
  const { hideHeader, showHeader } = useHeader();

  useEffect(() => {
    // SettingsPageV2 has its own header, hide the global one
    hideHeader();
    return () => showHeader();
  }, [hideHeader, showHeader]);

  return <SettingsPageV2 />;
};

export default SettingsWrapped;
