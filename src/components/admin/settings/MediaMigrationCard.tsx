import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Play, Database, Cloud, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MigrationProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  status: 'idle' | 'running' | 'completed' | 'error';
  errors: string[];
}

const MediaMigrationCard = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<MigrationProgress>({
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    status: 'idle',
    errors: []
  });
  const { toast } = useToast();

  const startMigration = async () => {
    setIsRunning(true);
    setProgress({
      total: 0,
      processed: 0,
      successful: 0,
      failed: 0,
      status: 'running',
      errors: []
    });

    try {
      const { data, error } = await supabase.functions.invoke('migrate-media-to-cloudflare', {
        body: { 
          batchSize: 50,
          resumeFrom: 0
        }
      });

      if (error) {
        throw error;
      }

      setProgress({
        ...data,
        status: data.failed > 0 ? 'error' : 'completed'
      });

      if (data.failed === 0) {
        toast({
          title: "Migration Complete",
          description: `Successfully migrated ${data.successful} media files to Cloudflare R2.`,
        });
      } else {
        toast({
          title: "Migration Completed with Errors",
          description: `Migrated ${data.successful} files, but ${data.failed} failed.`,
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Migration error:', error);
      setProgress(prev => ({
        ...prev,
        status: 'error',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }));
      
      toast({
        title: "Migration Failed",
        description: "Failed to start migration. Check the logs for details.",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getProgressPercentage = () => {
    if (progress.total === 0) return 0;
    return Math.round((progress.processed / progress.total) * 100);
  };

  const getStatusIcon = () => {
    switch (progress.status) {
      case 'running':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Database className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="h-5 w-5" />
          Media Migration to Cloudflare R2
        </CardTitle>
        <CardDescription>
          Migrate existing media files from Supabase Storage to Cloudflare R2. 
          This includes profile photos, post media, course images, and logos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="text-sm font-medium">
              {progress.status === 'idle' && 'Ready to migrate'}
              {progress.status === 'running' && 'Migration in progress...'}
              {progress.status === 'completed' && 'Migration completed'}
              {progress.status === 'error' && 'Migration completed with errors'}
            </span>
          </div>
          
          <Button 
            onClick={startMigration}
            disabled={isRunning}
            size="sm"
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            {isRunning ? 'Migrating...' : 'Start Migration'}
          </Button>
        </div>

        {progress.status !== 'idle' && (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{progress.processed} / {progress.total} files</span>
              </div>
              <Progress value={getProgressPercentage()} className="h-2" />
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="font-medium text-green-600">{progress.successful}</div>
                <div className="text-muted-foreground">Successful</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-red-600">{progress.failed}</div>
                <div className="text-muted-foreground">Failed</div>
              </div>
              <div className="text-center">
                <div className="font-medium">{progress.total}</div>
                <div className="text-muted-foreground">Total</div>
              </div>
            </div>
          </div>
        )}

        {progress.errors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div className="font-medium">Migration Errors:</div>
                {progress.errors.slice(0, 3).map((error, index) => (
                  <div key={index} className="text-sm">• {error}</div>
                ))}
                {progress.errors.length > 3 && (
                  <div className="text-sm">... and {progress.errors.length - 3} more errors</div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <div>• Profile photos and cover photos from user profiles</div>
          <div>• Post media from user posts</div>
          <div>• Course review media</div>
          <div>• Logo files</div>
          <div>• Golf course thumbnail images</div>
          <div className="pt-1 font-medium">Videos will be migrated to Cloudflare Stream for optimized playback.</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MediaMigrationCard;