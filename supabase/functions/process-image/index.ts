import { serve } from "https://deno.land/std@0.220.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Filter configurations - maps filter IDs to Cloudflare Transform parameters
// Since we're using Cloudflare Image Resizing, we'll apply filters via CSS-like transforms
// For actual filter baking, we use canvas-based processing
const FILTER_CONFIGS: Record<string, FilterParams> = {
  normal: {},
  vivid: { saturate: 1.2, contrast: 1.1 },
  cool: { hueRotate: -10, saturate: 0.95, brightness: 1.02 },
  warm: { sepia: 0.15, saturate: 1.1, brightness: 1.05 },
  pop: { contrast: 1.15, saturate: 1.15 },
  matte: { contrast: 0.92, saturate: 0.9, brightness: 1.04 },
  fade: { contrast: 0.9, brightness: 1.08, saturate: 0.9 },
  vintage: { sepia: 0.25, contrast: 0.95, saturate: 0.85 },
  dramatic: { contrast: 1.25, saturate: 1.05, brightness: 0.95 },
  bw: { grayscale: 1, contrast: 1.05 },
};

interface FilterParams {
  saturate?: number;
  contrast?: number;
  brightness?: number;
  hueRotate?: number;
  sepia?: number;
  grayscale?: number;
}

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  scale: number;
  rotation?: number;
  style: string;
  color?: string;
}

interface StudioEdits {
  filter?: string;
  crop?: { ratio: string };
  rotate?: number;
  textOverlays?: TextOverlay[];
}

interface ProcessImageRequest {
  mediaId: string;
  originalUrl: string;
  studioEdits: StudioEdits;
  filterId?: string;
  width?: number;
  height?: number;
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  console.log('🖼️ process-image function called');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const body: ProcessImageRequest = await req.json();
    const { mediaId, originalUrl, studioEdits, filterId, width = 1080, height = 1080 } = body;

    console.log('📋 Processing request:', { mediaId, filterId, hasOverlays: !!studioEdits?.textOverlays?.length });

    // Check if image needs processing
    const filter = filterId || studioEdits?.filter;
    const hasTextOverlays = studioEdits?.textOverlays && studioEdits.textOverlays.length > 0;
    const hasRotation = studioEdits?.rotate && studioEdits.rotate !== 0;
    
    if (!filter || filter === 'normal') {
      if (!hasTextOverlays && !hasRotation) {
        console.log('⏭️ No processing needed, skipping');
        
        // Update status to skipped
        await supabase
          .from('post_media')
          .update({
            processing_status: 'skipped',
            processed_at: new Date().toISOString(),
          })
          .eq('id', mediaId);

        return new Response(JSON.stringify({ 
          success: true, 
          skipped: true,
          reason: 'No edits to apply'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Mark as processing
    await supabase
      .from('post_media')
      .update({
        processing_status: 'processing',
        original_media_url: originalUrl,
      })
      .eq('id', mediaId);

    console.log('🎨 Starting image processing...');

    // Fetch the original image
    const imageResponse = await fetch(originalUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch original image: ${imageResponse.status}`);
    }

    const imageBlob = await imageResponse.blob();
    const imageBuffer = await imageBlob.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
    const mimeType = imageBlob.type || 'image/jpeg';

    console.log('📦 Image fetched, size:', imageBuffer.byteLength);

    // Process using Canvas API (Deno has limited support, so we'll use a simplified approach)
    // For production, consider using Cloudflare Workers with wasm-based image processing
    
    // Create processed image by generating an SVG with the filter and overlays
    // This approach works in Deno and produces consistent results
    const processedSvg = generateProcessedSvg({
      base64Image,
      mimeType,
      width,
      height,
      filter: filter as string,
      textOverlays: studioEdits?.textOverlays || [],
      rotation: studioEdits?.rotate || 0,
    });

    // Convert SVG to PNG using resvg (or fall back to returning the filtered original)
    // For now, we'll use a workaround: apply filter via CSS and return enhanced metadata
    
    // Upload processed image to R2
    const r2AccountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
    const r2AccessKeyId = Deno.env.get('R2_ACCESS_KEY_ID');
    const r2SecretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY');
    const r2Bucket = Deno.env.get('R2_BUCKET') || 'clbhouz-media';
    const r2PublicBaseUrl = Deno.env.get('R2_PUBLIC_BASE_URL') || 'https://media.clbhouz.co.uk';

    if (!r2AccountId || !r2AccessKeyId || !r2SecretAccessKey) {
      throw new Error('R2 credentials not configured');
    }

    // Generate unique path for processed image
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 10);
    const processedPath = `processed/${timestamp}-${randomId}.svg`;

    console.log('🚀 Uploading processed image to R2...');

    // Upload SVG to R2
    const svgContent = new TextEncoder().encode(processedSvg);
    const uploadUrl = `https://${r2AccountId}.r2.cloudflarestorage.com/${r2Bucket}/${processedPath}`;
    
    // Generate AWS Signature Version 4
    const amzDateTime = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDateTime.slice(0, 8);
    const region = 'auto';
    const service = 's3';

    const encoder = new TextEncoder();
    const getSignatureKey = async (key: string, dateStamp: string, regionName: string, serviceName: string) => {
      const kDate = await crypto.subtle.importKey(
        'raw',
        encoder.encode(`AWS4${key}`),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const kDateSig = await crypto.subtle.sign('HMAC', kDate, encoder.encode(dateStamp));
      const kRegion = await crypto.subtle.importKey('raw', kDateSig, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      const kRegionSig = await crypto.subtle.sign('HMAC', kRegion, encoder.encode(regionName));
      const kService = await crypto.subtle.importKey('raw', kRegionSig, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      const kServiceSig = await crypto.subtle.sign('HMAC', kService, encoder.encode(serviceName));
      const kSigning = await crypto.subtle.importKey('raw', kServiceSig, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      return await crypto.subtle.sign('HMAC', kSigning, encoder.encode('aws4_request'));
    };

    const contentHash = await crypto.subtle.digest('SHA-256', svgContent);
    const contentHashHex = Array.from(new Uint8Array(contentHash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const canonicalUri = `/${r2Bucket}/${processedPath}`;
    const canonicalQueryString = '';
    const canonicalHeaders = `host:${r2AccountId}.r2.cloudflarestorage.com\nx-amz-content-sha256:${contentHashHex}\nx-amz-date:${amzDateTime}\n`;
    const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
    const canonicalRequest = `PUT\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${contentHashHex}`;

    const canonicalRequestHash = await crypto.subtle.digest('SHA-256', encoder.encode(canonicalRequest));
    const canonicalRequestHashHex = Array.from(new Uint8Array(canonicalRequestHash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = `AWS4-HMAC-SHA256\n${amzDateTime}\n${credentialScope}\n${canonicalRequestHashHex}`;

    const signingKey = await getSignatureKey(r2SecretAccessKey, dateStamp, region, service);
    const signatureKey = await crypto.subtle.importKey('raw', signingKey, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signatureBuffer = await crypto.subtle.sign('HMAC', signatureKey, encoder.encode(stringToSign));
    const signature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${r2AccessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'x-amz-content-sha256': contentHashHex,
        'x-amz-date': amzDateTime,
        'Authorization': authorizationHeader,
        'Content-Type': 'image/svg+xml',
      },
      body: svgContent,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`R2 upload failed: ${uploadResponse.status} - ${errorText}`);
    }

    const processedUrl = `${r2PublicBaseUrl}/${processedPath}`;
    console.log('✅ Processed image uploaded:', processedUrl);

    // Update database with processed URL
    await supabase
      .from('post_media')
      .update({
        media_url: processedUrl,
        processing_status: 'complete',
        processed_at: new Date().toISOString(),
      })
      .eq('id', mediaId);

    console.log('✅ Database updated with processed URL');

    return new Response(JSON.stringify({
      success: true,
      processedUrl,
      originalUrl,
      mediaId,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Processing error:', error);

    // Try to update the database with error status
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { mediaId } = await req.clone().json();
      if (mediaId) {
        await supabase
          .from('post_media')
          .update({
            processing_status: 'failed',
            processing_error: (error as Error).message,
          })
          .eq('id', mediaId);
      }
    } catch (updateError) {
      console.error('Failed to update error status:', updateError);
    }

    return new Response(JSON.stringify({
      success: false,
      error: (error as Error).message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

/**
 * Generate an SVG that embeds the original image with filters and text overlays
 * This is a reliable approach that works in Deno without external image processing libraries
 */
function generateProcessedSvg(params: {
  base64Image: string;
  mimeType: string;
  width: number;
  height: number;
  filter: string;
  textOverlays: TextOverlay[];
  rotation: number;
}): string {
  const { base64Image, mimeType, width, height, filter, textOverlays, rotation } = params;
  
  // Get filter CSS values
  const filterParams = FILTER_CONFIGS[filter] || {};
  const filterParts: string[] = [];
  
  if (filterParams.saturate) filterParts.push(`saturate(${filterParams.saturate})`);
  if (filterParams.contrast) filterParts.push(`contrast(${filterParams.contrast})`);
  if (filterParams.brightness) filterParts.push(`brightness(${filterParams.brightness})`);
  if (filterParams.hueRotate) filterParts.push(`hue-rotate(${filterParams.hueRotate}deg)`);
  if (filterParams.sepia) filterParts.push(`sepia(${filterParams.sepia})`);
  if (filterParams.grayscale) filterParts.push(`grayscale(${filterParams.grayscale})`);
  
  const filterString = filterParts.length > 0 ? filterParts.join(' ') : 'none';

  // Text style configurations
  const getTextStyles = (style: string, color: string = '#ffffff'): string => {
    const styles: Record<string, string> = {
      modern_bold: `font-family: system-ui, sans-serif; font-weight: 800; letter-spacing: -0.02em;`,
      classic_serif: `font-family: Georgia, serif; font-weight: 500; font-style: italic;`,
      signature: `font-family: cursive; font-weight: 400;`,
      impact: `font-family: Impact, sans-serif; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase;`,
      outline: `font-family: system-ui, sans-serif; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; paint-order: stroke fill; stroke: black; stroke-width: 3px;`,
      neon: `font-family: system-ui, sans-serif; font-weight: 700;`,
      glass: `font-family: system-ui, sans-serif; font-weight: 600;`,
      scoreboard: `font-family: monospace; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase;`,
      modern: `font-family: system-ui, sans-serif; font-weight: 700;`,
      classic: `font-family: Georgia, serif; font-weight: 500; font-style: italic;`,
    };
    return styles[style] || styles.modern_bold;
  };

  // Generate text overlay elements
  const textElements = textOverlays.map(overlay => {
    const x = overlay.x * width;
    const y = overlay.y * height;
    const fontSize = 20 * overlay.scale;
    const textStyle = getTextStyles(overlay.style, overlay.color);
    const transform = overlay.rotation ? `rotate(${overlay.rotation}, ${x}, ${y})` : '';
    const color = overlay.color || '#ffffff';
    
    // Add text shadow for better visibility
    const textShadow = overlay.style === 'neon' 
      ? `filter: drop-shadow(0 0 10px ${color}) drop-shadow(0 0 20px ${color});`
      : `filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.8));`;
    
    return `
      <text 
        x="${x}" 
        y="${y}" 
        fill="${color}" 
        font-size="${fontSize}px"
        text-anchor="middle"
        dominant-baseline="middle"
        style="${textStyle} ${textShadow}"
        ${transform ? `transform="${transform}"` : ''}
      >${escapeXml(overlay.text)}</text>
    `;
  }).join('\n');

  // Apply rotation transform if needed
  const rotationTransform = rotation !== 0 
    ? `transform="rotate(${rotation}, ${width/2}, ${height/2})"`
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${width}" 
     height="${height}" 
     viewBox="0 0 ${width} ${height}">
  <defs>
    <filter id="imageFilter">
      <feColorMatrix type="matrix" values="
        ${getColorMatrix(filterParams)}
      "/>
    </filter>
  </defs>
  
  <!-- Background/filtered image -->
  <image 
    xlink:href="data:${mimeType};base64,${base64Image}"
    width="${width}" 
    height="${height}"
    preserveAspectRatio="xMidYMid slice"
    style="filter: ${filterString};"
    ${rotationTransform}
  />
  
  <!-- Text overlays -->
  ${textElements}
</svg>`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getColorMatrix(params: FilterParams): string {
  // Base identity matrix
  let r = [1, 0, 0, 0, 0];
  let g = [0, 1, 0, 0, 0];
  let b = [0, 0, 1, 0, 0];
  let a = [0, 0, 0, 1, 0];

  // Apply grayscale
  if (params.grayscale) {
    const gray = params.grayscale;
    const r0 = 0.2126 + 0.7874 * (1 - gray);
    const r1 = 0.7152 - 0.7152 * (1 - gray);
    const r2 = 0.0722 - 0.0722 * (1 - gray);
    const g0 = 0.2126 - 0.2126 * (1 - gray);
    const g1 = 0.7152 + 0.2848 * (1 - gray);
    const g2 = 0.0722 - 0.0722 * (1 - gray);
    const b0 = 0.2126 - 0.2126 * (1 - gray);
    const b1 = 0.7152 - 0.7152 * (1 - gray);
    const b2 = 0.0722 + 0.9278 * (1 - gray);
    r = [r0, r1, r2, 0, 0];
    g = [g0, g1, g2, 0, 0];
    b = [b0, b1, b2, 0, 0];
  }

  // Apply sepia
  if (params.sepia) {
    const sepia = params.sepia;
    const sr = [0.393 + 0.607 * (1 - sepia), 0.769 - 0.769 * (1 - sepia), 0.189 - 0.189 * (1 - sepia)];
    const sg = [0.349 - 0.349 * (1 - sepia), 0.686 + 0.314 * (1 - sepia), 0.168 - 0.168 * (1 - sepia)];
    const sb = [0.272 - 0.272 * (1 - sepia), 0.534 - 0.534 * (1 - sepia), 0.131 + 0.869 * (1 - sepia)];
    r = [sr[0], sr[1], sr[2], 0, 0];
    g = [sg[0], sg[1], sg[2], 0, 0];
    b = [sb[0], sb[1], sb[2], 0, 0];
  }

  return `${r.join(' ')}
          ${g.join(' ')}
          ${b.join(' ')}
          ${a.join(' ')}`;
}
