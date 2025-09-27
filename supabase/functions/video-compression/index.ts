import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { normalizeError } from '../_shared/normalize-error.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CompressionRequest {
  originalPath: string
  postId: string
  mediaId: string
  targetSizeMB?: number
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Authentication failed')
    }

    const body: CompressionRequest = await req.json()
    console.log('Starting video compression for:', body.originalPath)

    // Download the original video from storage
    const { data: originalVideo, error: downloadError } = await supabaseClient.storage
      .from('post-media')
      .download(body.originalPath)

    if (downloadError || !originalVideo) {
      console.error('Failed to download original video:', downloadError)
      throw new Error('Failed to download original video')
    }

    console.log('Original video downloaded, size:', originalVideo.size)

    // Convert to ArrayBuffer for processing
    const videoBuffer = await originalVideo.arrayBuffer()
    
    // Import FFmpeg WASM
    const { FFmpeg } = await import('https://esm.sh/@ffmpeg/ffmpeg@0.12.7')
    const { fetchFile, toBlobURL } = await import('https://esm.sh/@ffmpeg/util@0.12.1')

    const ffmpeg = new FFmpeg()
    
    // Load FFmpeg with WASM
    const baseURL = 'https://unpkg.com/@ffmpeg/core-mt@0.12.4/dist/esm'
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript')
    })

    console.log('FFmpeg loaded successfully')

    // Write input file
    await ffmpeg.writeFile('input.mp4', new Uint8Array(videoBuffer))

    // Compression settings - target ~30MB for 40MB+ videos
    const targetSizeMB = body.targetSizeMB || 30
    const targetBitrate = Math.floor((targetSizeMB * 8 * 1024) / 60) // Estimate for 60-second video

    // Run compression with optimized settings
    await ffmpeg.exec([
      '-i', 'input.mp4',
      '-c:v', 'libx264',           // H.264 codec
      '-b:v', `${targetBitrate}k`, // Target video bitrate
      '-c:a', 'aac',               // AAC audio codec
      '-b:a', '128k',              // Audio bitrate
      '-preset', 'medium',         // Balance between speed and compression
      '-crf', '23',                // Quality setting (18-28 range)
      '-movflags', '+faststart',   // Optimize for web playback
      '-vf', 'scale=1920:1080:force_original_aspect_ratio=decrease', // Max 1080p
      'output.mp4'
    ])

    console.log('Video compression completed')

    // Read the compressed video
    const compressedData = await ffmpeg.readFile('output.mp4')
    const compressedSize = (compressedData as Uint8Array).length
    console.log('Compressed video size:', compressedSize, 'bytes')

    // Generate new filename for compressed video
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const compressedPath = `${user.id}/${timestamp}-compressed-${randomSuffix}.mp4`

    // Upload compressed video to storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('post-media')
      .upload(compressedPath, compressedData as Uint8Array, {
        contentType: 'video/mp4',
        upsert: false
      })

    if (uploadError) {
      console.error('Failed to upload compressed video:', uploadError)
      throw new Error('Failed to upload compressed video')
    }

    // Get public URL for compressed video
    const { data: publicUrlData } = supabaseClient.storage
      .from('post-media')
      .getPublicUrl(uploadData.path)

    console.log('Compressed video uploaded:', uploadData.path)

    // Update post_media record with compressed video
    const { error: updateError } = await supabaseClient
      .from('post_media')
      .update({
        media_url: publicUrlData.publicUrl
      })
      .eq('id', body.mediaId)

    if (updateError) {
      console.error('Failed to update post_media record:', updateError)
      throw new Error('Failed to update post_media record')
    }

    // Delete original large video file
    const { error: deleteError } = await supabaseClient.storage
      .from('post-media')
      .remove([body.originalPath])

    if (deleteError) {
      console.warn('Failed to delete original video (non-critical):', deleteError)
    }

    console.log('Video compression pipeline completed successfully')

    return new Response(
      JSON.stringify({
        success: true,
        originalSize: videoBuffer.byteLength,
        compressedSize: compressedSize,
        compressionRatio: Math.round((1 - compressedSize / videoBuffer.byteLength) * 100),
        compressedUrl: publicUrlData.publicUrl
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    const err = normalizeError(error);
    console.error('Video compression error:', err.message)
    return new Response(
      JSON.stringify({
        error: err.message,
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})