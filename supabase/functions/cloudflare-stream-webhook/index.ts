import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Verify the Cloudflare Stream webhook signature.
 * Spec: https://developers.cloudflare.com/stream/manage-video-library/using-webhooks/
 *
 * Header format: Webhook-Signature: time=<unix>,sig1=<hex_hmac_sha256>
 * Signature source: `${time}.${rawBody}`
 * Algorithm: HMAC-SHA256, hex lowercase.
 *
 * Additional check: reject timestamps older than 5 minutes (replay protection).
 */
async function verifyCloudflareSignature(
  header: string,
  rawBody: string,
  secret: string,
): Promise<boolean> {
  // Parse the header into a map of key→value.
  const parts = new Map<string, string>();
  for (const piece of header.split(',')) {
    const eq = piece.indexOf('=');
    if (eq === -1) continue;
    parts.set(piece.slice(0, eq).trim(), piece.slice(eq + 1).trim());
  }

  const time = parts.get('time');
  const sig1 = parts.get('sig1');
  if (!time || !sig1) {
    console.warn('[stream-webhook] Webhook-Signature header missing time or sig1');
    return false;
  }

  // Replay protection: reject timestamps that are too old.
  const timeSec = Number(time);
  if (!Number.isFinite(timeSec)) {
    console.warn('[stream-webhook] Webhook-Signature time is not a number');
    return false;
  }
  const ageSeconds = Math.floor(Date.now() / 1000) - timeSec;
  const MAX_AGE_SECONDS = 5 * 60;
  if (Math.abs(ageSeconds) > MAX_AGE_SECONDS) {
    console.warn(`[stream-webhook] Webhook timestamp too old or future-dated (age=${ageSeconds}s)`);
    return false;
  }

  // Compute expected signature.
  const encoder = new TextEncoder();
  const keyBytes = encoder.encode(secret);
  const messageBytes = encoder.encode(`${time}.${rawBody}`);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sigBytes = await crypto.subtle.sign('HMAC', cryptoKey, messageBytes);
  const expected = [...new Uint8Array(sigBytes)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Constant-time comparison.
  return timingSafeEqual(expected, sig1);
}

/**
 * Constant-time string comparison. Avoids timing side-channels that could
 * leak the valid signature one character at a time.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const webhookSecret = Deno.env.get('CLOUDFLARE_STREAM_WEBHOOK_SECRET');

    // Read the raw body FIRST — signature verification requires the exact bytes
    // Cloudflare sent. Parsing as JSON beforehand would break verification.
    const rawBody = await req.text();

    // Verify HMAC signature from Cloudflare Stream.
    // Header format: Webhook-Signature: time=<unix>,sig1=<hex_hmac_sha256>
    // Signed content: `${time}.${rawBody}`
    // Algorithm: HMAC-SHA256, hex-encoded.
    // Spec: https://developers.cloudflare.com/stream/manage-video-library/using-webhooks/
    const sigHeader = req.headers.get('Webhook-Signature');
    if (!webhookSecret) {
      console.error('[stream-webhook] CLOUDFLARE_STREAM_WEBHOOK_SECRET not configured — rejecting all requests');
      return new Response(JSON.stringify({ error: 'Server not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!sigHeader) {
      console.warn('[stream-webhook] Missing Webhook-Signature header — rejecting');
      return new Response(JSON.stringify({ error: 'Missing signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const verified = await verifyCloudflareSignature(sigHeader, rawBody, webhookSecret);
    if (!verified) {
      console.warn('[stream-webhook] Signature verification failed — rejecting');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = JSON.parse(rawBody);
    console.log('[stream-webhook] Received:', rawBody);

    const { uid, status, input, duration } = body;

    // Only process 'ready' events
    if (status?.state !== 'ready') {
      console.log(`[stream-webhook] Ignoring state: ${status?.state}`);
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!uid) {
      return new Response(JSON.stringify({ error: 'No uid' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const width = input?.width ?? null;
    const height = input?.height ?? null;
    const durationSeconds = duration ? Math.round(duration) : null;
    const aspectRatio =
      width && height ? parseFloat((width / height).toFixed(4)) : null;

    console.log(
      `[stream-webhook] Ready: ${uid} — ${width}x${height} ${durationSeconds}s`
    );

    // Find post_media by stream_id or URL match
    const { data: mediaRows, error: findError } = await supabase
      .from('post_media')
      .select('id, width, height, duration_seconds, aspect_ratio')
      .or(`stream_id.eq.${uid},media_url.ilike.%${uid}%`)
      .eq('media_type', 'video');

    if (findError) throw findError;

    if (!mediaRows || mediaRows.length === 0) {
      console.warn(`[stream-webhook] No post_media found for uid: ${uid}`);
      return new Response(
        JSON.stringify({ received: true, warning: 'No matching row' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Only update fields that are still null — don't overwrite client-side values
    const updateData: Record<string, unknown> = { stream_id: uid };
    const row = mediaRows[0];
    if (!row.width && width) updateData.width = width;
    if (!row.height && height) updateData.height = height;
    if (!row.duration_seconds && durationSeconds) {
      updateData.duration_seconds = durationSeconds;
      updateData.duration_ms = durationSeconds * 1000;
    }
    if (!row.aspect_ratio && width && height) updateData.aspect_ratio = aspectRatio;

    // Phase 4: Format-boundary enforcement.
    // Mark the row eligible for feeds atomically with the metadata write.
    // Defensive: only mark 'complete' when we have a valid positive duration —
    // either from this webhook payload OR already persisted on the row.
    // If Cloudflare returns junk metadata, leave the row stuck rather than
    // letting a phantom (zero-length / unknown-duration) post into feeds.
    const effectiveDuration =
      durationSeconds && durationSeconds > 0
        ? durationSeconds
        : row.duration_seconds && row.duration_seconds > 0
        ? row.duration_seconds
        : null;

    if (effectiveDuration !== null) {
      updateData.processing_status = 'complete';
      updateData.processed_at = new Date().toISOString();
    } else {
      updateData.processing_status = 'failed';
      updateData.processing_error = 'Cloudflare Stream returned no usable duration';
    }

    const ids = mediaRows.map((r: { id: string }) => r.id);
    const { error: updateError } = await supabase
      .from('post_media')
      .update(updateData)
      .in('id', ids);

    if (updateError) throw updateError;

    console.log(
      `[stream-webhook] Updated ${ids.length} row(s) for uid: ${uid} status=${updateData.processing_status}`
    );

    return new Response(
      JSON.stringify({ received: true, updated: ids.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[stream-webhook] Error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
