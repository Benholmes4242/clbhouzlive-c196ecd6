import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Process Push Notification Queue
 * 
 * This edge function processes the push_notification_queue table and sends
 * notifications via OneSignal. It should be called periodically (e.g., every minute)
 * via a cron job or external scheduler.
 * 
 * Required secrets:
 * - ONESIGNAL_APP_ID
 * - ONESIGNAL_REST_API_KEY
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID')
    const ONESIGNAL_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY')
    
    // Check if OneSignal is configured
    if (!ONESIGNAL_APP_ID || !ONESIGNAL_API_KEY) {
      console.log('OneSignal not configured, skipping push notifications')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'OneSignal not configured, push notifications disabled',
          processed: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get pending push notifications (limit to 100 per run)
    const { data: queue, error: fetchError } = await supabase
      .from('push_notification_queue')
      .select('*')
      .is('sent_at', null)
      .is('error', null) // Don't retry failed ones automatically
      .order('created_at', { ascending: true })
      .limit(100)

    if (fetchError) {
      console.error('Error fetching push queue:', fetchError)
      return new Response(
        JSON.stringify({ success: false, error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!queue || queue.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: 'No pending notifications' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing ${queue.length} push notifications`)

    let successCount = 0
    let errorCount = 0

    for (const item of queue) {
      try {
        // Send via OneSignal
        const response = await fetch('https://onesignal.com/api/v1/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${ONESIGNAL_API_KEY}`
          },
          body: JSON.stringify({
            app_id: ONESIGNAL_APP_ID,
            include_player_ids: [item.device_id],
            headings: { en: item.title },
            contents: { en: item.body || '' },
            data: item.data || {},
            // iOS specific
            ios_badgeType: 'Increase',
            ios_badgeCount: 1,
            // Android specific
            android_channel_id: 'game_notifications',
            priority: 10, // High priority
            // TTL - 24 hours
            ttl: 86400,
          })
        })

        const responseData = await response.json()

        if (response.ok && !responseData.errors?.length) {
          // Mark as sent
          await supabase
            .from('push_notification_queue')
            .update({ sent_at: new Date().toISOString() })
            .eq('id', item.id)
          
          successCount++
        } else {
          // Log error
          const errorMsg = responseData.errors?.join(', ') || 'Unknown OneSignal error'
          console.error(`Push failed for ${item.id}:`, errorMsg)
          
          await supabase
            .from('push_notification_queue')
            .update({ error: errorMsg })
            .eq('id', item.id)
          
          errorCount++
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error'
        console.error(`Push exception for ${item.id}:`, errorMsg)
        
        // Log error
        await supabase
          .from('push_notification_queue')
          .update({ error: errorMsg })
          .eq('id', item.id)
        
        errorCount++
      }
    }

    console.log(`Processed: ${successCount} success, ${errorCount} errors`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: queue.length,
        successCount,
        errorCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
