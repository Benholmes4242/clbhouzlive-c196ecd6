import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Check, AlertCircle, Video, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MigrationResult {
  success: boolean;
  totalVideos?: number;
  migratedVideos?: number;
  errors?: string[];
  message?: string;
  streamVideos?: { r2Path: string; streamUrl: string; streamId: string }[];
}

const VideoMigrationTool = () => {
  const [isMigrating, setIsMigrating] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);

  const handleMigrateVideos = async () => {
    setIsMigrating(true);
    setResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('migrate-videos-r2-to-stream');
      
      if (error) {
        throw new Error(error.message);
      }
      
      setResult(data);
      
      if (data.success !== false) {
        toast.success("Migration Complete!", {
          description: `Successfully migrated ${data.migratedVideos || 0} videos from R2 to Cloudflare Stream.`,
        });
      } else {
        toast.error("Migration Failed", {
          description: data.message || "An error occurred during migration",
        });
      }
      
    } catch (error) {
      console.error('Video migration error:', error);
      
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to migrate videos'
      });
      
      toast.error("Error", {
        description: "Failed to start video migration. Check console for details.",
      });
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Video Migration: R2 → Stream
        </CardTitle>
        <CardDescription>
          Migrate videos that were incorrectly placed in R2 storage to Cloudflare Stream where they belong.
          This fixes the video upload issue and moves videos to their proper service.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {result && (
          <Alert variant={result.success !== false ? "default" : "destructive"}>
            {result.success !== false ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertDescription>
              {result.success !== false ? (
                <div className="space-y-2">
                  <div className="font-medium">Migration Results:</div>
                  <div className="text-sm space-y-1">
                    <div>• Total videos found: {result.totalVideos || 0}</div>
                    <div>• Successfully migrated: {result.migratedVideos || 0}</div>
                    {result.errors && result.errors.length > 0 && (
                      <div>• Errors: {result.errors.length}</div>
                    )}
                    {result.streamVideos && result.streamVideos.length > 0 && (
                      <div className="mt-2">
                        <div className="font-medium text-xs">Migrated Videos:</div>
                        {result.streamVideos.slice(0, 3).map((video, i) => (
                          <div key={i} className="text-xs opacity-75 flex items-center gap-1">
                            <span className="truncate">{video.r2Path}</span>
                            <ArrowRight className="h-3 w-3" />
                            <span className="text-green-600">Stream</span>
                          </div>
                        ))}
                        {result.streamVideos.length > 3 && (
                          <div className="text-xs opacity-75">
                            ... and {result.streamVideos.length - 3} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                result.message || result.errors?.[0] || 'Migration failed'
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <h4 className="font-semibold">What this migration does:</h4>
          <ul className="text-sm space-y-1 ml-4">
            <li>• Scans R2 bucket for video files (.mov, .mp4, .avi, etc.)</li>
            <li>• Downloads each video from R2 storage</li>
            <li>• Uploads videos to Cloudflare Stream (proper service for videos)</li>
            <li>• Updates database references to point to Stream URLs</li>
            <li>• Deletes videos from R2 (cleanup)</li>
            <li>• Preserves all video metadata and associations</li>
          </ul>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md border border-yellow-200 dark:border-yellow-800">
          <div className="text-sm">
            <div className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">⚠️ Important Note</div>
            <div className="text-yellow-700 dark:text-yellow-300">
              This migration is safe and preserves your videos. Videos incorrectly stored in R2 will be 
              moved to Cloudflare Stream where they belong, and all database references will be updated.
            </div>
          </div>
        </div>

        <Button 
          onClick={handleMigrateVideos}
          disabled={isMigrating}
          className="w-full"
        >
          {isMigrating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Migrating Videos...
            </>
          ) : (
            <>
              <Video className="mr-2 h-4 w-4" />
              Migrate Videos from R2 to Stream
            </>
          )}
        </Button>
        
        <p className="text-xs text-muted-foreground">
          This process uses your Cloudflare Stream API token to upload videos and R2 API token to access and clean up R2 storage.
        </p>
      </CardContent>
    </Card>
  );
};

export default VideoMigrationTool;
