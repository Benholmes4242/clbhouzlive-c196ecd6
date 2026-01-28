import React, { useState } from 'react';
import { VideoUrlAnalyzer } from '../../VideoUrlAnalyzer';
import VideoMigrationTool from '../../VideoMigrationTool';
import { ManualVideoMigration } from '../../ManualVideoMigration';
import { DatabaseUrlUpdater } from '../../DatabaseUrlUpdater';
import { StreamAccountIdFixer } from '../../StreamAccountIdFixer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, RefreshCw, Database, Video, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function DataManagementTab() {
  const [clearingCache, setClearingCache] = useState(false);

  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      // Clear localStorage cache
      const keysToRemove = Object.keys(localStorage).filter(
        key => key.startsWith('cache_') || key.startsWith('query_')
      );
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      toast.success(`Cleared ${keysToRemove.length} cached items`);
    } catch (error) {
      toast.error('Failed to clear cache');
    } finally {
      setClearingCache(false);
    }
  };

  const handleRefreshData = () => {
    // Force reload the page to refresh all queries
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Data Management</h3>
        <p className="text-sm text-muted-foreground">
          Cache management, data exports, and database maintenance
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={handleClearCache}
          disabled={clearingCache}
        >
          {clearingCache ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4 mr-2" />
          )}
          Clear Local Cache
        </Button>
        <Button variant="outline" onClick={handleRefreshData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh All Data
        </Button>
      </div>

      {/* Video Analysis Tools */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Video className="h-4 w-4" />
          Video Management
        </h4>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <VideoUrlAnalyzer />
          <VideoMigrationTool />
          <ManualVideoMigration />
        </div>
      </div>

      {/* Database Tools */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Database className="h-4 w-4" />
          Database Utilities
        </h4>
        <div className="grid gap-6 md:grid-cols-2">
          <DatabaseUrlUpdater />
          <StreamAccountIdFixer />
        </div>
      </div>
    </div>
  );
}

export default DataManagementTab;
