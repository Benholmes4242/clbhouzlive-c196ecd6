import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Database, CheckCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function DatabaseUrlUpdater() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleUpdateUrls = async () => {
    setIsUpdating(true);
    setResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('update-database-urls-to-stream');
      
      if (error) {
        throw error;
      }
      
      setResult(data);
      if (data.success) {
        toast.success(`Updated ${data.updatedUrls} URLs`);
      } else {
        toast.error("Couldn't update URLs");
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("Couldn't update URLs");
      setResult({ error: error.message, success: false });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database URL Updater
        </CardTitle>
        <CardDescription>
          Update database references from R2 URLs to existing Cloudflare Stream URLs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            This tool scans your existing Cloudflare Stream videos and updates database URLs to point to Stream instead of R2. No video migration needed!
          </AlertDescription>
        </Alert>

        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {result.success ? (
                <div>
                  <strong>Update Complete!</strong>
                  <ul className="list-disc list-inside mt-2">
                    <li>Updated {result.updatedUrls} database URLs</li>
                    <li>Found {result.streamVideosFound} videos in Stream</li>
                    {result.errors?.length > 0 && (
                      <li className="text-destructive">
                        {result.errors.length} errors occurred
                      </li>
                    )}
                  </ul>
                </div>
              ) : (
                <div>
                  <strong>Update Failed:</strong> {result.error}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <h4 className="font-medium mb-2">What this does:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Gets all videos from your Cloudflare Stream</li>
              <li>Finds database records with R2 URLs (media.clbhouz.co.uk)</li>
              <li>Updates them to use the corresponding Stream URLs</li>
              <li>Works on post_media, profile_media, and course_review_media tables</li>
            </ul>
          </div>

          <Button 
            onClick={handleUpdateUrls}
            disabled={isUpdating}
            className="w-full"
          >
            {isUpdating ? "Updating URLs..." : "Update Database URLs to Stream"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}