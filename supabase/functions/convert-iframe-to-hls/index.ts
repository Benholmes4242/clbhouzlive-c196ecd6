import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get Supabase credentials from environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let updatedCount = 0
    let errorCount = 0
    const errors: string[] = []

    // Define tables that contain video URLs
    const tables = [
      { name: 'post_media', column: 'media_url' },
      { name: 'profile_media', column: 'media_url' },
      { name: 'course_review_media', column: 'media_url' }
    ]

    // Process each table
    for (const table of tables) {
      try {
        // Find all iframe URLs in this table
        const { data: records, error: fetchError } = await supabase
          .from(table.name)
          .select('id, ' + table.column)
          .or(`${table.column}.like.*iframe.videodelivery.net*,${table.column}.like.*cloudflarestream.com/embed*`)

        if (fetchError) {
          console.error(`Error fetching from ${table.name}:`, fetchError)
          errors.push(`Error fetching from ${table.name}: ${fetchError.message}`)
          errorCount++
          continue
        }

        if (!records || records.length === 0) {
          console.log(`No iframe URLs found in ${table.name}`)
          continue
        }

        // Convert each iframe URL to HLS manifest URL
        for (const record of records) {
          const oldUrl = (record as any)[table.column] as string
          
          // Extract video ID from iframe URL
          let videoId: string | null = null
          
          // Check for iframe.videodelivery.net format
          const iframeMatch = oldUrl.match(/iframe\.videodelivery\.net\/([a-f0-9]{32})/)
          if (iframeMatch) {
            videoId = iframeMatch[1]
          }
          
          // Check for cloudflarestream.com/embed format  
          const embedMatch = oldUrl.match(/cloudflarestream\.com\/embed\/([a-f0-9]{32})/)
          if (embedMatch) {
            videoId = embedMatch[1]
          }
          
          if (!videoId) {
            console.warn(`Could not extract video ID from URL: ${oldUrl}`)
            errors.push(`Could not extract video ID from URL: ${oldUrl}`)
            errorCount++
            continue
          }
          
          // Generate HLS manifest URL
          const newHlsUrl = `https://videodelivery.net/${videoId}/manifest/video.m3u8`
          
          // Update the database record
          const { error: updateError } = await supabase
            .from(table.name)
            .update({ [table.column]: newHlsUrl })
            .eq('id', record.id)

          if (updateError) {
            console.error(`Error updating ${table.name} record ${record.id}:`, updateError)
            errors.push(`Error updating ${table.name} record ${record.id}: ${updateError.message}`)
            errorCount++
          } else {
            console.log(`✅ Converted ${table.name}: ${oldUrl} → ${newHlsUrl}`)
            updatedCount++
          }
        }
      } catch (error) {
        console.error(`Error processing table ${table.name}:`, error)
        errors.push(`Error processing table ${table.name}: ${error.message}`)
        errorCount++
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Conversion complete: ${updatedCount} URLs converted to HLS, ${errorCount} errors`,
        updated_count: updatedCount,
        error_count: errorCount,
        errors: errors.slice(0, 10) // Limit error details
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in convert-iframe-to-hls function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})