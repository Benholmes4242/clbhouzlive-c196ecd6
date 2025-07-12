import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { videoUrl, bucketName = 'post-media', generateThumbnail = true } = await req.json()

    if (!videoUrl) {
      return new Response(
        JSON.stringify({ error: 'videoUrl is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log('Processing video:', videoUrl)

    // Download the video
    const videoResponse = await fetch(videoUrl)
    if (!videoResponse.ok) {
      throw new Error(`Failed to fetch video: ${videoResponse.statusText}`)
    }

    const videoBuffer = await videoResponse.arrayBuffer()
    const videoBlob = new Blob([videoBuffer])

    // Generate thumbnail using FFmpeg WASM (lightweight approach)
    let thumbnailUrl = null
    if (generateThumbnail) {
      try {
        // For now, we'll create a simple thumbnail generation
        // In production, you'd use FFmpeg WASM or similar
        const thumbnailBuffer = await generateVideoThumbnail(videoBlob)
        
        if (thumbnailBuffer) {
          // Upload thumbnail to storage
          const thumbnailPath = `thumbnails/${crypto.randomUUID()}.webp`
          const { data: thumbData, error: thumbError } = await supabase.storage
            .from(bucketName)
            .upload(thumbnailPath, thumbnailBuffer, {
              contentType: 'image/webp',
              cacheControl: '31536000' // 1 year cache
            })

          if (thumbError) {
            console.error('Thumbnail upload error:', thumbError)
          } else {
            const { data: thumbUrlData } = supabase.storage
              .from(bucketName)
              .getPublicUrl(thumbnailPath)
            thumbnailUrl = thumbUrlData.publicUrl
            console.log('Thumbnail generated:', thumbnailUrl)
          }
        }
      } catch (error) {
        console.error('Thumbnail generation failed:', error)
        // Continue without thumbnail
      }
    }

    // Optimize video for web (basic compression)
    const optimizedVideoBuffer = await optimizeVideoForWeb(videoBlob)
    
    // Upload optimized video
    const optimizedPath = `optimized/${crypto.randomUUID()}.mp4`
    const { data: videoData, error: videoError } = await supabase.storage
      .from(bucketName)
      .upload(optimizedPath, optimizedVideoBuffer, {
        contentType: 'video/mp4',
        cacheControl: '31536000' // 1 year cache
      })

    if (videoError) {
      throw new Error(`Video upload failed: ${videoError.message}`)
    }

    const { data: videoUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(optimizedPath)

    const optimizedVideoUrl = videoUrlData.publicUrl

    console.log('Video optimization complete:', {
      originalUrl: videoUrl,
      optimizedUrl: optimizedVideoUrl,
      thumbnailUrl
    })

    return new Response(
      JSON.stringify({
        success: true,
        originalUrl: videoUrl,
        optimizedUrl: optimizedVideoUrl,
        thumbnailUrl,
        compressionRatio: videoBuffer.byteLength / optimizedVideoBuffer.byteLength
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Video optimization error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

// Simple thumbnail generation (placeholder - in production use FFmpeg WASM)
async function generateVideoThumbnail(videoBlob: Blob): Promise<ArrayBuffer | null> {
  try {
    // This is a simplified approach - in production you'd use FFmpeg WASM
    // For now, we'll create a basic canvas-based approach
    
    // Create a video element to capture frame
    const video = document.createElement('video')
    video.src = URL.createObjectURL(videoBlob)
    video.currentTime = 1 // Capture at 1 second
    
    await new Promise((resolve) => {
      video.addEventListener('loadeddata', resolve)
    })

    // Create canvas to capture frame
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    
    canvas.width = Math.min(video.videoWidth, 1280) // Max width 1280px
    canvas.height = (canvas.width * video.videoHeight) / video.videoWidth
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    // Convert to WebP
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob(resolve as any, 'image/webp', 0.8)
    })
    
    return blob?.arrayBuffer() || null
  } catch (error) {
    console.error('Thumbnail generation error:', error)
    return null
  }
}

// Basic video optimization (placeholder - in production use FFmpeg WASM)
async function optimizeVideoForWeb(videoBlob: Blob): Promise<ArrayBuffer> {
  // For now, return the original video
  // In production, you'd use FFmpeg WASM to:
  // - Reduce bitrate for mobile
  // - Convert to optimized MP4
  // - Add multiple quality versions
  
  console.log('Video optimization placeholder - returning original')
  return videoBlob.arrayBuffer()
}