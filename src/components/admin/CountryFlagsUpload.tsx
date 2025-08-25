import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';

export const CountryFlagsUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const { toast } = useToast();

  const handleUpload = async () => {
    setIsUploading(true);
    setUploadResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('upload-country-flags');

      if (error) {
        console.error('Upload error:', error);
        toast({
          title: "Upload failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setUploadResult(data);
      
      if (data?.success) {
        toast({
          title: "Upload completed!",
          description: `Successfully uploaded ${data.statistics?.successful} flags to R2`,
        });
      } else {
        toast({
          title: "Upload failed",
          description: data?.error || "Unknown error occurred",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Upload failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Country Flags Upload
        </CardTitle>
        <CardDescription>
          Upload all country flags from GitHub to Cloudflare R2 storage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={handleUpload} 
          disabled={isUploading}
          className="w-full"
          size="lg"
        >
          {isUploading ? 'Uploading flags...' : 'Upload Country Flags to R2'}
        </Button>

        {uploadResult && (
          <div className="mt-4 p-4 border rounded-lg">
            {uploadResult.success ? (
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-700">Upload Successful!</h3>
                  <div className="text-sm text-gray-600 mt-2">
                    <p>Total files: {uploadResult.statistics?.total}</p>
                    <p>Successful: {uploadResult.statistics?.successful}</p>
                    <p>Failed: {uploadResult.statistics?.failed}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-700">Upload Failed</h3>
                  <p className="text-sm text-gray-600 mt-1">{uploadResult.error}</p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-gray-500">
          <p>This will:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Fetch all SVG flag files from the GitHub repository</li>
            <li>Upload them to the 'country-flags' bucket in Cloudflare R2</li>
            <li>Store metadata in the country_flags database table</li>
            <li>Process files in batches to avoid overwhelming the system</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};