import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MigrationProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  status: 'running' | 'completed' | 'error' | 'no_files_to_migrate';
  errors: string[];
}

export const useMediaMigration = () => {
  const [migrationProgress, setMigrationProgress] = useState<MigrationProgress | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const { toast } = useToast();

  const startMigration = useCallback(async (options?: {
    batchSize?: number;
    resumeFrom?: number;
  }) => {
    setIsMigrating(true);
    setMigrationProgress(null);

    try {
      console.log('Starting media migration to Cloudflare...');
      
      const { data, error } = await supabase.functions.invoke('migrate-media-to-cloudflare', {
        body: {
          batchSize: options?.batchSize || 10,
          resumeFrom: options?.resumeFrom || 0
        }
      });

      if (error) {
        console.error('Migration error:', error);
        toast({
          title: "Migration Failed",
          description: `Failed to start migration: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      setMigrationProgress(data);

      if (data.status === 'completed') {
        toast({
          title: "Migration Completed!",
          description: `Successfully migrated ${data.successful}/${data.total} files to Cloudflare.`,
          variant: "default"
        });
      } else if (data.status === 'no_files_to_migrate') {
        toast({
          title: "No Files to Migrate",
          description: "All media files are already using Cloudflare or no media files were found.",
          variant: "default"
        });
      } else if (data.status === 'error') {
        toast({
          title: "Migration Had Errors",
          description: `${data.successful} succeeded, ${data.failed} failed. Check console for details.`,
          variant: "destructive"
        });
      }

      console.log('Migration result:', data);

    } catch (error) {
      console.error('Migration exception:', error);
      toast({
        title: "Migration Error",
        description: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsMigrating(false);
    }
  }, [toast]);

  const getMigrationEstimate = useCallback(async () => {
    try {
      // Get count of media items that need migration
      const queries = [
        supabase.from('post_media').select('*', { count: 'exact', head: true }),
        supabase.from('course_review_media').select('*', { count: 'exact', head: true }),
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }).not('profile_photo_url', 'is', null),
        supabase.from('logos').select('*', { count: 'exact', head: true })
      ];

      const results = await Promise.all(queries);
      const totalItems = results.reduce((sum, result) => sum + (result.count || 0), 0);

      return {
        totalItems,
        estimatedTimeMinutes: Math.ceil(totalItems / 10), // Assuming 10 items per minute
        estimatedCost: '$0.00' // R2 and Stream have generous free tiers
      };

    } catch (error) {
      console.error('Error getting migration estimate:', error);
      return null;
    }
  }, []);

  return {
    startMigration,
    getMigrationEstimate,
    migrationProgress,
    isMigrating
  };
};