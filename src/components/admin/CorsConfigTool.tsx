import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { configureR2Cors } from '@/utils/configureCors';
import { toast } from 'sonner';

export const CorsConfigTool = () => {
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  const handleConfigureCors = async () => {
    setIsConfiguring(true);
    setResult(null);
    
    try {
      const response = await configureR2Cors('clbhouz-media');
      
      setResult({
        success: true,
        message: 'CORS policy configured successfully! R2 images should now load in preview.'
      });
      
      toast.success("Success!", {
        description: "R2 CORS configured. Refresh the page to see images load.",
      });
      
    } catch (error) {
      console.error('CORS configuration error:', error);
      
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to configure CORS'
      });
      
      toast.error("Error", {
        description: "Failed to configure CORS. Check console for details.",
      });
    } finally {
      setIsConfiguring(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔧 R2 CORS Configuration
        </CardTitle>
        <CardDescription>
          Configure Cloudflare R2 bucket CORS policy to allow images to load in Lovable preview environment.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            {result.success ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertDescription>
              {result.success ? result.message : result.error}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <h4 className="font-semibold">What this does:</h4>
          <ul className="text-sm space-y-1 ml-4">
            <li>• Adds *.lovable.dev and *.sandbox.lovable.dev to allowed origins</li>
            <li>• Allows GET and HEAD requests for image loading</li>
            <li>• Preserves existing production domain access</li>
            <li>• Fixes "Failed to load" image errors in preview</li>
          </ul>
        </div>

        <Button 
          onClick={handleConfigureCors}
          disabled={isConfiguring}
          className="w-full"
        >
          {isConfiguring ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Configuring CORS...
            </>
          ) : (
            "Configure R2 CORS Policy"
          )}
        </Button>
        
        <p className="text-xs text-muted-foreground">
          This uses your existing Cloudflare API token to update the CORS policy.
        </p>
      </CardContent>
    </Card>
  );
};