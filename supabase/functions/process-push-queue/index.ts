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
 * Multi-profile support:
 * - Personal notifications: sent to the user's devices
 * - Business notifications: sent to all owner/admin team members' devices
 * 
 * Required secrets:
 * - ONESIGNAL_APP_ID
 * - ONESIGNAL_REST_API_KEY
 */

interface PushQueueItem {
  id: string;
  user_id: string;
  device_id: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
  recipient_actor_type?: string;
  recipient_actor_id?: string;
}

async function sendPushToDevice(
  deviceId: string,
  title: string,
  body: string,
  data: Record<string, unknown>,
  appId: string,
  apiKey: string
): Promise<{ success: boolean; error?: string }> {
  const response = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${apiKey}`
    },
    body: JSON.stringify({
      app_id: appId,
      include_player_ids: [deviceId],
      headings: { en: title },
      contents: { en: body || '' },
      data: data || {},
      // iOS specific
      ios_badgeType: 'Increase',
      ios_badgeCount: 1,
      // Android specific
      android_channel_id: 'game_notifications',
      priority: 10, // High priority
      // TTL - 24 hours
      ttl: 86400,
    })
  });

  const responseData = await response.json();

  if (response.ok && !responseData.errors?.length) {
    return { success: true };
  } else {
    return { 
      success: false, 
      error: responseData.errors?.join(', ') || 'Unknown OneSignal error' 
    };
  }
}

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

    for (const item of queue as PushQueueItem[]) {
      try {
        const recipientActorType = item.recipient_actor_type || 'personal';
        const recipientActorId = item.recipient_actor_id || item.user_id;
        
        // Determine target user IDs based on actor type
        let targetUserIds: string[] = [];
        
        if (recipientActorType === 'business') {
          // Business notification - get all owners and admins
          const { data: teamMembers } = await supabase
            .from('business_members')
            .select('user_profile_id')
            .eq('business_id', recipientActorId)
            .in('role', ['owner', 'admin']);
          
          targetUserIds = teamMembers?.map(m => m.user_profile_id) || [];
          console.log(`Business notification for ${recipientActorId}: ${targetUserIds.length} team members`);
        } else {
          // Personal notification - send to the individual user
          targetUserIds = [recipientActorId];
        }

        if (targetUserIds.length === 0) {
          // No recipients found - mark as error
          await supabase
            .from('push_notification_queue')
            .update({ error: 'No recipients found' })
            .eq('id', item.id);
          errorCount++;
          continue;
        }

        // If item already has a device_id, send to that device directly
        if (item.device_id) {
          const result = await sendPushToDevice(
            item.device_id,
            item.title,
            item.body || '',
            {
              ...item.data,
              ...(recipientActorType === 'business' ? {
                business_id: recipientActorId,
                notification_type: 'business',
              } : {}),
            },
            ONESIGNAL_APP_ID,
            ONESIGNAL_API_KEY
          );

          if (result.success) {
            await supabase
              .from('push_notification_queue')
              .update({ sent_at: new Date().toISOString() })
              .eq('id', item.id);
            successCount++;
          } else {
            console.error(`Push failed for ${item.id}:`, result.error);
            await supabase
              .from('push_notification_queue')
              .update({ error: result.error })
              .eq('id', item.id);
            errorCount++;
          }
        } else {
          // No device_id provided - get devices for all target users and send
          let sentToAny = false;
          const errors: string[] = [];

          for (const userId of targetUserIds) {
            const { data: devices } = await supabase
              .from('user_push_devices')
              .select('provider_id')
              .eq('user_id', userId)
              .eq('enabled', true);

            for (const device of devices || []) {
              const result = await sendPushToDevice(
                device.provider_id,
                item.title,
                item.body || '',
                {
                  ...item.data,
                  ...(recipientActorType === 'business' ? {
                    business_id: recipientActorId,
                    notification_type: 'business',
                  } : {}),
                },
                ONESIGNAL_APP_ID,
                ONESIGNAL_API_KEY
              );

              if (result.success) {
                sentToAny = true;
              } else {
                errors.push(`${device.provider_id}: ${result.error}`);
              }
            }
          }

          if (sentToAny) {
            await supabase
              .from('push_notification_queue')
              .update({ sent_at: new Date().toISOString() })
              .eq('id', item.id);
            successCount++;
          } else if (errors.length > 0) {
            await supabase
              .from('push_notification_queue')
              .update({ error: errors.join('; ') })
              .eq('id', item.id);
            errorCount++;
          } else {
            // No devices found for any user
            await supabase
              .from('push_notification_queue')
              .update({ error: 'No devices found for recipients' })
              .eq('id', item.id);
            errorCount++;
          }
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
