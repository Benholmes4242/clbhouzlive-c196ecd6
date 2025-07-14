import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, Upload, Database } from 'lucide-react';
import { useMediaMigration } from '@/hooks/useMediaMigration';

const MediaMigrationPanel: React.FC = () => {
  const { startMigration, getMigrationEstimate, migrationProgress, isMigrating } = useMediaMigration();
  const [estimate, setEstimate] = useState<any>(null);

  useEffect(() => {
    getMigrationEstimate().then(setEstimate);
  }, [getMigrationEstimate]);

  const handleStartMigration = () => {
    if (confirm('This will migrate all existing media files to Cloudflare R2 and Stream. This action cannot be undone. Continue?')) {
      startMigration();
    }
  };

  const progressPercentage = migrationProgress 
    ? Math.round((migrationProgress.processed / migrationProgress.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Media Migration to Cloudflare
          </CardTitle>
          <CardDescription>
            Migrate all existing images and videos from Supabase Storage to Cloudflare R2 and Stream for faster global delivery.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {estimate && (
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{estimate.totalItems}</div>
                <div className="text-sm text-muted-foreground">Files to migrate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">~{estimate.estimatedTimeMinutes}min</div>
                <div className="text-sm text-muted-foreground">Estimated time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{estimate.estimatedCost}</div>
                <div className="text-sm text-muted-foreground">Estimated cost</div>
              </div>
            </div>
          )}

          {migrationProgress && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Migration Progress</span>
                <Badge variant={
                  migrationProgress.status === 'completed' ? 'default' :
                  migrationProgress.status === 'error' ? 'destructive' : 'secondary'
                }>
                  {migrationProgress.status === 'running' && <Clock className="h-3 w-3 mr-1" />}
                  {migrationProgress.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                  {migrationProgress.status === 'error' && <AlertCircle className="h-3 w-3 mr-1" />}
                  {migrationProgress.status}
                </Badge>
              </div>

              <Progress value={progressPercentage} className="w-full" />

              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-center">
                  <div className="font-medium text-green-600">{migrationProgress.successful}</div>
                  <div className="text-muted-foreground">Successful</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-red-600">{migrationProgress.failed}</div>
                  <div className="text-muted-foreground">Failed</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">{migrationProgress.processed}/{migrationProgress.total}</div>
                  <div className="text-muted-foreground">Processed</div>
                </div>
              </div>

              {migrationProgress.errors.length > 0 && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <div className="text-sm font-medium text-red-800 mb-2">Errors:</div>
                  <div className="text-xs text-red-700 space-y-1 max-h-32 overflow-y-auto">
                    {migrationProgress.errors.slice(0, 5).map((error, index) => (
                      <div key={index}>• {error}</div>
                    ))}
                    {migrationProgress.errors.length > 5 && (
                      <div>... and {migrationProgress.errors.length - 5} more errors</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Images will be moved to Cloudflare R2 with custom domain
            </div>
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Videos will be moved to Cloudflare Stream for optimized playback
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Original files will remain in Supabase as backup
            </div>
          </div>

          <Button 
            onClick={handleStartMigration}
            disabled={isMigrating || (migrationProgress?.status === 'running')}
            className="w-full"
            size="lg"
          >
            {isMigrating ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Migrating Media...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Start Migration
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default MediaMigrationPanel;