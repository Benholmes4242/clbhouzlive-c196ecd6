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
 * - POST { action: 'auto-match-single' }: Use Perplexity to find logo URL for a single college
 * - POST { action: 'auto-match-batch' }: Use Perplexity to find logo URLs for multiple colleges
 * - POST { action: 'import-matched-batch' }: Import logos for colleges with matched URLs
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

// Perplexity Configuration
const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY')!;

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
async function uploadToR2(imageData: ArrayBuffer, normalizedName: string, extension: string = 'png'): Promise<string> {
  const path = `colleges/${normalizedName}.${extension}`;
  const contentHash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', imageData)))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  const contentType = extension === 'svg' ? 'image/svg+xml' : `image/${extension}`;
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

// Helper: Download image
async function downloadImage(url: string): Promise<{ data: ArrayBuffer; extension: string }> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; ClbhouzBot/1.0)',
      'Accept': 'image/*'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || 'image/png';
  let extension = 'png';
  if (contentType.includes('svg')) extension = 'svg';
  else if (contentType.includes('jpeg') || contentType.includes('jpg')) extension = 'jpg';
  else if (contentType.includes('gif')) extension = 'gif';
  else if (contentType.includes('webp')) extension = 'webp';

  // Also check URL extension as fallback
  const urlExt = url.split('.').pop()?.toLowerCase().split('?')[0];
  if (urlExt && ['png', 'jpg', 'jpeg', 'svg', 'gif', 'webp'].includes(urlExt)) {
    extension = urlExt === 'jpeg' ? 'jpg' : urlExt;
  }

  return { data: await response.arrayBuffer(), extension };
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

// Helper: Query Perplexity to find logo URL
async function findLogoWithPerplexity(collegeName: string, shortName: string | null): Promise<{
  found_page_url: string | null;
  found_image_url: string | null;
  confidence: number;
}> {
  const prompt = `You are helping populate a database of US college athletics logos.

Find the official SportsLogos.net page for the college:
"${collegeName}"${shortName ? ` (also known as "${shortName}")` : ''}

Return the result as STRICT JSON in this exact format (no markdown, no extra text):

{
  "sportslogos_page_url": string | null,
  "logo_image_url": string | null,
  "confidence": number
}

Rules:
- Search sportslogos.net for NCAA athletics team logos
- The sportslogos_page_url should be the team's page on sportslogos.net
- The logo_image_url must be a direct image URL (png, svg, jpg, gif) - look for the primary athletics logo
- If you can't find a confident match, return nulls with confidence < 0.5
- Confidence should be between 0 and 1`;

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${perplexityApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar-pro',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  
  // Parse the JSON response
  try {
    // Try to extract JSON from the response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }
    
    const parsed = JSON.parse(jsonStr.trim());
    return {
      found_page_url: parsed.sportslogos_page_url || null,
      found_image_url: parsed.logo_image_url || null,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
    };
  } catch (parseError) {
    console.error('Failed to parse Perplexity response:', content);
    return {
      found_page_url: null,
      found_image_url: null,
      confidence: 0,
    };
  }
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

        case 'auto-match-single': {
          const { normalized_name } = body;

          if (!normalized_name) {
            throw new Error('normalized_name is required');
          }

          console.log(`Auto-matching logo for ${normalized_name} using Perplexity`);

          // Get college info
          const { data: collegeData, error: collegeError } = await supabase
            .from('college_media')
            .select('college_name, short_name')
            .eq('normalized_name', normalized_name)
            .single();

          if (collegeError || !collegeData) {
            throw new Error(`College not found: ${normalized_name}`);
          }

          // Query Perplexity
          const result = await findLogoWithPerplexity(
            collegeData.college_name,
            collegeData.short_name
          );

          console.log(`Perplexity result for ${normalized_name}:`, result);

          // Update college_logo_sources
          const newStatus = result.found_image_url && result.confidence >= 0.5 ? 'matched' : 'failed';
          const { error: updateError } = await supabase
            .from('college_logo_sources')
            .update({
              found_page_url: result.found_page_url,
              found_image_url: result.found_image_url,
              confidence: result.confidence,
              status: newStatus,
              last_error: newStatus === 'failed' ? 'No confident match found' : null,
              source: 'perplexity',
              updated_at: new Date().toISOString()
            })
            .eq('normalized_name', normalized_name);

          if (updateError) throw updateError;

          return new Response(JSON.stringify({
            success: true,
            normalized_name,
            ...result,
            status: newStatus
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        case 'auto-match-batch': {
          const { limit: batchLimit = 10 } = body;

          console.log(`Auto-matching batch of ${batchLimit} pending colleges`);

          // Get pending colleges
          const { data: pendingColleges, error: fetchError } = await supabase
            .from('college_logo_sources')
            .select('normalized_name, college_media!inner(college_name, short_name)')
            .eq('status', 'pending')
            .limit(batchLimit);

          if (fetchError) throw fetchError;

          if (!pendingColleges || pendingColleges.length === 0) {
            return new Response(JSON.stringify({
              success: true,
              message: 'No pending colleges to process',
              processed: 0,
              matched: 0,
              failed: 0
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          const results: Array<{
            normalized_name: string;
            success: boolean;
            found_image_url?: string | null;
            confidence?: number;
            error?: string;
          }> = [];

          // Process sequentially to avoid rate limits
          for (const college of pendingColleges) {
            try {
              // Rate limiting: wait between requests
              await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

              const collegeMedia = college.college_media as { college_name: string; short_name: string | null };
              const result = await findLogoWithPerplexity(
                collegeMedia.college_name,
                collegeMedia.short_name
              );

              const newStatus = result.found_image_url && result.confidence >= 0.5 ? 'matched' : 'failed';
              
              await supabase
                .from('college_logo_sources')
                .update({
                  found_page_url: result.found_page_url,
                  found_image_url: result.found_image_url,
                  confidence: result.confidence,
                  status: newStatus,
                  last_error: newStatus === 'failed' ? 'No confident match found' : null,
                  source: 'perplexity',
                  updated_at: new Date().toISOString()
                })
                .eq('normalized_name', college.normalized_name);

              results.push({
                normalized_name: college.normalized_name,
                success: newStatus === 'matched',
                found_image_url: result.found_image_url,
                confidence: result.confidence
              });
            } catch (err) {
              const errorMsg = (err as Error).message;
              
              await supabase
                .from('college_logo_sources')
                .update({
                  status: 'failed',
                  last_error: errorMsg,
                  updated_at: new Date().toISOString()
                })
                .eq('normalized_name', college.normalized_name);

              results.push({
                normalized_name: college.normalized_name,
                success: false,
                error: errorMsg
              });
            }
          }

          const matchedCount = results.filter(r => r.success).length;
          const failedCount = results.filter(r => !r.success).length;

          return new Response(JSON.stringify({
            success: true,
            processed: results.length,
            matched: matchedCount,
            failed: failedCount,
            results
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        case 'import-matched-batch': {
          const { limit: batchLimit = 10 } = body;

          console.log(`Importing batch of ${batchLimit} matched colleges`);

          // Get matched colleges with found_image_url
          const { data: matchedColleges, error: fetchError } = await supabase
            .from('college_logo_sources')
            .select('normalized_name, found_image_url')
            .eq('status', 'matched')
            .not('found_image_url', 'is', null)
            .limit(batchLimit);

          if (fetchError) throw fetchError;

          if (!matchedColleges || matchedColleges.length === 0) {
            return new Response(JSON.stringify({
              success: true,
              message: 'No matched colleges to import',
              imported: 0,
              failed: 0
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          const results: Array<{
            normalized_name: string;
            success: boolean;
            logo_url?: string;
            error?: string;
          }> = [];

          for (const college of matchedColleges) {
            try {
              // Rate limiting
              await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));

              const { data: imageData, extension } = await downloadImage(college.found_image_url!);
              const r2Url = await uploadToR2(imageData, college.normalized_name, extension);

              // Update college_media
              await supabase
                .from('college_media')
                .update({ logo_url: r2Url, updated_at: new Date().toISOString() })
                .eq('normalized_name', college.normalized_name);

              // Update college_logo_sources
              await supabase
                .from('college_logo_sources')
                .update({
                  status: 'uploaded',
                  last_error: null,
                  updated_at: new Date().toISOString()
                })
                .eq('normalized_name', college.normalized_name);

              results.push({ normalized_name: college.normalized_name, success: true, logo_url: r2Url });
            } catch (err) {
              const errorMsg = (err as Error).message;
              
              await supabase
                .from('college_logo_sources')
                .update({
                  status: 'failed',
                  last_error: errorMsg,
                  updated_at: new Date().toISOString()
                })
                .eq('normalized_name', college.normalized_name);

              results.push({ normalized_name: college.normalized_name, success: false, error: errorMsg });
            }
          }

          const importedCount = results.filter(r => r.success).length;
          const failedCount = results.filter(r => !r.success).length;

          return new Response(JSON.stringify({
            success: true,
            imported: importedCount,
            failed: failedCount,
            results
          }), {
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
          const { data: imageData, extension } = await downloadImage(image_url);
          console.log(`Downloaded ${imageData.byteLength} bytes`);

          // Upload to R2
          const r2Url = await uploadToR2(imageData, normalized_name, extension);
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

              const { data: imageData, extension } = await downloadImage(item.image_url);
              const r2Url = await uploadToR2(imageData, item.normalized_name, extension);

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
