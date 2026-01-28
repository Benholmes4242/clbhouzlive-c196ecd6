import React from 'react';
import SiteBrandingCard from '../SiteBrandingCard';
import GeneralSettingsCard from '../GeneralSettingsCard';
import MaintenanceModeCard from '../MaintenanceModeCard';
import FeatureFlagsCard from '../FeatureFlagsCard';

export function GeneralSettingsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">General Configuration</h3>
        <p className="text-sm text-muted-foreground">
          Platform branding, site settings, and feature toggles
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SiteBrandingCard />
        <GeneralSettingsCard />
        <MaintenanceModeCard />
        <FeatureFlagsCard />
      </div>
    </div>
  );
}

export default GeneralSettingsTab;
