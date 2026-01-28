import React from 'react';
import UrlConversionTool from '../../UrlConversionTool';
import { VerificationCleanSlateTool } from '../../VerificationCleanSlateTool';
import Top100DebugPanel from '../../Top100DebugPanel';
import CollegeLogoManager from '../../CollegeLogoManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench, Bug, GraduationCap } from 'lucide-react';

export function UtilityToolsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Utility Tools</h3>
        <p className="text-sm text-muted-foreground">
          Administrative tools for data management and debugging
        </p>
      </div>

      {/* URL & Data Tools */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Wrench className="h-4 w-4" />
          Data Tools
        </h4>
        <div className="grid gap-6 md:grid-cols-2">
          <UrlConversionTool />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                College Logo Manager
              </CardTitle>
              <CardDescription>
                Manage and update college logos used in the Top 100 leaderboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CollegeLogoManager />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Debug Tools */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Bug className="h-4 w-4" />
          Debug Tools
        </h4>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top 100 Debug Panel</CardTitle>
              <CardDescription>
                Override Top 100 UI for testing (local only)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Top100DebugPanel />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Destructive Tools */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-red-600 flex items-center gap-2">
          ⚠️ Destructive Operations
        </h4>
        <VerificationCleanSlateTool className="max-w-xl" />
      </div>
    </div>
  );
}

export default UtilityToolsTab;
