
import React from 'react';
import { Button } from '@/components/ui/button';
import SiteBrandingCard from './settings/SiteBrandingCard';
import GeneralSettingsCard from './settings/GeneralSettingsCard';
import SecuritySettingsCard from './settings/SecuritySettingsCard';
import FeatureFlagsCard from './settings/FeatureFlagsCard';
import MaintenanceModeCard from './settings/MaintenanceModeCard';

const AdminSettings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Settings</h2>
        <p className="text-muted-foreground">Configure your platform settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SiteBrandingCard />
        <GeneralSettingsCard />
        <SecuritySettingsCard />
        <FeatureFlagsCard />
        <MaintenanceModeCard />
      </div>

      <div className="flex justify-end space-x-4">
        <Button variant="outline">Cancel</Button>
        <Button>Save Changes</Button>
      </div>
    </div>
  );
};

export default AdminSettings;
