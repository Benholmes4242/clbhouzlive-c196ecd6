import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, PlayCircle, CheckCircle2, XCircle } from 'lucide-react';

interface BackfillResult {
  success: boolean;
  processed?: number;
  failed?: number;
  total?: number;
  successCount?: number;
  failureCount?: number;
  message?: string;
  dry_run?: boolean;
  failures?: Array<{ id: string; url: string; error: string }>;
}

export default function AdminBackfill() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<BackfillResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [backfillType, setBackfillType] = useState<'duration' | 'metadata' | null>(null);

  const runBackfill = async (type: 'duration' | 'metadata') => {
    setIsRunning(true);
    setError(null);
    setResult(null);
    setBackfillType(type);

    try {
      const functionName = type === 'duration' 
        ? 'backfill-video-durations' 
        : 'backfill-video-metadata';
      
      const { data, error: invokeError } = await supabase.functions.invoke(
        functionName,
        {
          body: {},
          method: 'POST',
        }
      );

      if (invokeError) throw invokeError;
      setResult(data as BackfillResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Video Duration Backfill</h1>
        <p className="text-muted-foreground">
          Populate duration_seconds for all Cloudflare Stream videos
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Duration Backfill</CardTitle>
          <CardDescription>
            Populate duration_seconds for videos missing this data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button
              onClick={() => runBackfill('duration')}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning && backfillType === 'duration' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PlayCircle className="h-4 w-4" />
              )}
              Run Duration Backfill
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && backfillType === 'duration' && (
            <Alert variant={result.success ? 'default' : 'destructive'}>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-semibold">
                    {result.success ? 'Duration Backfill Complete' : 'Duration Backfill Failed'}
                  </div>
                  <div className="text-sm space-y-1">
                    <div>Total videos found: {result.total}</div>
                    <div>Successfully processed: {result.processed}</div>
                    <div>Failed: {result.failed}</div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Metadata Backfill</CardTitle>
          <CardDescription>
            Populate width, height, aspect_ratio, duration, and poster_url from Cloudflare Stream API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button
              onClick={() => runBackfill('metadata')}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning && backfillType === 'metadata' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PlayCircle className="h-4 w-4" />
              )}
              Run Metadata Backfill
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && backfillType === 'metadata' && (
            <Alert variant={result.success ? 'default' : 'destructive'}>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-semibold">
                    {result.success ? 'Metadata Backfill Complete' : 'Metadata Backfill Failed'}
                  </div>
                  {result.message && <div className="text-sm">{result.message}</div>}
                  <div className="text-sm space-y-1">
                    <div>Total videos: {result.total || 0}</div>
                    <div>Successfully updated: {result.successCount || 0}</div>
                    <div>Failed: {result.failureCount || 0}</div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SQL Verification</CardTitle>
          <CardDescription>Run these queries in Supabase SQL Editor to verify</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-4 rounded overflow-x-auto">
{`-- Before/after counts
SELECT
  COUNT(*) FILTER (WHERE media_type='video' AND duration_seconds IS NULL) as null_dur,
  COUNT(*) FILTER (WHERE media_type='video' AND duration_seconds <= 180) as le_180,
  COUNT(*) FILTER (WHERE media_type='video' AND duration_seconds > 180) as gt_180
FROM post_media;

-- Spot-check recent updates
SELECT id, media_url, duration_seconds
FROM post_media
WHERE media_type='video'
ORDER BY updated_at DESC
LIMIT 20;`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
