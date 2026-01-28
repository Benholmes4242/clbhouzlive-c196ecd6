import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Wrench, Database, Shield, Plug } from 'lucide-react';
import SettingsHeader from './settings/SettingsHeader';
import {
  GeneralSettingsTab,
  UtilityToolsTab,
  DataManagementTab,
  SecurityTab,
  IntegrationsTab
} from './settings/tabs';

const AdminSettings = () => {
  return (
    <div className="space-y-6">
      <SettingsHeader />

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
          <TabsTrigger value="general" className="gap-2">
            <Settings className="h-4 w-4 hidden sm:inline" />
            <span>General</span>
          </TabsTrigger>
          <TabsTrigger value="utilities" className="gap-2">
            <Wrench className="h-4 w-4 hidden sm:inline" />
            <span>Utilities</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="gap-2">
            <Database className="h-4 w-4 hidden sm:inline" />
            <span>Data</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4 hidden sm:inline" />
            <span>Security</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <Plug className="h-4 w-4 hidden sm:inline" />
            <span>Integrations</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="general" className="m-0">
            <GeneralSettingsTab />
          </TabsContent>

          <TabsContent value="utilities" className="m-0">
            <UtilityToolsTab />
          </TabsContent>

          <TabsContent value="data" className="m-0">
            <DataManagementTab />
          </TabsContent>

          <TabsContent value="security" className="m-0">
            <SecurityTab />
          </TabsContent>

          <TabsContent value="integrations" className="m-0">
            <IntegrationsTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
