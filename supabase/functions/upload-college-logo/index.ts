import { serve } from "https://deno.land/std@0.220.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { corsHeaders } from '../_shared/cors.ts';

/**
 * Edge function to upload college logos directly to R2
 * Accepts base64-encoded image data and uploads to R2
 */

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// R2 Configuration
const r2AccountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID')!;
const r2AccessKeyId = Deno.env.get('R2_ACCESS_KEY_ID')!;
const r2SecretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY')!;
const r2Bucket = Deno.env.get('R2_BUCKET') || 'clbhouz-media';
const r2PublicBaseUrl = Deno.env.get('R2_PUBLIC_BASE_URL') || 'https://media.clbhouz.co.uk';

// Helper: Generate AWS Signature V4
async function signR2Request(
  method: string,
  path: string,
  contentHash: string,
  contentType: string
): Promise<{ headers: Record<string, string>; url: string }> {
  const encoder = new TextEncoder();
  const amzDateTime = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDateTime.slice(0, 8);
  const region = 'auto';
  const service = 's3';

  const getSignatureKey = async (key: string, dateStamp: string, regionName: string, serviceName: string) => {
    const kDate = await crypto.subtle.importKey('raw', encoder.encode(`AWS4${key}`), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const kDateSig = await crypto.subtle.sign('HMAC', kDate, encoder.encode(dateStamp));
    const kRegion = await crypto.subtle.importKey('raw', kDateSig, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const kRegionSig = await crypto.subtle.sign('HMAC', kRegion, encoder.encode(regionName));
    const kService = await crypto.subtle.importKey('raw', kRegionSig, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const kServiceSig = await crypto.subtle.sign('HMAC', kService, encoder.encode(serviceName));
    const kSigning = await crypto.subtle.importKey('raw', kServiceSig, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    return await crypto.subtle.sign('HMAC', kSigning, encoder.encode('aws4_request'));
  };

  const canonicalUri = `/${r2Bucket}/${path}`;
  const canonicalHeaders = `host:${r2AccountId}.r2.cloudflarestorage.com\nx-amz-content-sha256:${contentHash}\nx-amz-date:${amzDateTime}\n`;
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
  const canonicalRequest = `${method}\n${canonicalUri}\n\n${canonicalHeaders}\n${signedHeaders}\n${contentHash}`;

  const canonicalRequestHash = await crypto.subtle.digest('SHA-256', encoder.encode(canonicalRequest));
  const canonicalRequestHashHex = Array.from(new Uint8Array(canonicalRequestHash)).map(b => b.toString(16).padStart(2, '0')).join('');

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDateTime}\n${credentialScope}\n${canonicalRequestHashHex}`;

  const signingKey = await getSignatureKey(r2SecretAccessKey, dateStamp, region, service);
  const signatureKey = await crypto.subtle.importKey('raw', signingKey, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signatureBuffer = await crypto.subtle.sign('HMAC', signatureKey, encoder.encode(stringToSign));
  const signature = Array.from(new Uint8Array(signatureBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

  return {
    url: `https://${r2AccountId}.r2.cloudflarestorage.com/${r2Bucket}/${path}`,
    headers: {
      'x-amz-content-sha256': contentHash,
      'x-amz-date': amzDateTime,
      'Authorization': `AWS4-HMAC-SHA256 Credential=${r2AccessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
      'Content-Type': contentType,
    }
  };
}

// Helper: Upload image to R2
async function uploadToR2(imageData: Uint8Array, normalizedName: string, contentType: string): Promise<string> {
  // Determine extension from content type
  let extension = 'png';
  if (contentType.includes('webp')) extension = 'webp';
  else if (contentType.includes('svg')) extension = 'svg';
  else if (contentType.includes('jpeg') || contentType.includes('jpg')) extension = 'jpg';

  const path = `colleges/${normalizedName}.${extension}`;
  const contentHash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', imageData)))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  const { url, headers } = await signR2Request('PUT', path, contentHash, contentType);

  const response = await fetch(url, {
    method: 'PUT',
    headers,
    body: imageData
  });

  if (!response.ok) {
    throw new Error(`R2 upload failed: ${response.status} - ${await response.text()}`);
  }

  return `${r2PublicBaseUrl}/${path}`;
}

// Helper: Verify admin auth
async function verifyAdmin(authHeader: string | null): Promise<boolean> {
  if (!authHeader) return false;
  
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) return false;

  // Check admin membership
  const { data: membership } = await supabase
    .from('admin_memberships')
    .select('role')
    .eq('user_id', user.id)
    .single();

  return !!membership;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin
    const isAdmin = await verifyAdmin(req.headers.get('Authorization'));
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Unauthorized - Admin access required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { normalized_name, file_data, content_type } = await req.json();

    if (!normalized_name || !file_data) {
      return new Response(JSON.stringify({ error: 'normalized_name and file_data are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Uploading logo for ${normalized_name}`);

    // Decode base64 to binary
    const binaryString = atob(file_data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Upload to R2
    const logoUrl = await uploadToR2(bytes, normalized_name, content_type || 'image/png');

    console.log(`Uploaded to R2: ${logoUrl}`);

    // Update college_media with the new logo URL
    const { error: updateError } = await supabase
      .from('college_media')
      .update({
        logo_url: logoUrl,
        updated_at: new Date().toISOString()
      })
      .eq('normalized_name', normalized_name);

    if (updateError) {
      console.error('Failed to update college_media:', updateError);
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    return new Response(JSON.stringify({
      success: true,
      normalized_name,
      logo_url: logoUrl
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: (error as Error).message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
