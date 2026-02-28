import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const UrlConversionTool: React.FC = () => {
  const [isConverting, setIsConverting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; totalUpdated?: number; message?: string; error?: string } | null>(null);

  const handleConvertUrls = async () => {
    setIsConverting(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('update-media-urls-to-r2');
      if (error) throw error;
      setResult(data);
      if (data.success) {
        toast.success("Conversion complete", { description: `${data.totalUpdated} URLs updated` });
      } else {
        toast.error("Conversion failed", { description: data.error || "Unknown error" });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResult({ success: false, error: errorMessage });
      toast.error("Conversion failed", { description: errorMessage });
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          Media URL Conversion
        </CardTitle>
        <CardDescription>Convert all database URLs from Supabase storage to Cloudflare R2 format.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            {result.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertDescription>{result.success ? `Success: ${result.message}` : `Error: ${result.error}`}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">This will update URLs in the following tables:</p>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
            <li>post_media (post images/videos)</li>
            <li>user_profiles (avatars, cover images, logos)</li>
            <li>profile_media (profile media)</li>
            <li>golf_courses (thumbnail images)</li>
          </ul>
        </div>
        <Button onClick={handleConvertUrls} disabled={isConverting} className="w-full">
          {isConverting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Converting URLs...</>) : 'Convert URLs to R2 Format'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default UrlConversionTool;
