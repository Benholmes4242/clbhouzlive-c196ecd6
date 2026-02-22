import { serve } from "https://deno.land/std@0.220.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Tour folder mapping for the new playerName mode
const TOUR_FOLDERS: Record<string, string> = {
  pga:  'PGA Tour',
  euro: 'DP World Tour',
  lpga: 'LPGA',
  pgad: 'Korn Ferry',
  liv:  'LIV',
};

// R2 public base URL for the player-headshots bucket specifically
const PLAYER_HEADSHOTS_PUBLIC_URL = 'https://pub-f598829c702247c88b3281e7ee9e35ea.r2.dev';
const PLAYER_HEADSHOTS_BUCKET = 'player-headshots';

const encoder = new TextEncoder();

async function getSignatureKey(key: string, dateStamp: string, regionName: string, serviceName: string) {
  const kDate = await crypto.subtle.importKey(
    'raw', encoder.encode(`AWS4${key}`),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const kDateSig = await crypto.subtle.sign('HMAC', kDate, encoder.encode(dateStamp));
  const kRegion = await crypto.subtle.importKey('raw', kDateSig, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const kRegionSig = await crypto.subtle.sign('HMAC', kRegion, encoder.encode(regionName));
  const kService = await crypto.subtle.importKey('raw', kRegionSig, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const kServiceSig = await crypto.subtle.sign('HMAC', kService, encoder.encode(serviceName));
  const kSigning = await crypto.subtle.importKey('raw', kServiceSig, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return await crypto.subtle.sign('HMAC', kSigning, encoder.encode('aws4_request'));
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function signAndFetch(
  r2AccountId: string, r2AccessKeyId: string, r2SecretAccessKey: string,
  bucket: string, objectKey: string, method: string,
  body: ArrayBuffer | null, contentType?: string
): Promise<Response> {
  const host = `${r2AccountId}.r2.cloudflarestorage.com`;
  const url = `https://${host}/${bucket}/${objectKey}`;
  const amzDateTime = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDateTime.slice(0, 8);
  const region = 'auto';
  const service = 's3';

  const contentHash = body
    ? toHex(await crypto.subtle.digest('SHA-256', body))
    : 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'; // empty body hash

  const canonicalUri = `/${bucket}/${objectKey}`;
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${contentHash}\nx-amz-date:${amzDateTime}\n`;
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
  const canonicalRequest = `${method}\n${canonicalUri}\n\n${canonicalHeaders}\n${signedHeaders}\n${contentHash}`;

  const canonicalRequestHashHex = toHex(await crypto.subtle.digest('SHA-256', encoder.encode(canonicalRequest)));
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDateTime}\n${credentialScope}\n${canonicalRequestHashHex}`;

  const signingKey = await getSignatureKey(r2SecretAccessKey, dateStamp, region, service);
  const signatureKey = await crypto.subtle.importKey('raw', signingKey, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = toHex(await crypto.subtle.sign('HMAC', signatureKey, encoder.encode(stringToSign)));

  const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${r2AccessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const headers: Record<string, string> = {
    'x-amz-content-sha256': contentHash,
    'x-amz-date': amzDateTime,
    'Authorization': authorizationHeader,
  };
  if (contentType) headers['Content-Type'] = contentType;

  return fetch(url, { method, headers, body });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const r2AccountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
    const r2AccessKeyId = Deno.env.get('R2_ACCESS_KEY_ID');
    const r2SecretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY');
    const r2Bucket = Deno.env.get('R2_BUCKET') || 'clbhouz-media';
    const r2PublicBaseUrl = Deno.env.get('R2_PUBLIC_BASE_URL') || 'https://media.clbhouz.co.uk';

    if (!r2AccountId || !r2AccessKeyId || !r2SecretAccessKey) {
      return new Response(JSON.stringify({ success: false, error: 'R2 credentials not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error('Authentication failed');

    const { data: adminMembership } = await supabase
      .from('admin_memberships').select('role').eq('user_id', user.id).single();
    if (!adminMembership) throw new Error('Admin access required');

    const formData = await req.formData();
    const playerId = formData.get('playerId') as string | null;
    const playerName = formData.get('playerName') as string | null;
    const tourCode = formData.get('tourCode') as string | null;
    const action = (formData.get('action') as string) || 'upload';

    // ========== NEW MODE: playerName + tourCode ==========
    if (playerName && tourCode) {
      const folder = TOUR_FOLDERS[tourCode.toLowerCase()];
      if (!folder) throw new Error(`Unknown tour code: ${tourCode}`);

      const r2Key = `${folder}/${playerName}.webp`;

      if (action === 'delete') {
        console.log('🗑️ Deleting player headshot:', { playerName, tourCode, r2Key });
        const encodedKey = r2Key.split('/').map(s => encodeURIComponent(s)).join('/');
        const deleteResponse = await signAndFetch(
          r2AccountId, r2AccessKeyId, r2SecretAccessKey,
          PLAYER_HEADSHOTS_BUCKET, encodedKey, 'DELETE', null
        );

        if (!deleteResponse.ok && deleteResponse.status !== 404) {
          const errorText = await deleteResponse.text();
          throw new Error(`R2 delete failed: ${deleteResponse.status} - ${errorText}`);
        }

        console.log('✅ Player headshot deleted');
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Upload action
      const file = formData.get('file') as File;
      if (!file) throw new Error('Missing file for upload');

      console.log('📁 Uploading player headshot (name mode):', { playerName, tourCode, r2Key, fileSize: file.size });
      const fileContent = await file.arrayBuffer();
      const encodedKey = r2Key.split('/').map(s => encodeURIComponent(s)).join('/');

      const uploadResponse = await signAndFetch(
        r2AccountId, r2AccessKeyId, r2SecretAccessKey,
        PLAYER_HEADSHOTS_BUCKET, encodedKey, 'PUT',
        fileContent, 'image/webp'
      );

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`R2 upload failed: ${uploadResponse.status} - ${errorText}`);
      }

      const publicUrl = `${PLAYER_HEADSHOTS_PUBLIC_URL}/${encodeURIComponent(folder)}/${encodeURIComponent(playerName)}.webp`;
      console.log('✅ Player headshot uploaded (name mode):', { publicUrl });

      return new Response(JSON.stringify({ success: true, url: publicUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ========== EXISTING MODE: playerId (unchanged) ==========
    const file = formData.get('file') as File;
    if (!file || !playerId) throw new Error('Missing required parameters: file or playerId');

    const fileExtension = file.name.split('.').pop() || 'webp';
    const fullPath = `player-headshots/${playerId}.${fileExtension}`;

    console.log('📁 Uploading player headshot:', { playerId, fullPath, fileSize: file.size });
    const fileContent = await file.arrayBuffer();

    // Upload to R2 using the main bucket (existing behavior)
    const uploadUrl = `https://${r2AccountId}.r2.cloudflarestorage.com/${r2Bucket}/${fullPath}`;
    const amzDateTime = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDateTime.slice(0, 8);
    const region = 'auto';
    const service = 's3';

    const contentHash = await crypto.subtle.digest('SHA-256', fileContent);
    const contentHashHex = toHex(contentHash);

    const canonicalUri = `/${r2Bucket}/${fullPath}`;
    const canonicalQueryString = '';
    const canonicalHeaders = `host:${r2AccountId}.r2.cloudflarestorage.com\nx-amz-content-sha256:${contentHashHex}\nx-amz-date:${amzDateTime}\n`;
    const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
    const canonicalRequest = `PUT\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${contentHashHex}`;

    const canonicalRequestHash = await crypto.subtle.digest('SHA-256', encoder.encode(canonicalRequest));
    const canonicalRequestHashHex = toHex(canonicalRequestHash);

    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = `AWS4-HMAC-SHA256\n${amzDateTime}\n${credentialScope}\n${canonicalRequestHashHex}`;

    const signingKey = await getSignatureKey(r2SecretAccessKey, dateStamp, region, service);
    const signatureKey = await crypto.subtle.importKey('raw', signingKey, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signatureBuffer = await crypto.subtle.sign('HMAC', signatureKey, encoder.encode(stringToSign));
    const signature = toHex(signatureBuffer);

    const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${r2AccessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'x-amz-content-sha256': contentHashHex,
        'x-amz-date': amzDateTime,
        'Authorization': authorizationHeader,
        'Content-Type': file.type || 'image/webp',
      },
      body: fileContent,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('❌ R2 upload failed:', errorText);
      throw new Error(`R2 upload failed: ${uploadResponse.status} - ${errorText}`);
    }

    console.log('✅ R2 upload successful');
    const publicUrl = `${r2PublicBaseUrl}/${fullPath}`;

    const { error: updateError } = await supabase
      .from('sr_players').update({ photo_url: publicUrl }).eq('id', playerId);

    if (updateError) {
      console.error('❌ Failed to update player photo_url:', updateError);
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    console.log('✅ Player photo_url updated:', { playerId, publicUrl });

    return new Response(JSON.stringify({ success: true, publicUrl, playerId, fullPath }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
    return new Response(JSON.stringify({ error: (error as Error).message, success: false }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
