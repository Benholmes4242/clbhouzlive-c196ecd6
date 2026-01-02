import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, PlayCircle, CheckCircle2, XCircle, Home } from 'lucide-react';

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

interface HomeClubBackfillResult {
  success: boolean;
  matched: number;
  unmatched: number;
  alreadySet: number;
  total: number;
  unmatchedClubs: string[];
}

export default function AdminBackfill() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<BackfillResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [backfillType, setBackfillType] = useState<'duration' | 'metadata' | 'homeclub' | null>(null);
  const [homeClubResult, setHomeClubResult] = useState<HomeClubBackfillResult | null>(null);
  const [isDryRun, setIsDryRun] = useState(true);

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

  const runHomeClubBackfill = async (dryRun: boolean) => {
    setIsRunning(true);
    setError(null);
    setHomeClubResult(null);
    setBackfillType('homeclub');
    setIsDryRun(dryRun);

    try {
      // 1. Fetch all golf_clubs for matching
      const { data: clubs, error: clubsError } = await supabase
        .from('golf_clubs')
        .select('id, name');
      
      if (clubsError) throw clubsError;

      // Build lookup map (lowercase name -> club id)
      const clubMap = new Map<string, string>();
      for (const club of clubs || []) {
        if (club.name) {
          clubMap.set(club.name.toLowerCase().trim(), club.id);
        }
      }

      // 2. Fetch users with home_club text but no primary_club_id
      const { data: users, error: usersError } = await supabase
        .from('user_profiles')
        .select('id, home_club, primary_club_id')
        .is('primary_club_id', null)
        .not('home_club', 'is', null);

      if (usersError) throw usersError;

      let matched = 0;
      let unmatched = 0;
      let alreadySet = 0;
      const unmatchedClubs: string[] = [];

      // 3. Match and update
      for (const user of users || []) {
        if (user.primary_club_id) {
          alreadySet++;
          continue;
        }

        const homeClub = user.home_club?.toLowerCase().trim();
        if (!homeClub) continue;

        const matchedClubId = clubMap.get(homeClub);

        if (matchedClubId) {
          if (!dryRun) {
            const { error: updateError } = await supabase
              .from('user_profiles')
              .update({ primary_club_id: matchedClubId })
              .eq('id', user.id);

            if (updateError) {
              console.error(`Failed to update user ${user.id}:`, updateError);
              unmatched++;
              continue;
            }
          }
          matched++;
        } else {
          unmatched++;
          if (!unmatchedClubs.includes(user.home_club!)) {
            unmatchedClubs.push(user.home_club!);
          }
        }
      }

      setHomeClubResult({
        success: true,
        matched,
        unmatched,
        alreadySet,
        total: (users || []).length,
        unmatchedClubs: unmatchedClubs.slice(0, 20), // Show first 20
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Backfill Tools</h1>
        <p className="text-muted-foreground">
          One-time data migrations and fixes
        </p>
      </div>

      {/* Home Club Backfill - NEW */}
      <Card className="border-primary/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Home Club ID Backfill
          </CardTitle>
          <CardDescription>
            Match <code>home_club</code> text to <code>golf_clubs.name</code> and populate <code>primary_club_id</code>.
            This fixes the "Golfers to Follow → Home Club" empty state bug.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => runHomeClubBackfill(true)}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning && backfillType === 'homeclub' && isDryRun ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PlayCircle className="h-4 w-4" />
              )}
              Dry Run (Preview)
            </Button>
            <Button
              onClick={() => runHomeClubBackfill(false)}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning && backfillType === 'homeclub' && !isDryRun ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PlayCircle className="h-4 w-4" />
              )}
              Run Backfill
            </Button>
          </div>

          {error && backfillType === 'homeclub' && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {homeClubResult && (
            <Alert variant={homeClubResult.success ? 'default' : 'destructive'}>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-semibold">
                    {isDryRun ? '🔍 Dry Run Results' : '✅ Backfill Complete'}
                  </div>
                  <div className="text-sm space-y-1">
                    <div>Total users without primary_club_id: {homeClubResult.total}</div>
                    <div className="text-green-600">Would match / Matched: {homeClubResult.matched}</div>
                    <div className="text-amber-600">Unmatched (no exact club name): {homeClubResult.unmatched}</div>
                  </div>
                  {homeClubResult.unmatchedClubs.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs font-medium text-muted-foreground">Unmatched club names (first 20):</div>
                      <div className="text-xs text-muted-foreground mt-1 max-h-32 overflow-y-auto">
                        {homeClubResult.unmatchedClubs.map((club, i) => (
                          <div key={i}>• {club}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

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

          {error && backfillType === 'duration' && (
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

          {error && backfillType === 'metadata' && (
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
{`-- Home Club backfill verification
SELECT 
  COUNT(*) FILTER (WHERE primary_club_id IS NOT NULL) as has_club_id,
  COUNT(*) FILTER (WHERE primary_club_id IS NULL AND home_club IS NOT NULL) as text_only,
  COUNT(*) FILTER (WHERE primary_club_id IS NULL AND home_club IS NULL) as no_club
FROM user_profiles;

-- Video duration counts
SELECT
  COUNT(*) FILTER (WHERE media_type='video' AND duration_seconds IS NULL) as null_dur,
  COUNT(*) FILTER (WHERE media_type='video' AND duration_seconds <= 180) as le_180,
  COUNT(*) FILTER (WHERE media_type='video' AND duration_seconds > 180) as gt_180
FROM post_media;`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
