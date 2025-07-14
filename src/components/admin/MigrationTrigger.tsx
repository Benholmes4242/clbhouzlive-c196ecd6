import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

export function MigrationTrigger() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  const triggerMigration = async () => {
    setIsRunning(true);
    setResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('migrate-media-to-cloudflare', {
        body: { 
          batchSize: 10,
          resumeFrom: 0 
        }
      });

      if (error) {
        setResult({ error: error });
      } else {
        setResult({ success: true, data });
      }
    } catch (err) {
      setResult({ error: { message: err.message } });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Migration Trigger</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={triggerMigration} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? 'Running Migration...' : 'Start Migration'}
        </Button>
        
        {result && (
          <div className="p-4 rounded-md bg-muted">
            <pre className="text-sm overflow-auto max-h-64">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}