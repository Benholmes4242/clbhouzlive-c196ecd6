// TODO(security): No signature verification. Any caller can POST to this
// endpoint and overwrite metadata for any post_media row by stream_id.
// Follow-up: add HMAC verification using Cloudflare's webhook signing secret.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    console.log('[stream-webhook] Received:', JSON.stringify(body));

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

    const ids = mediaRows.map((r: { id: string }) => r.id);
    const { error: updateError } = await supabase
      .from('post_media')
      .update(updateData)
      .in('id', ids);

    if (updateError) throw updateError;

    console.log(
      `[stream-webhook] Updated ${ids.length} row(s) for uid: ${uid}`
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
