import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Loader2, Upload, CheckCircle } from 'lucide-react';

interface MigrationProgress {
  totalFiles: number;
  processedFiles: number;
  migratedFiles: number;
  errors: string[];
  bucketResults: Record<string, any>;
}

export const ImageMigrationTool = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<MigrationProgress | null>(null);
  const [completed, setCompleted] = useState(false);
  const { toast } = useToast();

  const startMigration = async () => {
    setIsRunning(true);
    setProgress(null);
    setCompleted(false);

    try {
      console.log('🚀 Starting image migration to Cloudflare R2...');
      
      const { data, error } = await supabase.functions.invoke('migrate-all-images-to-r2');
      
      if (error) {
        console.error('Migration error:', error);
        toast({
          title: "Migration Failed",
          description: error.message || "Failed to start migration",
          variant: "destructive"
        });
        return;
      }

      setProgress(data);
      setCompleted(true);
      
      toast({
        title: "Migration Completed!",
        description: `Successfully migrated ${data.migratedFiles} out of ${data.totalFiles} files to Cloudflare R2`,
        duration: 10000
      });

      console.log('✅ Migration completed successfully:', data);

    } catch (error) {
      console.error('Migration error:', error);
      toast({
        title: "Migration Failed", 
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Image Migration to Cloudflare R2</h2>
        <p className="text-muted-foreground">
          Migrate all images from Supabase storage to Cloudflare R2 for faster loading
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Button 
            onClick={startMigration} 
            disabled={isRunning}
            className="w-full"
            size="lg"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Migrating Images...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {completed ? 'Run Migration Again' : 'Start Migration'}
              </>
            )}
          </Button>
          
          {completed && (
            <p className="text-sm text-muted-foreground text-center">
              Re-run to attempt migration of remaining files
            </p>
          )}
        </div>

        {completed && (
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
              Migration Completed!
            </h3>
          </div>
        )}

        {progress && (
          <div className="space-y-4">
            <div className="bg-card p-4 rounded-lg border">
              <h3 className="font-semibold mb-2">Migration Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Files:</span>
                  <span className="ml-2 font-medium">{progress.totalFiles}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Migrated:</span>
                  <span className="ml-2 font-medium text-green-600">{progress.migratedFiles}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Processed:</span>
                  <span className="ml-2 font-medium">{progress.processedFiles}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Errors:</span>
                  <span className="ml-2 font-medium text-red-600">{progress.errors.length}</span>
                </div>
              </div>
            </div>

            {Object.keys(progress.bucketResults).length > 0 && (
              <div className="bg-card p-4 rounded-lg border">
                <h3 className="font-semibold mb-2">Bucket Results</h3>
                <div className="space-y-2 text-sm">
                  {Object.entries(progress.bucketResults).map(([bucket, result]: [string, any]) => (
                    <div key={bucket} className="flex justify-between">
                      <span className="text-muted-foreground">{bucket}:</span>
                      <span className="font-medium">
                        {result.migratedFiles}/{result.totalFiles} migrated
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {progress.errors.length > 0 && (
              <div className="bg-card p-4 rounded-lg border border-red-200 dark:border-red-800">
                <h3 className="font-semibold mb-2 text-red-800 dark:text-red-200">Errors</h3>
                <div className="space-y-1 text-sm text-red-600 dark:text-red-400 max-h-40 overflow-y-auto">
                  {progress.errors.map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};