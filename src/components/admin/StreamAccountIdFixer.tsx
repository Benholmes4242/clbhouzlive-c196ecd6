import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wrench, CheckCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function StreamAccountIdFixer() {
  const [isFixing, setIsFixing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFix = async () => {
    setIsFixing(true);
    setResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('fix-stream-account-ids');
      
      if (error) {
        throw error;
      }
      
      setResult(data);
      if (data.success) {
        toast.success(`Fixed ${data.updatedUrls} Stream URLs`);
      } else {
        toast.error("Couldn't fix Stream IDs");
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("Couldn't fix Stream IDs");
      setResult({ error: error.message, success: false });
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Stream Account ID Fixer
        </CardTitle>
        <CardDescription>
          Fix Stream URLs that are using incorrect account IDs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Issue Detected:</strong> Some Stream URLs are using wrong account IDs (like "4ah4gni80ytefpck") instead of the correct one. This causes videos to fail loading.
          </AlertDescription>
        </Alert>

        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              {result.success ? (
                <div>
                  <strong>Fix Complete!</strong>
                  <ul className="list-disc list-inside mt-2">
                    <li>Updated {result.updatedUrls} Stream URLs</li>
                    <li>Correct account ID: {result.correctAccountId}</li>
                    <li>Fixed account IDs: {result.wrongAccountIds?.join(', ')}</li>
                    {result.errors?.length > 0 && (
                      <li className="text-destructive">
                        {result.errors.length} errors occurred
                      </li>
                    )}
                  </ul>
                </div>
              ) : (
                <div>
                  <strong>Fix Failed:</strong> {result.error}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <h4 className="font-medium mb-2">What this fixes:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Finds Stream URLs with incorrect account IDs</li>
              <li>Updates them to use your correct Cloudflare account ID</li>
              <li>Fixes both video URLs and thumbnail URLs</li>
              <li>Should resolve "failed to load" video issues</li>
            </ul>
          </div>

          <Button 
            onClick={handleFix}
            disabled={isFixing}
            className="w-full"
            variant="destructive"
          >
            {isFixing ? "Fixing Account IDs..." : "Fix Stream Account IDs"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}