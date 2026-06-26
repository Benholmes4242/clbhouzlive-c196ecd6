import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sendPush(
  externalId: string,
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
      'Authorization': `Key ${apiKey}`,
    },
    body: JSON.stringify({
      app_id: appId,
      include_aliases: { external_id: [externalId] },
      target_channel: 'push',
      headings: { en: title },
      contents: { en: body || '' },
      data: data || {},
      ios_badgeType: 'Increase',
      ios_badgeCount: 1,
      priority: 10,
      ttl: 86400,
    }),
  });

  const result = await response.json();
  if (response.ok && !result.errors?.length) {
    return { success: true };
  }
  return { success: false, error: result.errors?.join(', ') || 'OneSignal error' };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID');
    const ONESIGNAL_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY');

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_API_KEY) {
      return new Response(JSON.stringify({ success: true, message: 'OneSignal not configured', processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: queue, error: fetchError } = await supabase
      .from('push_notification_queue')
      .select('*')
      .is('sent_at', null)
      .is('error', null)
      .order('created_at', { ascending: true })
      .limit(100);

    if (fetchError) {
      return new Response(JSON.stringify({ success: false, error: fetchError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!queue || queue.length === 0) {
      return new Response(JSON.stringify({ success: true, processed: 0, message: 'No pending notifications' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Pre-load muted_types for the recipients of this batch so we can skip per row.
    const userIds = Array.from(new Set(queue.map((q: any) => q.user_id).filter(Boolean)));
    const mutedByUser = new Map<string, string[]>();
    if (userIds.length > 0) {
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('user_id, muted_types')
        .in('user_id', userIds);
      for (const p of prefs ?? []) {
        mutedByUser.set(p.user_id as string, (p.muted_types as string[]) ?? []);
      }
    }

    let successCount = 0;
    let errorCount = 0;

    // Fan-out is now done at enqueue time (auto_queue_push_notification trigger).
    // Each queue row already targets a single (user_id, device_id), so we just
    // send it — applying that user's muted_types filter.
    for (const item of queue) {
      try {
        const data = (item.data ?? {}) as Record<string, any>;
        const notifType = (data.type as string | undefined) ?? null;
        const muted = mutedByUser.get(item.user_id) ?? [];

        if (notifType && muted.includes(notifType)) {
          // Recipient muted this type — mark sent so we don't retry.
          await supabase
            .from('push_notification_queue')
            .update({ sent_at: new Date().toISOString() })
            .eq('id', item.id);
          continue;
        }

        const externalId = item.device_id || item.user_id;
        const result = await sendPush(
          externalId,
          item.title,
          item.body || '',
          item.data || {},
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
          await supabase
            .from('push_notification_queue')
            .update({ error: result.error ?? 'Send failed' })
            .eq('id', item.id);
          errorCount++;
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        await supabase
          .from('push_notification_queue')
          .update({ error: errorMsg })
          .eq('id', item.id);
        errorCount++;
      }
    }

    return new Response(JSON.stringify({ success: true, processed: queue.length, successCount, errorCount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
