/** Caller ownership is checked before ANY delete. Stream creator is server-stamped; legacy proof is an owned review row. */
import { serve } from 'https://deno.land/std@0.220.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { AwsClient } from 'npm:aws4fetch@1.0.20';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { cleanupOwnedItem, type CleanupItem, type CleanupStatus } from '../_shared/reviewMediaOwnership.ts';
export const VERSION = '2026-10-26-review-owner-v1';
serve(async req => {
  const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method === 'GET') return respond({ version: VERSION });
  if (req.method !== 'POST') return respond({ error: 'Method not allowed' }, 405);
  const auth = req.headers.get('Authorization');
  const url = Deno.env.get('SUPABASE_URL'); const anon = Deno.env.get('SUPABASE_ANON_KEY');
  if (!auth?.startsWith('Bearer ') || !url || !anon) return respond({ error: 'Unauthorized' }, 401);
  const client = createClient(url, anon, { global: { headers: { Authorization: auth } } });
  const { data: { user }, error } = await client.auth.getUser(auth.slice(7));
  if (error || !user) return respond({ error: 'Unauthorized' }, 401);
  try {
    const body = await req.json();
    if (!Array.isArray(body.mediaItems) || body.mediaItems.length > 100 || body.mediaItems.some((i: CleanupItem) => !i || (i.media_type !== 'image' && i.media_type !== 'video') || typeof i.media_url !== 'string' || (i.id != null && typeof i.id !== 'string') || (i.stream_id != null && (typeof i.stream_id !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(i.stream_id))))) return respond({ error: 'Invalid mediaItems' }, 400);
    const account = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
    const connection = Deno.env.get('CLOUDFLARE_API_KEY'); const gatewayKey = Deno.env.get('LOVABLE_API_KEY');
    const access = Deno.env.get('R2_ACCESS_KEY_ID'); const secret = Deno.env.get('R2_SECRET_ACCESS_KEY');
    const bucket = Deno.env.get('R2_BUCKET') || 'clbhouz-media';
    if (!account || !connection || !gatewayKey) return respond({ error: 'Cloudflare connection credentials missing' }, 503);
    if (body.mediaItems.some((i: CleanupItem) => i.media_type === 'image') && (!access || !secret)) return respond({ error: 'Photo deletion requires R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY' }, 503);
    const cf = async (id: string, method: string) => {
      const response = await fetch(`https://connector-gateway.lovable.dev/cloudflare/client/v4/accounts/${account}/stream/${encodeURIComponent(id)}`, { method, headers: { Authorization: `Bearer ${gatewayKey}`, 'X-Connection-Api-Key': connection } });
      const text = await response.text();
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`Cloudflare ${response.status}: ${text}`);
      const data = JSON.parse(text);
      if (!data.success) throw new Error(`Cloudflare request failed: ${text}`);
      return data.result;
    };
    const ownedReviewRows = async (field: 'id' | 'stream_id', value: string) => {
      const { data, error: readError } = await client.from('course_review_media').select('id, course_ratings!inner(user_id)').eq(field, value).eq('course_ratings.user_id', user.id).limit(1);
      if (readError) throw readError;
      return (data?.length ?? 0) > 0;
    };
    const results = [];
    for (const item of body.mediaItems as CleanupItem[]) {
      const status = await cleanupOwnedItem(item, user.id, {
        mediaBase: Deno.env.get('R2_PUBLIC_BASE_URL') || 'https://media.clbhouz.co.uk',
        ownsRow: id => /^[0-9a-f-]{36}$/i.test(id) ? ownedReviewRows('id', id) : Promise.resolve(false),
        ownsLegacyVideo: id => ownedReviewRows('stream_id', id),
        videoDetails: id => cf(id, 'GET'),
        deleteVideo: async id => await cf(id, 'DELETE') === null ? 'not_found' : 'deleted',
        deleteRow: async id => {
          // Recheck the owned review immediately before the row deletion.
          if (!await ownedReviewRows('id', id)) return;
          const { error: deleteError } = await client.from('course_review_media').delete().eq('id', id);
          if (deleteError) throw deleteError;
        },
        deletePhoto: async key => {
          if (!access || !secret) throw new Error('Photo deletion credentials missing');
          const aws = new AwsClient({ accessKeyId: access, secretAccessKey: secret, service: 's3', region: 'auto' });
          const target = `https://${account}.r2.cloudflarestorage.com/${encodeURIComponent(bucket)}/${key.split('/').map(encodeURIComponent).join('/')}`;
          // HEAD distinguishes absent objects: S3 DELETE itself returns 204 even if absent.
          const head = await aws.fetch(new Request(target, { method: 'HEAD' })); await head.arrayBuffer();
          if (head.status === 404) return 'not_found';
          if (!head.ok) throw new Error(`R2 HEAD failed: ${head.status}`);
          const deleted = await aws.fetch(new Request(target, { method: 'DELETE' })); const text = await deleted.text();
          if (!deleted.ok) throw new Error(`R2 DELETE failed: ${deleted.status} ${text}`);
          return 'deleted' as CleanupStatus;
        },
      });
      results.push({ id: item.id ?? null, stream_id: item.stream_id, media_url: item.media_url, status });
    }
    return respond({ success: true, version: VERSION, results });
  } catch (e) { return respond({ error: e instanceof Error ? e.message : 'Cleanup failed', version: VERSION }, 500); }
});
