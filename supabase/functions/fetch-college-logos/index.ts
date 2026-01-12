import { serve } from "https://deno.land/std@0.220.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { corsHeaders } from '../_shared/cors.ts';

/**
 * Edge function to fetch college logos from Wikipedia and upload to R2
 * 
 * Features:
 * - Fetches college athletics page from Wikipedia
 * - Extracts logo from infobox
 * - Uploads to R2 CDN
 * - Updates college_media table
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

// Wikipedia search patterns for college athletics pages
const WIKIPEDIA_SEARCH_PATTERNS = [
  "{name} Bulldogs", // Georgia, Fresno State, etc.
  "{name} Longhorns", // Texas
  "{name} Crimson Tide", // Alabama
  "{name} Tigers", // LSU, Clemson, Auburn
  "{name} Gators", // Florida
  "{name} Seminoles", // Florida State
  "{name} Volunteers", // Tennessee
  "{name} Tar Heels", // North Carolina
  "{name} Cavaliers", // Virginia
  "{name} Blue Devils", // Duke
  "{name} Cardinal", // Stanford
  "{name} Bruins", // UCLA
  "{name} Trojans", // USC
  "{name} Golden Bears", // California
  "{name} Yellow Jackets", // Georgia Tech
  "{name} Cowboys", // Oklahoma State
  "{name} Demon Deacons", // Wake Forest
  "{name} Red Raiders", // Texas Tech
  "{name} Aztecs", // San Diego State
  "{name} Sooners", // Oklahoma
  "{name} athletics", // Generic fallback
  "{name} NCAA", // Another fallback
];

// Helper: Generate AWS Signature V4 for R2
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

// Upload image to R2
async function uploadToR2(imageData: Uint8Array, normalizedName: string): Promise<string> {
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

// Search Wikipedia for a college and get the page title
async function searchWikipedia(collegeName: string): Promise<string | null> {
  for (const pattern of WIKIPEDIA_SEARCH_PATTERNS) {
    const searchTerm = pattern.replace('{name}', collegeName);
    
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchTerm)}&format=json&srlimit=3`;
    
    try {
      const response = await fetch(searchUrl, {
        headers: { 'User-Agent': 'ClubHouz/1.0 (https://clbhouz.app; contact@clbhouz.app)' }
      });
      
      if (!response.ok) continue;
      
      const data = await response.json();
      const results = data?.query?.search || [];
      
      // Look for athletics-related results
      for (const result of results) {
        const title = result.title?.toLowerCase() || '';
        if (title.includes('athletics') || title.includes(collegeName.toLowerCase())) {
          console.log(`Found Wikipedia page: ${result.title} for ${collegeName}`);
          return result.title;
        }
      }
    } catch (e) {
      console.error(`Search failed for pattern "${pattern}":`, e);
    }
  }
  
  return null;
}

// Extract logo URL from Wikipedia page
async function extractLogoFromWikipedia(pageTitle: string): Promise<string | null> {
  // Get page HTML
  const parseUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&format=json&prop=text`;
  
  try {
    const response = await fetch(parseUrl, {
      headers: { 'User-Agent': 'ClubHouz/1.0 (https://clbhouz.app; contact@clbhouz.app)' }
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const html = data?.parse?.text?.['*'] || '';
    
    // Look for logo in infobox - common patterns
    const logoPatterns = [
      /infobox-image.*?src="(\/\/upload\.wikimedia\.org\/[^"]+logo[^"]*\.(png|svg|jpg)[^"]*)"/i,
      /infobox.*?src="(\/\/upload\.wikimedia\.org\/[^"]+\.(png|svg|jpg)[^"]*)"/i,
      /logo.*?src="(\/\/upload\.wikimedia\.org\/[^"]+\.(png|svg|jpg)[^"]*)"/i,
    ];
    
    for (const pattern of logoPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        let imageUrl = match[1];
        if (imageUrl.startsWith('//')) {
          imageUrl = 'https:' + imageUrl;
        }
        // Get higher resolution version
        imageUrl = imageUrl.replace(/\/\d+px-/, '/400px-');
        console.log(`Found logo URL: ${imageUrl}`);
        return imageUrl;
      }
    }
    
    // Try to get first image from infobox via API
    const imagesUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=images&format=json`;
    const imagesResponse = await fetch(imagesUrl, {
      headers: { 'User-Agent': 'ClubHouz/1.0 (https://clbhouz.app; contact@clbhouz.app)' }
    });
    
    if (imagesResponse.ok) {
      const imagesData = await imagesResponse.json();
      const pages = imagesData?.query?.pages || {};
      const pageData = Object.values(pages)[0] as { images?: Array<{ title: string }> };
      const images = pageData?.images || [];
      
      // Look for logo images
      for (const img of images) {
        const title = img.title?.toLowerCase() || '';
        if (title.includes('logo') && (title.endsWith('.png') || title.endsWith('.svg'))) {
          // Get image info
          const imageInfoUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(img.title)}&prop=imageinfo&iiprop=url&iiurlwidth=400&format=json`;
          const infoResponse = await fetch(imageInfoUrl, {
            headers: { 'User-Agent': 'ClubHouz/1.0 (https://clbhouz.app; contact@clbhouz.app)' }
          });
          
          if (infoResponse.ok) {
            const infoData = await infoResponse.json();
            const infoPages = infoData?.query?.pages || {};
            const infoPage = Object.values(infoPages)[0] as { imageinfo?: Array<{ thumburl?: string; url?: string }> };
            const imageInfo = infoPage?.imageinfo?.[0];
            
            if (imageInfo?.thumburl || imageInfo?.url) {
              return imageInfo.thumburl || imageInfo.url!;
            }
          }
        }
      }
    }
    
    return null;
  } catch (e) {
    console.error(`Failed to extract logo from ${pageTitle}:`, e);
    return null;
  }
}

// Download image and convert to PNG
async function downloadImage(url: string): Promise<Uint8Array | null> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'ClubHouz/1.0 (https://clbhouz.app; contact@clbhouz.app)' }
    });
    
    if (!response.ok) return null;
    
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  } catch (e) {
    console.error(`Failed to download image from ${url}:`, e);
    return null;
  }
}

// Process a single college
async function processCollege(college: { normalized_name: string; college_name: string }): Promise<{
  normalized_name: string;
  success: boolean;
  logo_url?: string;
  error?: string;
}> {
  console.log(`Processing: ${college.college_name} (${college.normalized_name})`);
  
  try {
    // Search Wikipedia for the college
    const pageTitle = await searchWikipedia(college.college_name);
    
    if (!pageTitle) {
      return { normalized_name: college.normalized_name, success: false, error: 'No Wikipedia page found' };
    }
    
    // Extract logo URL
    const logoUrl = await extractLogoFromWikipedia(pageTitle);
    
    if (!logoUrl) {
      return { normalized_name: college.normalized_name, success: false, error: 'No logo found on Wikipedia page' };
    }
    
    // Download the image
    const imageData = await downloadImage(logoUrl);
    
    if (!imageData) {
      return { normalized_name: college.normalized_name, success: false, error: 'Failed to download logo' };
    }
    
    // Upload to R2
    const r2Url = await uploadToR2(imageData, college.normalized_name);
    
    // Update database
    const { error: updateError } = await supabase
      .from('college_media')
      .update({
        logo_url: r2Url,
        source: 'wikipedia',
        updated_at: new Date().toISOString()
      })
      .eq('normalized_name', college.normalized_name);
    
    if (updateError) {
      throw new Error(`Database update failed: ${updateError.message}`);
    }
    
    console.log(`✅ Success: ${college.college_name} -> ${r2Url}`);
    return { normalized_name: college.normalized_name, success: true, logo_url: r2Url };
    
  } catch (error) {
    console.error(`❌ Failed: ${college.college_name}:`, error);
    return { 
      normalized_name: college.normalized_name, 
      success: false, 
      error: (error as Error).message 
    };
  }
}

// Verify admin auth
async function verifyAdmin(authHeader: string | null): Promise<boolean> {
  if (!authHeader) return false;
  
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) return false;

  const { data: membership } = await supabase
    .from('admin_memberships')
    .select('role')
    .eq('user_id', user.id)
    .single();

  return !!membership;
}

serve(async (req) => {
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

    const { limit = 5, normalized_names } = await req.json();

    // Get colleges that need logos
    let query = supabase
      .from('college_media')
      .select('normalized_name, college_name')
      .is('logo_url', null);

    if (normalized_names && normalized_names.length > 0) {
      query = query.in('normalized_name', normalized_names);
    } else {
      query = query.limit(limit);
    }

    const { data: colleges, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch colleges: ${fetchError.message}`);
    }

    if (!colleges || colleges.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No colleges without logos found',
        processed: 0,
        results: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Processing ${colleges.length} colleges...`);

    // Process colleges sequentially to avoid rate limiting
    const results = [];
    for (const college of colleges) {
      const result = await processCollege(college);
      results.push(result);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return new Response(JSON.stringify({
      success: true,
      message: `Processed ${colleges.length} colleges: ${successful} successful, ${failed} failed`,
      processed: colleges.length,
      successful,
      failed,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Fetch logos error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: (error as Error).message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
