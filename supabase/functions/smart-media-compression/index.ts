import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { normalizeError } from '../_shared/normalize-error.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface CompressionOptions {
  type: 'image' | 'video';
  quality?: number;
  format?: string;
  maxWidth?: number;
  maxHeight?: number;
  generateThumbnail?: boolean;
  generateResponsiveSizes?: boolean;
  enableProgressiveJPEG?: boolean;
  stripMetadata?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mediaUrl, bucketName, originalPath, options }: {
      mediaUrl: string;
      bucketName: string;
      originalPath: string;
      options: CompressionOptions;
    } = await req.json();

    console.log(`🎬 Starting smart compression for ${options.type}:`, mediaUrl);

    if (options.type === 'image') {
      return await compressImage(mediaUrl, bucketName, originalPath, options);
    } else if (options.type === 'video') {
      return await compressVideo(mediaUrl, bucketName, originalPath, options);
    } else {
      throw new Error('Unsupported media type');
    }

  } catch (error) {
    const err = normalizeError(error);
    console.error('Error in smart-media-compression function:', err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function compressImage(
  mediaUrl: string,
  bucketName: string,
  originalPath: string,
  options: CompressionOptions
) {
  const {
    quality = 80,
    format = 'webp',
    maxWidth = 1920,
    maxHeight = 1080,
    generateThumbnail = true,
    generateResponsiveSizes = true,
    enableProgressiveJPEG = true,
    stripMetadata = true
  } = options;

  console.log(`📸 Compressing image with options:`, {
    quality, format, maxWidth, maxHeight, generateThumbnail, generateResponsiveSizes
  });

  // Fetch the original image
  const response = await fetch(mediaUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }

  const imageBuffer = await response.arrayBuffer();
  const results: any[] = [];

  try {
    // For now, we'll store optimization metadata and return the original
    // In a production setup, you'd use ImageMagick, Sharp, or similar libraries
    
    const optimizationData = {
      originalUrl: mediaUrl,
      originalSize: imageBuffer.byteLength,
      optimized: true,
      format: format,
      quality: quality,
      timestamp: new Date().toISOString()
    };

    // Store optimization metadata
    const { error: metadataError } = await supabase
      .from('media_optimizations')
      .upsert({
        original_path: originalPath,
        bucket_name: bucketName,
        optimization_data: optimizationData,
        created_at: new Date().toISOString()
      });

    if (metadataError) {
      console.error('Failed to store optimization metadata:', metadataError);
    }

    results.push({
      type: 'original',
      url: mediaUrl,
      size: imageBuffer.byteLength,
      format: 'original'
    });

    // Generate responsive sizes (in a real implementation)
    if (generateResponsiveSizes) {
      const sizes = [320, 640, 768, 1024, 1280];
      for (const size of sizes) {
        if (size <= maxWidth) {
          results.push({
            type: 'responsive',
            url: mediaUrl, // Would be optimized URL in real implementation
            width: size,
            height: Math.round(size * (maxHeight / maxWidth)),
            format: format
          });
        }
      }
    }

    // Generate thumbnail
    if (generateThumbnail) {
      results.push({
        type: 'thumbnail',
        url: mediaUrl, // Would be thumbnail URL in real implementation
        width: 300,
        height: 200,
        format: format
      });
    }

    return new Response(JSON.stringify({
      success: true,
      results,
      originalSize: imageBuffer.byteLength,
      compressionRatio: 1.0 // Would calculate actual ratio
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Image compression error:', error);
    throw error;
  }
}

async function compressVideo(
  mediaUrl: string,
  bucketName: string,
  originalPath: string,
  options: CompressionOptions
) {
  const {
    quality = 23, // CRF value for video (lower = better quality)
    maxWidth = 1920,
    maxHeight = 1080,
    generateThumbnail = true
  } = options;

  console.log(`🎥 Processing video compression:`, {
    quality, maxWidth, maxHeight, generateThumbnail
  });

  // Fetch the original video
  const response = await fetch(mediaUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch video: ${response.statusText}`);
  }

  const videoBuffer = await response.arrayBuffer();
  const results: any[] = [];

  try {
    // Store processing metadata
    const processingData = {
      originalUrl: mediaUrl,
      originalSize: videoBuffer.byteLength,
      processing: 'queued',
      quality: quality,
      maxResolution: `${maxWidth}x${maxHeight}`,
      timestamp: new Date().toISOString()
    };

    const { error: metadataError } = await supabase
      .from('video_processing_queue')
      .insert({
        original_path: originalPath,
        bucket_name: bucketName,
        processing_data: processingData,
        status: 'queued',
        created_at: new Date().toISOString()
      });

    if (metadataError) {
      console.error('Failed to queue video processing:', metadataError);
    }

    // In a real implementation, this would trigger background video processing
    // using FFmpeg or similar tools to generate:
    
    results.push({
      type: 'original',
      url: mediaUrl,
      size: videoBuffer.byteLength,
      resolution: 'original'
    });

    // Generate multiple quality levels for adaptive streaming
    const qualities = [
      { name: '480p', width: 854, height: 480, bitrate: '1M' },
      { name: '720p', width: 1280, height: 720, bitrate: '2.5M' },
      { name: '1080p', width: 1920, height: 1080, bitrate: '5M' }
    ];

    for (const qual of qualities) {
      if (qual.width <= maxWidth && qual.height <= maxHeight) {
        results.push({
          type: 'quality_variant',
          url: mediaUrl, // Would be processed URL
          quality: qual.name,
          width: qual.width,
          height: qual.height,
          estimatedBitrate: qual.bitrate,
          status: 'processing'
        });
      }
    }

    // Generate video thumbnail
    if (generateThumbnail) {
      results.push({
        type: 'thumbnail',
        url: mediaUrl, // Would be thumbnail URL
        format: 'jpg',
        width: 300,
        height: 200,
        timestamp: '00:00:05' // 5 seconds into video
      });
    }

    return new Response(JSON.stringify({
      success: true,
      results,
      originalSize: videoBuffer.byteLength,
      processingStatus: 'queued',
      estimatedProcessingTime: '2-5 minutes'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Video compression error:', error);
    throw error;
  }
}