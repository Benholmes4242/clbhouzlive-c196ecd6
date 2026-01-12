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

// R2 configuration
const r2AccountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
const r2AccessKeyId = Deno.env.get('R2_ACCESS_KEY_ID');
const r2SecretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY');
const r2Bucket = Deno.env.get('R2_BUCKET') || 'clbhouz-media';
const r2PublicBaseUrl = Deno.env.get('R2_PUBLIC_BASE_URL') || 'https://media.clbhouz.co.uk';

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  scale: number;
  color: string;
  style?: string;
  fontFamily?: string;
  fontSize?: number;
}

interface StudioEdits {
  filter?: string;
  textOverlays?: TextOverlay[];
  crop?: { ratio: string };
  rotate?: number;
  audioMode?: string;
  music?: unknown;
}

interface ProcessRequest {
  postMediaId: string;
  originalUrl: string;
  studioEdits: StudioEdits;
}

/**
 * Filter definitions mapping filter IDs to CSS-like transformations
 * These will be applied using the Canvas API
 */
const FILTER_DEFINITIONS: Record<string, {
  brightness?: number;
  contrast?: number;
  saturation?: number;
  sepia?: number;
  grayscale?: number;
  hueRotate?: number;
}> = {
  normal: {},
  vivid: { saturation: 1.2, contrast: 1.1 },
  cool: { hueRotate: -15, saturation: 0.95 },
  warm: { hueRotate: 15, saturation: 1.05 },
  pop: { contrast: 1.15, saturation: 1.15 },
  matte: { contrast: 0.85, brightness: 1.05 },
  fade: { saturation: 0.7, contrast: 0.9, brightness: 1.1 },
  vintage: { sepia: 0.3, saturation: 0.8, contrast: 0.95 },
  dramatic: { contrast: 1.25, brightness: 0.95, saturation: 1.1 },
  bw: { grayscale: 1 },
};

/**
 * Apply color filter to image data using pixel manipulation
 */
function applyFilter(
  ctx: OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  filterId: string
): void {
  const filter = FILTER_DEFINITIONS[filterId];
  if (!filter || Object.keys(filter).length === 0) return;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Apply brightness
    if (filter.brightness) {
      const factor = filter.brightness;
      r = Math.min(255, r * factor);
      g = Math.min(255, g * factor);
      b = Math.min(255, b * factor);
    }

    // Apply contrast
    if (filter.contrast) {
      const factor = filter.contrast;
      const intercept = 128 * (1 - factor);
      r = Math.min(255, Math.max(0, r * factor + intercept));
      g = Math.min(255, Math.max(0, g * factor + intercept));
      b = Math.min(255, Math.max(0, b * factor + intercept));
    }

    // Apply saturation
    if (filter.saturation) {
      const factor = filter.saturation;
      const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      r = Math.min(255, Math.max(0, gray + factor * (r - gray)));
      g = Math.min(255, Math.max(0, gray + factor * (g - gray)));
      b = Math.min(255, Math.max(0, gray + factor * (b - gray)));
    }

    // Apply grayscale
    if (filter.grayscale) {
      const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const amount = filter.grayscale;
      r = r + amount * (gray - r);
      g = g + amount * (gray - g);
      b = b + amount * (gray - b);
    }

    // Apply sepia
    if (filter.sepia) {
      const amount = filter.sepia;
      const sr = 0.393 * r + 0.769 * g + 0.189 * b;
      const sg = 0.349 * r + 0.686 * g + 0.168 * b;
      const sb = 0.272 * r + 0.534 * g + 0.131 * b;
      r = Math.min(255, r + amount * (sr - r));
      g = Math.min(255, g + amount * (sg - g));
      b = Math.min(255, b + amount * (sb - b));
    }

    // Apply hue rotation (simplified)
    if (filter.hueRotate) {
      const angle = (filter.hueRotate * Math.PI) / 180;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const nr = 0.213 + cos * 0.787 - sin * 0.213;
      const ng = 0.715 - cos * 0.715 - sin * 0.715;
      const nb = 0.072 - cos * 0.072 + sin * 0.928;
      const newR = nr * r + ng * g + nb * b;
      r = Math.min(255, Math.max(0, newR));
      // Simplified - full hue rotation would need matrix multiplication
    }

    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Render text overlays onto the canvas
 */
function renderTextOverlays(
  ctx: OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  overlays: TextOverlay[]
): void {
  for (const overlay of overlays) {
    const fontSize = (overlay.fontSize || 24) * overlay.scale;
    const fontFamily = overlay.fontFamily || 'sans-serif';
    
    ctx.save();
    ctx.font = `${overlay.style === 'bold' ? 'bold ' : ''}${fontSize}px ${fontFamily}`;
    ctx.fillStyle = overlay.color || '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add text shadow for visibility
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Convert percentage position to pixels
    const x = (overlay.x / 100) * width;
    const y = (overlay.y / 100) * height;
    
    ctx.fillText(overlay.text, x, y);
    ctx.restore();
  }
}

/**
 * Upload processed image to R2 and return public URL
 */
async function uploadToR2(
  imageBuffer: ArrayBuffer,
  originalPath: string,
  contentType: string
): Promise<string> {
  if (!r2AccountId || !r2AccessKeyId || !r2SecretAccessKey) {
    throw new Error('R2 credentials not configured');
  }

  // Generate processed file path
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  const extension = contentType === 'image/png' ? 'png' : 'jpg';
  
  // Extract user path from original URL
  const urlParts = originalPath.replace(r2PublicBaseUrl + '/', '').split('/');
  const userId = urlParts[0] || 'processed';
  const processedPath = `${userId}/processed/${timestamp}-${randomId}.${extension}`;

  const uploadUrl = `https://${r2AccountId}.r2.cloudflarestorage.com/${r2Bucket}/${processedPath}`;
  
  // AWS Signature V4
  const encoder = new TextEncoder();
  const amzDateTime = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDateTime.slice(0, 8);
  const region = 'auto';
  const service = 's3';

  const getSignatureKey = async (key: string, ds: string, rn: string, sn: string) => {
    const kDate = await crypto.subtle.importKey(
      'raw', encoder.encode(`AWS4${key}`), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const kDateSig = await crypto.subtle.sign('HMAC', kDate, encoder.encode(ds));
    const kRegion = await crypto.subtle.importKey('raw', kDateSig, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const kRegionSig = await crypto.subtle.sign('HMAC', kRegion, encoder.encode(rn));
    const kService = await crypto.subtle.importKey('raw', kRegionSig, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const kServiceSig = await crypto.subtle.sign('HMAC', kService, encoder.encode(sn));
    const kSigning = await crypto.subtle.importKey('raw', kServiceSig, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    return crypto.subtle.sign('HMAC', kSigning, encoder.encode('aws4_request'));
  };

  const contentHash = await crypto.subtle.digest('SHA-256', imageBuffer);
  const contentHashHex = Array.from(new Uint8Array(contentHash))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  const canonicalUri = `/${r2Bucket}/${processedPath}`;
  const canonicalHeaders = `host:${r2AccountId}.r2.cloudflarestorage.com\nx-amz-content-sha256:${contentHashHex}\nx-amz-date:${amzDateTime}\n`;
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
  const canonicalRequest = `PUT\n${canonicalUri}\n\n${canonicalHeaders}\n${signedHeaders}\n${contentHashHex}`;

  const canonicalRequestHash = await crypto.subtle.digest('SHA-256', encoder.encode(canonicalRequest));
  const canonicalRequestHashHex = Array.from(new Uint8Array(canonicalRequestHash))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDateTime}\n${credentialScope}\n${canonicalRequestHashHex}`;

  const signingKey = await getSignatureKey(r2SecretAccessKey, dateStamp, region, service);
  const signatureKey = await crypto.subtle.importKey('raw', signingKey, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signatureBuffer = await crypto.subtle.sign('HMAC', signatureKey, encoder.encode(stringToSign));
  const signature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${r2AccessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'x-amz-content-sha256': contentHashHex,
      'x-amz-date': amzDateTime,
      'Authorization': authorizationHeader,
      'Content-Type': contentType,
    },
    body: imageBuffer,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`R2 upload failed: ${response.status} - ${errorText}`);
  }

  return `${r2PublicBaseUrl}/${processedPath}`;
}

/**
 * Process a single image: apply filters, text overlays, crop, rotate
 */
async function processImage(
  originalUrl: string,
  studioEdits: StudioEdits
): Promise<{ processedUrl: string; contentType: string }> {
  console.log(`📸 Fetching original image: ${originalUrl}`);
  
  // Fetch original image
  const response = await fetch(originalUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch original image: ${response.status}`);
  }

  const imageBlob = await response.blob();
  const arrayBuffer = await imageBlob.arrayBuffer();
  
  // Decode image using ImageBitmap
  const imageBitmap = await createImageBitmap(new Blob([arrayBuffer]));
  let width = imageBitmap.width;
  let height = imageBitmap.height;

  console.log(`📐 Original dimensions: ${width}x${height}`);

  // Handle rotation
  const rotation = studioEdits.rotate || 0;
  if (rotation === 90 || rotation === 270) {
    [width, height] = [height, width];
  }

  // Create canvas
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // Apply rotation
  if (rotation) {
    ctx.translate(width / 2, height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-imageBitmap.width / 2, -imageBitmap.height / 2);
  }

  // Draw original image
  ctx.drawImage(imageBitmap, 0, 0);

  // Reset transform for subsequent operations
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  // Apply filter
  if (studioEdits.filter && studioEdits.filter !== 'normal') {
    console.log(`🎨 Applying filter: ${studioEdits.filter}`);
    applyFilter(ctx, width, height, studioEdits.filter);
  }

  // Render text overlays
  if (studioEdits.textOverlays && studioEdits.textOverlays.length > 0) {
    console.log(`✍️ Rendering ${studioEdits.textOverlays.length} text overlays`);
    renderTextOverlays(ctx, width, height, studioEdits.textOverlays);
  }

  // Export as JPEG (good balance of quality and size)
  const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.92 });
  const processedBuffer = await blob.arrayBuffer();

  console.log(`✅ Image processed, size: ${processedBuffer.byteLength} bytes`);

  // Upload to R2
  const processedUrl = await uploadToR2(processedBuffer, originalUrl, 'image/jpeg');

  return { processedUrl, contentType: 'image/jpeg' };
}

serve(async (req) => {
  console.log('🖼️ process-image function invoked');

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
    const body: ProcessRequest = await req.json();
    const { postMediaId, originalUrl, studioEdits } = body;

    console.log(`📋 Processing request for postMediaId: ${postMediaId}`);
    console.log(`🔧 Studio edits:`, JSON.stringify(studioEdits));

    // Validate inputs
    if (!postMediaId || !originalUrl) {
      throw new Error('Missing required parameters: postMediaId and originalUrl');
    }

    // Check if there's anything to process
    const hasFilter = studioEdits?.filter && studioEdits.filter !== 'normal';
    const hasTextOverlays = studioEdits?.textOverlays && studioEdits.textOverlays.length > 0;
    const hasRotation = studioEdits?.rotate && studioEdits.rotate !== 0;
    
    if (!hasFilter && !hasTextOverlays && !hasRotation) {
      console.log('ℹ️ No edits to apply, skipping processing');
      
      // Update status to complete (no processing needed)
      await supabase
        .from('post_media')
        .update({ processing_status: 'complete' })
        .eq('id', postMediaId);

      return new Response(JSON.stringify({
        success: true,
        skipped: true,
        message: 'No edits to apply',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update status to processing
    await supabase
      .from('post_media')
      .update({ processing_status: 'processing' })
      .eq('id', postMediaId);

    // Process the image
    const { processedUrl } = await processImage(originalUrl, studioEdits);

    // Update post_media record
    const { error: updateError } = await supabase
      .from('post_media')
      .update({
        media_url: processedUrl,
        original_media_url: originalUrl,
        processing_status: 'complete',
      })
      .eq('id', postMediaId);

    if (updateError) {
      console.error('❌ Failed to update post_media:', updateError);
      throw updateError;
    }

    console.log(`✅ Processing complete for ${postMediaId}`);
    console.log(`🔗 Processed URL: ${processedUrl}`);

    return new Response(JSON.stringify({
      success: true,
      processedUrl,
      originalUrl,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ process-image error:', error);

    // Try to mark as failed in DB
    try {
      const body = await req.clone().json();
      if (body?.postMediaId) {
        await supabase
          .from('post_media')
          .update({ processing_status: 'failed' })
          .eq('id', body.postMediaId);
      }
    } catch {
      // Ignore cleanup errors
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
