import { serve } from "https://deno.land/std@0.220.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { corsHeaders } from '../_shared/cors.ts';

/**
 * Edge function to import college logos from external sources to R2
 * 
 * Operations:
 * - GET: List colleges with their mapping status
 * - POST { action: 'update-mapping' }: Update source URL for a college
 * - POST { action: 'import-single' }: Import a single college logo
 * - POST { action: 'import-batch' }: Import multiple college logos (rate-limited)
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
async function uploadToR2(imageData: ArrayBuffer, normalizedName: string): Promise<string> {
  const path = `colleges/${normalizedName}.png`;
  const contentHash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', imageData)))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  const { url, headers } = await signR2Request('PUT', path, contentHash, 'image/png');

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

// Helper: Download and convert image to PNG
async function downloadImage(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; ClbhouzBot/1.0)',
      'Accept': 'image/*'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }

  return await response.arrayBuffer();
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

    // GET: List colleges with mapping status
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const status = url.searchParams.get('status');
      const search = url.searchParams.get('search');
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      let query = supabase
        .from('college_logo_sources')
        .select('*, college_media!inner(college_name, short_name, logo_url)', { count: 'exact' })
        .order('normalized_name');

      if (status) {
        query = query.eq('status', status);
      }

      if (search) {
        query = query.or(`normalized_name.ilike.%${search}%,college_media.college_name.ilike.%${search}%`);
      }

      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      // Get stats
      const { data: stats } = await supabase
        .from('college_logo_sources')
        .select('status');

      const statusCounts = {
        pending: 0,
        matched: 0,
        downloaded: 0,
        uploaded: 0,
        failed: 0,
        total: stats?.length || 0
      };

      stats?.forEach(s => {
        statusCounts[s.status as keyof typeof statusCounts]++;
      });

      return new Response(JSON.stringify({
        colleges: data,
        stats: statusCounts,
        total: count,
        limit,
        offset
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST: Handle various actions
    if (req.method === 'POST') {
      const body = await req.json();
      const { action } = body;

      switch (action) {
        case 'update-mapping': {
          const { normalized_name, source_page_url, source } = body;
          
          if (!normalized_name) {
            throw new Error('normalized_name is required');
          }

          const { error } = await supabase
            .from('college_logo_sources')
            .update({
              source_page_url: source_page_url || null,
              source: source || 'manual',
              status: source_page_url ? 'matched' : 'pending',
              updated_at: new Date().toISOString()
            })
            .eq('normalized_name', normalized_name);

          if (error) throw error;

          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        case 'import-single': {
          const { normalized_name, image_url } = body;

          if (!normalized_name || !image_url) {
            throw new Error('normalized_name and image_url are required');
          }

          console.log(`Importing logo for ${normalized_name} from ${image_url}`);

          // Download image
          const imageData = await downloadImage(image_url);
          console.log(`Downloaded ${imageData.byteLength} bytes`);

          // Upload to R2
          const r2Url = await uploadToR2(imageData, normalized_name);
          console.log(`Uploaded to R2: ${r2Url}`);

          // Update college_media
          const { error: mediaError } = await supabase
            .from('college_media')
            .update({ logo_url: r2Url, updated_at: new Date().toISOString() })
            .eq('normalized_name', normalized_name);

          if (mediaError) throw mediaError;

          // Update college_logo_sources
          const { error: sourcesError } = await supabase
            .from('college_logo_sources')
            .update({
              status: 'uploaded',
              last_error: null,
              updated_at: new Date().toISOString()
            })
            .eq('normalized_name', normalized_name);

          if (sourcesError) throw sourcesError;

          return new Response(JSON.stringify({
            success: true,
            normalized_name,
            logo_url: r2Url
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        case 'import-batch': {
          const { items } = body as { items: Array<{ normalized_name: string; image_url: string }> };

          if (!items || !Array.isArray(items)) {
            throw new Error('items array is required');
          }

          const results: Array<{ normalized_name: string; success: boolean; logo_url?: string; error?: string }> = [];

          for (const item of items) {
            try {
              // Rate limiting: wait between requests
              await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));

              const imageData = await downloadImage(item.image_url);
              const r2Url = await uploadToR2(imageData, item.normalized_name);

              await supabase
                .from('college_media')
                .update({ logo_url: r2Url, updated_at: new Date().toISOString() })
                .eq('normalized_name', item.normalized_name);

              await supabase
                .from('college_logo_sources')
                .update({
                  status: 'uploaded',
                  last_error: null,
                  updated_at: new Date().toISOString()
                })
                .eq('normalized_name', item.normalized_name);

              results.push({ normalized_name: item.normalized_name, success: true, logo_url: r2Url });
            } catch (err) {
              const errorMsg = (err as Error).message;
              
              await supabase
                .from('college_logo_sources')
                .update({
                  status: 'failed',
                  last_error: errorMsg,
                  updated_at: new Date().toISOString()
                })
                .eq('normalized_name', item.normalized_name);

              results.push({ normalized_name: item.normalized_name, success: false, error: errorMsg });
            }
          }

          const successCount = results.filter(r => r.success).length;
          const failCount = results.filter(r => !r.success).length;

          return new Response(JSON.stringify({
            success: true,
            imported: successCount,
            failed: failCount,
            results
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        default:
          throw new Error(`Unknown action: ${action}`);
      }
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({
      error: (error as Error).message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
