// Watch tab — Phase B poster backfill (Session 2 of 3)
//
// Rewrites post_media.poster_url for every existing video row so the poster
// frame is taken from the video midpoint (duration_seconds / 2) instead of
// the first frame. First-frame posters are usually a black fade-in or
// pre-action still; midpoint posters are dramatically more representative.
//
// SAFETY: dry-run by default. Only writes when called with `?confirm=true`.
// In dry-run mode it returns a sample of the rewrites it WOULD perform so
// you can spot-check a few URLs in the browser before committing.
//
// Usage:
//   GET  /functions/v1/backfill-video-posters                 → dry run
//   POST /functions/v1/backfill-video-posters?confirm=true    → live run
//
// Idempotent: rows whose poster_url already includes `?time=` are skipped.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const BATCH_SIZE = 100;
const SAMPLE_SIZE = 50; // size of preview returned in dry-run mode

interface MediaRow {
  id: string;
  poster_url: string | null;
  duration_seconds: number | null;
  stream_id: string | null;
}

function rewritePosterUrl(currentUrl: string, durationSeconds: number): string | null {
  // Idempotent — already rewritten.
  if (currentUrl.includes('?time=') || currentUrl.includes('&time=')) return null;

  const midpoint = Math.max(1, Math.floor(durationSeconds / 2));
  const sep = currentUrl.includes('?') ? '&' : '?';
  return `${currentUrl}${sep}time=${midpoint}s`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const confirm = url.searchParams.get('confirm') === 'true';

  // Service-role client — backfill writes need to bypass RLS.
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const stats = {
    mode: confirm ? 'LIVE' : 'DRY-RUN',
    scanned: 0,
    eligible: 0,
    skippedAlreadyMidpoint: 0,
    skippedNoDuration: 0,
    skippedNoStream: 0,
    skippedNoPoster: 0,
    rewritten: 0,
    failed: 0,
    sample: [] as { id: string; before: string; after: string }[],
    errors: [] as string[],
  };

  let cursor: string | null = null;
  let pageCount = 0;
  const MAX_PAGES = 1000; // safety guard, ~100k rows max per invocation

  while (pageCount < MAX_PAGES) {
    pageCount++;

    let q = supabase
      .from('post_media')
      .select('id, poster_url, duration_seconds, stream_id')
      .eq('media_type', 'video')
      .order('id', { ascending: true })
      .limit(BATCH_SIZE);

    if (cursor) q = q.gt('id', cursor);

    const { data: rows, error } = await q;

    if (error) {
      stats.errors.push(`page ${pageCount}: ${error.message}`);
      break;
    }
    if (!rows || rows.length === 0) break;

    stats.scanned += rows.length;
    cursor = rows[rows.length - 1].id;

    for (const row of rows as MediaRow[]) {
      if (!row.stream_id) {
        stats.skippedNoStream++;
        continue;
      }
      if (!row.poster_url) {
        stats.skippedNoPoster++;
        continue;
      }
      if (!row.duration_seconds || row.duration_seconds <= 0) {
        stats.skippedNoDuration++;
        continue;
      }

      const newUrl = rewritePosterUrl(row.poster_url, row.duration_seconds);
      if (!newUrl) {
        stats.skippedAlreadyMidpoint++;
        continue;
      }

      stats.eligible++;

      // Capture a small sample for the dry-run preview / live audit log.
      if (stats.sample.length < SAMPLE_SIZE) {
        stats.sample.push({
          id: row.id,
          before: row.poster_url,
          after: newUrl,
        });
      }

      if (!confirm) continue;

      const { error: updateError } = await supabase
        .from('post_media')
        .update({ poster_url: newUrl })
        .eq('id', row.id);

      if (updateError) {
        stats.failed++;
        if (stats.errors.length < 20) {
          stats.errors.push(`row ${row.id}: ${updateError.message}`);
        }
      } else {
        stats.rewritten++;
      }
    }

    // Stop if the page returned fewer than BATCH_SIZE rows — last page.
    if (rows.length < BATCH_SIZE) break;
  }

  return new Response(JSON.stringify(stats, null, 2), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
