import { serve } from "https://deno.land/std@0.220.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
};

// Tour code → R2 folder name mapping (matches playerHeadshot.ts)
const TOUR_FOLDER: Record<string, string> = {
  pga: 'PGA Tour',
  euro: 'DP World Tour',
  lpga: 'LPGA',
  pgad: 'Korn Ferry',
  liv: 'LIV',
  champ: 'Champions Tour',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// AWS Sig V4 helper
async function signRequest(
  method: string,
  url: string,
  body: ArrayBuffer | null,
  accessKeyId: string,
  secretAccessKey: string,
  accountId: string,
  contentType: string,
) {
  const encoder = new TextEncoder();
  const parsedUrl = new URL(url);

  const amzDateTime = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDateTime.slice(0, 8);
  const region = 'auto';
  const service = 's3';

  const contentHash = body
    ? Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', body))).map(b => b.toString(16).padStart(2, '0')).join('')
    : 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'; // empty hash

  const canonicalHeaders = `host:${parsedUrl.host}\nx-amz-content-sha256:${contentHash}\nx-amz-date:${amzDateTime}\n`;
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
  const canonicalRequest = `${method}\n${parsedUrl.pathname}\n\n${canonicalHeaders}\n${signedHeaders}\n${contentHash}`;

  const crHash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(canonicalRequest)))).map(b => b.toString(16).padStart(2, '0')).join('');
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDateTime}\n${credentialScope}\n${crHash}`;

  // Derive signing key
  const getSignatureKey = async (key: string) => {
    let k = await crypto.subtle.importKey('raw', encoder.encode(`AWS4${key}`), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    let sig = await crypto.subtle.sign('HMAC', k, encoder.encode(dateStamp));
    k = await crypto.subtle.importKey('raw', sig, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    sig = await crypto.subtle.sign('HMAC', k, encoder.encode(region));
    k = await crypto.subtle.importKey('raw', sig, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    sig = await crypto.subtle.sign('HMAC', k, encoder.encode(service));
    k = await crypto.subtle.importKey('raw', sig, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    sig = await crypto.subtle.sign('HMAC', k, encoder.encode('aws4_request'));
    return sig;
  };

  const signingKey = await getSignatureKey(secretAccessKey);
  const sk = await crypto.subtle.importKey('raw', signingKey, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = Array.from(new Uint8Array(await crypto.subtle.sign('HMAC', sk, encoder.encode(stringToSign)))).map(b => b.toString(16).padStart(2, '0')).join('');

  const headers: Record<string, string> = {
    'x-amz-content-sha256': contentHash,
    'x-amz-date': amzDateTime,
    'Authorization': `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
  };
  if (contentType) headers['Content-Type'] = contentType;

  return headers;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check — admin only
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Unauthorized');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) throw new Error('Unauthorized');

    // Check admin membership
    const { data: membership } = await supabase
      .from('admin_memberships')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership) throw new Error('Forbidden: admin access required');

    // R2 credentials
    const accountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID')!;
    const accessKeyId = Deno.env.get('R2_ACCESS_KEY_ID')!;
    const secretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY')!;
    const bucket = Deno.env.get('R2_HEADSHOTS_BUCKET')!;
    const publicBaseUrl = Deno.env.get('R2_HEADSHOTS_PUBLIC_BASE_URL')!;

    if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
      throw new Error('Missing R2 headshot credentials');
    }

    const contentType = req.headers.get('content-type') || '';

    // DELETE: remove a headshot
    if (req.method === 'DELETE') {
      const { playerName, tourCode } = await req.json();
      if (!playerName) throw new Error('playerName required');

      const folder = TOUR_FOLDER[tourCode] || 'Misc';
      const objectKey = `${folder}/${playerName}.webp`;
      const deleteUrl = `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${encodeURIComponent(folder)}/${encodeURIComponent(playerName)}.webp`;

      const headers = await signRequest('DELETE', deleteUrl, null, accessKeyId, secretAccessKey, accountId, '');
      const resp = await fetch(deleteUrl, { method: 'DELETE', headers });

      if (!resp.ok && resp.status !== 404) {
        const errText = await resp.text();
        throw new Error(`R2 delete failed: ${resp.status} - ${errText}`);
      }

      return new Response(JSON.stringify({ success: true, deleted: objectKey }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST: upload a new headshot (multipart form)
    if (req.method === 'POST') {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      const playerName = formData.get('playerName') as string;
      const tourCode = formData.get('tourCode') as string;
      const oldTourCode = formData.get('oldTourCode') as string | null;

      if (!file || !playerName) throw new Error('file and playerName required');

      const folder = TOUR_FOLDER[tourCode] || 'Misc';

      // If there was an old photo to remove (could be in a different tour folder)
      const oldFolder = oldTourCode ? (TOUR_FOLDER[oldTourCode] || 'Misc') : folder;
      if (oldFolder) {
        const oldDeleteUrl = `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${encodeURIComponent(oldFolder)}/${encodeURIComponent(playerName)}.webp`;
        const delHeaders = await signRequest('DELETE', oldDeleteUrl, null, accessKeyId, secretAccessKey, accountId, '');
        await fetch(oldDeleteUrl, { method: 'DELETE', headers: delHeaders }).catch(() => {});
      }

      // Convert to webp by just uploading as-is (the file should ideally be webp, but we accept any image)
      const fileContent = await file.arrayBuffer();

      const uploadUrl = `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${encodeURIComponent(folder)}/${encodeURIComponent(playerName)}.webp`;
      const upHeaders = await signRequest('PUT', uploadUrl, fileContent, accessKeyId, secretAccessKey, accountId, 'image/webp');
      const upResp = await fetch(uploadUrl, { method: 'PUT', headers: upHeaders, body: fileContent });

      if (!upResp.ok) {
        const errText = await upResp.text();
        throw new Error(`R2 upload failed: ${upResp.status} - ${errText}`);
      }

      const publicUrl = `${publicBaseUrl}/${encodeURIComponent(folder)}/${encodeURIComponent(playerName)}.webp`;

      return new Response(JSON.stringify({ success: true, publicUrl, folder, playerName }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('manage-player-headshot error:', (error as Error).message);
    const status = (error as Error).message.includes('Unauthorized') ? 401
      : (error as Error).message.includes('Forbidden') ? 403
      : 500;
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
