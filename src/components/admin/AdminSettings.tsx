
import React from 'react';
import SiteBrandingCard from './settings/SiteBrandingCard';
import GeneralSettingsCard from './settings/GeneralSettingsCard';
import SecuritySettingsCard from './settings/SecuritySettingsCard';
import FeatureFlagsCard from './settings/FeatureFlagsCard';
import MaintenanceModeCard from './settings/MaintenanceModeCard';
import VideoMigrationTool from './VideoMigrationTool';

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

      {/* Migration Tools Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Migration Tools</h3>
          <p className="text-sm text-muted-foreground">Tools for migrating and fixing media files</p>
        </div>
        <VideoMigrationTool />
      </div>
    </div>
  );
};

export default AdminSettings;
