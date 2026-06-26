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

    let successCount = 0;
    let errorCount = 0;

    // ── Resolve recipient targets per queue item ──
    // If the queued push corresponds to a BUSINESS-recipient notification,
    // fan out to all members (owner/admin/editor) of the business, respecting
    // each member's notification preferences. Personal recipients unchanged.
    async function resolveTargets(item: any): Promise<Array<{ externalId: string; userId: string }>> {
      const data = (item.data ?? {}) as Record<string, any>;
      const recipientActorType = data.recipient_actor_type as string | undefined;
      const recipientActorId = data.recipient_actor_id as string | undefined;
      const notifType = (data.type as string | undefined) ?? null;

      if (recipientActorType !== 'business' || !recipientActorId) {
        // Personal recipient: keep existing behaviour (one row → one push).
        return [{ externalId: item.device_id || item.user_id, userId: item.user_id }];
      }

      // Business recipient: look up active managers (owner/admin/editor).
      const { data: members, error: memErr } = await supabase
        .from('business_members')
        .select('user_id, role')
        .eq('business_id', recipientActorId)
        .in('role', ['owner', 'admin', 'editor']);

      if (memErr || !members || members.length === 0) {
        // Fall back to the queued user_id so we never silently drop.
        return [{ externalId: item.device_id || item.user_id, userId: item.user_id }];
      }

      const userIds = Array.from(new Set(members.map((m: any) => m.user_id)));

      // Respect each manager's notification preferences (muted_types).
      let mutedByUser = new Map<string, string[]>();
      if (notifType) {
        const { data: prefs } = await supabase
          .from('notification_preferences')
          .select('user_id, muted_types')
          .in('user_id', userIds);
        for (const p of prefs ?? []) {
          mutedByUser.set(p.user_id as string, (p.muted_types as string[]) ?? []);
        }
      }

      const allowedUsers = userIds.filter((uid) => {
        const muted = mutedByUser.get(uid) ?? [];
        return !(notifType && muted.includes(notifType));
      });
      if (allowedUsers.length === 0) return [];

      // Fetch enabled devices for each allowed manager.
      const { data: devices } = await supabase
        .from('user_push_devices')
        .select('user_id, provider_id')
        .in('user_id', allowedUsers)
        .eq('enabled', true);

      // De-dupe by externalId so a manager with the same provider_id under
      // multiple paths only gets one push for this item.
      const seen = new Set<string>();
      const targets: Array<{ externalId: string; userId: string }> = [];
      for (const d of devices ?? []) {
        const ext = (d.provider_id as string) || (d.user_id as string);
        if (seen.has(ext)) continue;
        seen.add(ext);
        targets.push({ externalId: ext, userId: d.user_id as string });
      }
      return targets;
    }

    for (const item of queue) {
      try {
        const targets = await resolveTargets(item);

        if (targets.length === 0) {
          // Nothing to send (all managers muted this type) — mark as sent so we don't retry.
          await supabase
            .from('push_notification_queue')
            .update({ sent_at: new Date().toISOString() })
            .eq('id', item.id);
          continue;
        }

        let anySuccess = false;
        let lastError: string | undefined;
        for (const target of targets) {
          const result = await sendPush(
            target.externalId,
            item.title,
            item.body || '',
            item.data || {},
            ONESIGNAL_APP_ID,
            ONESIGNAL_API_KEY
          );
          if (result.success) {
            anySuccess = true;
          } else {
            lastError = result.error;
          }
        }

        if (anySuccess) {
          await supabase
            .from('push_notification_queue')
            .update({ sent_at: new Date().toISOString() })
            .eq('id', item.id);
          successCount++;
        } else {
          await supabase
            .from('push_notification_queue')
            .update({ error: lastError ?? 'All targets failed' })
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
