/**
 * PLAYED RATING REMINDERS — Brief 50 Part F. Nightly (Ben schedules it).
 * Auth: x-internal-secret (INTERNAL_FN_SECRET), fail closed.
 * Writes a public.notifications row of type rate_played_course; the existing
 * auto_queue_push_notification path turns it into a push after the member's
 * notification_preferences check, exactly as other types. Then stamps
 * course_played_ticks.reminded_at. Idempotent: a second run the same night
 * finds the 7-day window and reminded_at already set.
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { requireInternalSecret } from '../_shared/internalAuth.ts';
import { REMINDER_TYPE, reminderCopy, selectReminders, type TickRow } from './selection.ts';

const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const denied = requireInternalSecret(req, corsHeaders);
  if (denied) return denied;
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const now = new Date();
  try {
    const cutoff = new Date(now.getTime() - 2 * 86_400_000).toISOString();
    const { data: ticks, error: tErr } = await sb.from('course_played_ticks')
      .select('user_id, course_id, created_at, reminded_at').is('reminded_at', null).lte('created_at', cutoff).limit(5000);
    if (tErr) throw tErr;
    const rows = (ticks ?? []) as TickRow[];
    const users = [...new Set(rows.map(r => r.user_id))];
    if (users.length === 0) { console.log('[played-rating-reminders] reminder_sent=0'); return json({ success: true, reminder_sent: 0 }); }
    const courses = [...new Set(rows.map(r => r.course_id))];
    const [{ data: ratings, error: rErr }, { data: last, error: lErr }, { data: prefs, error: pErr }] = await Promise.all([
      sb.from('course_ratings').select('user_id, course_id').in('user_id', users).in('course_id', courses).eq('is_mock', false),
      sb.from('notifications').select('user_id, created_at').eq('type', REMINDER_TYPE).in('user_id', users)
        .gte('created_at', new Date(now.getTime() - 7 * 86_400_000).toISOString()),
      sb.from('notification_preferences').select('user_id, muted_types').in('user_id', users),
    ]);
    if (rErr || lErr || pErr) throw rErr ?? lErr ?? pErr;
    const rated = new Set((ratings ?? []).map((r: any) => `${r.user_id}:${r.course_id}`));
    const lastReminderAt = new Map<string, string>();
    for (const n of last ?? []) { const p = lastReminderAt.get(n.user_id); if (!p || n.created_at > p) lastReminderAt.set(n.user_id, n.created_at); }
    const muted = new Set((prefs ?? []).filter((p: any) => ((p.muted_types as string[]) ?? []).includes(REMINDER_TYPE)).map((p: any) => p.user_id));
    const picks = selectReminders({ ticks: rows, rated, lastReminderAt, muted, now });
    const { data: names } = picks.length
      ? await sb.from('golf_courses').select('id, name').in('id', [...new Set(picks.map(p => p.course_id))])
      : { data: [] };
    const nameById = new Map((names ?? []).map((c: any) => [c.id, c.name as string]));
    let sent = 0;
    for (const p of picks) {
      const courseName = nameById.get(p.course_id) ?? 'This course';
      const copy = reminderCopy(courseName, p.ticked_at, now);
      // Stamp first so a crash between steps can never repeat the same course.
      const { data: stamped, error: sErr } = await sb.from('course_played_ticks')
        .update({ reminded_at: now.toISOString() }).eq('user_id', p.user_id).eq('course_id', p.course_id).is('reminded_at', null).select('course_id');
      if (sErr || !stamped?.length) continue;
      const { error: nErr } = await sb.from('notifications').insert({
        user_id: p.user_id, type: REMINDER_TYPE, title: copy.title, message: copy.body,
        actor_type: 'system', actor_id: null, recipient_actor_type: 'personal', recipient_actor_id: p.user_id,
        entity_type: 'course', entity_id: p.course_id, read: false, is_read: false,
        data: { course_id: p.course_id, course_name: courseName },
      });
      if (nErr) { console.error('[played-rating-reminders] insert failed', p.user_id, nErr.message); continue; }
      sent += 1;
    }
    console.log(`[played-rating-reminders] reminder_sent=${sent} candidates=${picks.length}`);
    return json({ success: true, reminder_sent: sent });
  } catch (e) {
    console.error('[played-rating-reminders] failed', e);
    return json({ success: false, error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
