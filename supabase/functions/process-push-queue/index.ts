import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { routeForNotif } from '../_shared/notifRoute.ts';


import { corsFor } from '../_shared/cors.ts';
async function sendPush(
  externalId: string,
  title: string,
  body: string,
  data: Record<string, unknown>,
  appId: string,
  apiKey: string,
  idempotencyKey: string,
  badgeCount: number | null
): Promise<{ success: boolean; error?: string }> {
  // iOS badge: always SetTo (never Increase) so it mirrors the app's
  // Alerts unread count. If we couldn't compute the count, omit the
  // number but still send SetTo to avoid runaway lifetime increments.
  const badgeFields: Record<string, unknown> = { ios_badgeType: 'SetTo' };
  if (typeof badgeCount === 'number' && badgeCount >= 0) {
    badgeFields.ios_badgeCount = badgeCount;
  }

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
      external_id: idempotencyKey,
      ...badgeFields,
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
  const corsHeaders = corsFor(req.headers.get('Origin'));
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  // Shared-secret gate — FAIL CLOSED. If PUSH_QUEUE_SECRET is not configured,
  // refuse to run rather than accepting anonymous callers.
  const expectedSecret = Deno.env.get('PUSH_QUEUE_SECRET');
  if (!expectedSecret) {
    return new Response(
      JSON.stringify({ success: false, error: 'Server misconfigured: push queue secret unset' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
  const provided = req.headers.get('x-push-secret');
  if (provided !== expectedSecret) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

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

    // Atomic claim: marks rows claimed_at=now() under FOR UPDATE SKIP LOCKED,
    // releases zombie claims (>5 min), and expires stale rows (>6h) so an
    // outage backlog can never burst-flush. All inside the DB function.
    const { data: queue, error: fetchError } = await supabase
      .rpc('claim_push_queue_batch', { p_limit: 100 });

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

    // Compute per-recipient unread count ONCE per batch. Matches the
    // predicate set of useUnreadNotifications (muted types, entity
    // liveness), so the iOS badge equals the in-app Alerts number.
    const unreadByUser = new Map<string, number | null>();
    for (const uid of userIds as string[]) {
      try {
        const { data: cnt, error: cntErr } = await supabase.rpc(
          'get_unread_notification_count',
          { p_user_id: uid, p_actor_type: 'personal', p_actor_id: uid },
        );
        unreadByUser.set(uid, cntErr ? null : (typeof cnt === 'number' ? cnt : null));
      } catch {
        unreadByUser.set(uid, null);
      }
    }

    // Fan-out is done at enqueue time. Each queue row targets a single
    // (user_id, device_id); we apply that user's muted_types filter then send.
    // OneSignal's `external_id` body field is the idempotency key — reusing
    // the queue row UUID guarantees at-most-once even on retry.
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

        // Compute a client route so tapping the push deep-links correctly.
        // If the enqueuer already supplied data.route (e.g. gam dispatcher),
        // preserve it; otherwise derive it from notif_type + entity_* + data.
        const existingRoute = typeof data.route === 'string' ? data.route : null;
        const route = existingRoute ?? routeForNotif({
          notif_type: data.type ?? data.notif_type ?? null,
          entity_type: data.entity_type ?? null,
          entity_id: data.entity_id ?? null,
          data,
          actor_user_id: data.actor_user_id ?? null,
        });
        // Median's documented behaviour: a push whose Additional Data contains
        // targetUrl is auto-navigated in-app on tap (works cold/warm/background,
        // no JS required). Origin MUST match the app's WebView Initial URL /
        // AASA host so taps stay inside the WebView.
        const APP_ORIGIN = (Deno.env.get('APP_WEBVIEW_ORIGIN') ?? 'https://clbhouz.co.uk').replace(/\/$/, '');
        const targetUrl = route.startsWith('http') ? route : `${APP_ORIGIN}${route}`;
        const outgoingData = { ...data, route, targetUrl };

        const badgeCount = unreadByUser.has(item.user_id)
          ? unreadByUser.get(item.user_id) ?? null
          : null;

        const result = await sendPush(
          externalId,
          item.title,
          item.body || '',
          outgoingData,
          ONESIGNAL_APP_ID,
          ONESIGNAL_API_KEY,
          item.id,
          badgeCount
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
