/**
 * ONBOARDING NUDGE SEQUENCE — BRIEF_ONBOARDING_SEQUENCE
 *
 * One ask per member per run, across three surfaces (DM, push, email). The DM
 * is the primary channel; the other two echo it.
 *
 * PRIORITY, first match wins: whs -> club -> username.
 *
 * ELIGIBILITY: profile not deleted, created between 48 hours and 30 days ago,
 * the gap genuinely open, and no ledger row for that (user, gap, channel).
 * The UNIQUE constraint on public.onboarding_nudges is the real safety rail —
 * a double run inserts nothing the second time.
 *
 * THREE GAPS MAXIMUM, EVER. There is no fourth message and no repeat cycle.
 *
 * Push is queued the ordinary way: a row in public.notifications, which
 * auto_queue_push_notification turns into a push AFTER its
 * notification_preferences check. This function never writes
 * push_notification_queue directly.
 *
 * Auth: x-cron-secret (CRON_SECRET or INTERNAL_FN_SECRET).
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsFor } from '../_shared/cors.ts';

export const FUNCTION_VERSION = '2026-09-01-v1-onboarding-nudges';

/**
 * EMAIL ONLY. clbhouz.co.uk is the canonical host (.com only 301s to it).
 * The DM and the push carry RELATIVE in-app routes: a full URL tapped inside
 * the Median WebView leaves for the browser, where any non gate-exempt path
 * renders the download gate at a member who is already in the app.
 */
const EMAIL_ORIGIN = 'https://clbhouz.co.uk';

/** The clbhouz business account. Sends the DM and owns the push actor. */
const CLBHOUZ_BUSINESS_ID = 'b54c35bf-caa8-4d4f-bd38-e0de8c80ecd7';
const NUDGE_NOTIFICATION_TYPE = 'onboarding_nudge';

const MIN_AGE_HOURS = 48;
const MAX_AGE_DAYS = 30;

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } },
);

type Gap = 'whs' | 'club' | 'username';
type Channel = 'dm' | 'push' | 'email';

const GAP_PRIORITY: Gap[] = ['whs', 'club', 'username'];

interface Copy {
  /** Push title, email subject and the DM action label: the one ask. */
  subject: string;
  /**
   * Body, British English, straight apostrophes, spaced hyphens, no
   * exclamation marks. The instruction lives on the action row, so the body is
   * a sentence to a person. `{username}` is substituted where present.
   */
  body: string;
  path: string;
  src: string;
  /**
   * EMAIL ONLY. The short key on the /go/ handoff page. Emails cannot open the
   * app reliably, so they land on an exempt doormat that keeps the destination
   * rather than on the download gate, which drops it.
   */
  goKey: string;
}

const COPY: Record<Gap, Copy> = {
  whs: {
    subject: 'Connect your handicap',
    body:
      'Once you connect your handicap, every round you play turns up here on its ' +
      'own, scored hole by hole against the course you played it on. Nothing to type in.',
    path: '/handicap',
    src: 'nudge_whs',
    goKey: 'handicap',
  },
  club: {
    subject: 'Set your home club',
    body:
      'Add your home club and you will see how your club\'s members are scoring, ' +
      'and find the ones already on clbhouz.',
    path: '/edit-profile',
    src: 'nudge_club',
    goKey: 'profile',
  },
  username: {
    subject: 'Pick a username',
    body:
      'You are down as {username} at the moment. Pick something the golfers you ' +
      'play with will recognise.',
    path: '/edit-profile',
    src: 'nudge_username',
    goKey: 'profile',
  },
};

function bodyFor(gap: Gap, username: string | null): string {
  return COPY[gap].body.replace('{username}', username ?? 'a generated name');
}

/** Relative, internal route. Used by the DM action and the push payload. */
function routeFor(gap: Gap): string {
  const c = COPY[gap];
  return `${c.path}?src=${c.src}`;
}

/**
 * Absolute, canonical host, pointing at the /go/ handoff. EMAIL ONLY — it
 * opens outside the app, where the in-app route would hit the download gate.
 */
function emailLinkFor(gap: Gap): string {
  const c = COPY[gap];
  return `${EMAIL_ORIGIN}/go/${c.goKey}?src=${c.src}`;
}


// ─── Unsubscribe token ───────────────────────────────────────────────────────
// HMAC over the user id with a server-only secret. Nothing guessable and
// nothing to store: the unsubscribe endpoint recomputes it.
async function unsubToken(userId: string): Promise<string> {
  const secret =
    Deno.env.get('NUDGE_UNSUB_SECRET') ??
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`unsub:${userId}`)),
  );
  return Array.from(sig)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32);
}

// ─── The DM ──────────────────────────────────────────────────────────────────
function dmKey(userId: string): string {
  return [`business:${CLBHOUZ_BUSINESS_ID}`, `personal:${userId}`].sort().join('|');
}

let cachedSenderUserId: string | null = null;
/** A message row needs a sender_user_id; use the business owner. */
async function senderUserId(): Promise<string | null> {
  if (cachedSenderUserId) return cachedSenderUserId;
  const { data } = await supabase
    .from('business_members')
    .select('user_profile_id, role')
    .eq('business_id', CLBHOUZ_BUSINESS_ID)
    .in('role', ['owner', 'admin'])
    .order('role', { ascending: true })
    .limit(1);
  cachedSenderUserId = data?.[0]?.user_profile_id ?? null;
  return cachedSenderUserId;
}

/**
 * Create or reuse the direct conversation between the clbhouz business account
 * and the member, then post one message. Mirrors msg_start_direct's dm_key
 * contract; that RPC cannot be used here because it authorises against
 * auth.uid(), which is null on a service-role call.
 */
async function sendDm(userId: string, gap: Gap, username: string | null): Promise<string | null> {
  const sender = await senderUserId();
  if (!sender) return 'no clbhouz business owner to send as';

  const key = dmKey(userId);
  let conversationId: string | null = null;

  const { data: existing, error: findErr } = await supabase
    .from('conversations')
    .select('id')
    .eq('dm_key', key)
    .maybeSingle();
  if (findErr) return findErr.message;

  if (existing) {
    conversationId = existing.id;
    // A member who archived or left still gets the thread back.
    await supabase
      .from('conversation_members')
      .update({ left_at: null })
      .eq('conversation_id', conversationId)
      .not('left_at', 'is', null);
  } else {
    const { data: convo, error: convoErr } = await supabase
      .from('conversations')
      .insert({ type: 'direct', dm_key: key })
      .select('id')
      .single();
    if (convoErr || !convo) return convoErr?.message ?? 'conversation insert failed';
    conversationId = convo.id;
    const { error: memberErr } = await supabase.from('conversation_members').insert([
      { conversation_id: conversationId, actor_type: 'business', actor_id: CLBHOUZ_BUSINESS_ID, role: 'member' },
      { conversation_id: conversationId, actor_type: 'personal', actor_id: userId, role: 'member' },
    ]);
    if (memberErr) return memberErr.message;
  }

  // No URL in the body: one route out, carried by the action. The prose is
  // still the message, so a client that does not know type='action' renders a
  // perfectly usable text bubble.
  const { error: msgErr } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_actor_type: 'business',
    sender_actor_id: CLBHOUZ_BUSINESS_ID,
    sender_user_id: sender,
    type: 'action',
    body: bodyFor(gap, username),
    metadata: {
      onboarding_nudge: gap,
      action: { label: COPY[gap].subject, route: routeFor(gap) },
    },
  });
  if (msgErr) return msgErr.message;

  await supabase
    .from('conversations')
    .update({
      last_message_at: new Date().toISOString(),
      last_message_preview: COPY[gap].subject,
    })
    .eq('id', conversationId);

  return null;
}

// ─── Push ────────────────────────────────────────────────────────────────────
interface Prefs {
  muted_types: string[] | null;
  muted_business_ids: string[] | null;
}

/**
 * Returns 'sent' when a notification row was written (the trigger then applies
 * its own notification_preferences check and queues the push), 'no_device' when
 * the member has no enabled push device, 'muted' when they opted out. Neither
 * of the last two is a failure and neither is retried.
 */
async function sendPush(
  userId: string,
  gap: Gap,
  prefs: Prefs | undefined,
  username: string | null,
): Promise<{ outcome: 'sent' | 'no_device' | 'muted'; error?: string }> {
  if (prefs?.muted_types?.includes(NUDGE_NOTIFICATION_TYPE)) return { outcome: 'muted' };
  // The trigger's personal branch reads muted_types and muted_user_ids but not
  // muted_business_ids, so honour that one here rather than bypassing it.
  if (prefs?.muted_business_ids?.includes(CLBHOUZ_BUSINESS_ID)) return { outcome: 'muted' };

  const { data: devices } = await supabase
    .from('user_push_devices')
    .select('id')
    .eq('user_id', userId)
    .eq('enabled', true)
    .not('onesignal_external_id', 'is', null)
    .limit(1);
  if (!devices || devices.length === 0) return { outcome: 'no_device' };

  // actor_id carries TWO FKs at once — user_profiles(id) AND auth.users(id) —
  // so it can only ever hold a real member. A business id satisfies neither.
  // A system nudge is not from a person, so it stays NULL: the type and copy
  // carry the clbhouz identity. Both recipient_* columns are NOT NULL, and
  // is_read is written alongside the legacy `read` mirror.
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    type: NUDGE_NOTIFICATION_TYPE,
    title: COPY[gap].subject,
    message: bodyFor(gap, username),
    actor_type: 'system',
    actor_id: null,
    recipient_actor_type: 'personal',
    recipient_actor_id: userId,
    entity_type: 'onboarding_nudge',
    read: false,
    is_read: false,
    data: { gap, link: routeFor(gap) },
  });

  if (error) return { outcome: 'no_device', error: error.message };
  return { outcome: 'sent' };
}

// ─── Email ───────────────────────────────────────────────────────────────────
async function sendEmail(
  userId: string,
  email: string,
  gap: Gap,
  username: string | null,
): Promise<{ sent: boolean; skipped?: string; error?: string }> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) {
    console.log('RESEND_API_KEY not configured, skipping email send for', userId);
    return { sent: false, skipped: 'no_api_key' };
  }

  const token = await unsubToken(userId);
  const unsubUrl =
    `${Deno.env.get('SUPABASE_URL')}/functions/v1/onboarding-unsubscribe` +
    `?u=${encodeURIComponent(userId)}&t=${token}`;
  const link = emailLinkFor(gap);
  const prose = bodyFor(gap, username);

  const text = `${prose}\n\n${link}\n\nUnsubscribe: ${unsubUrl}`;
  const html = `
<!doctype html>
<html><body style="margin:0;padding:24px;background:#15171F;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#E7E9EE">
  <p style="font-size:15px;line-height:1.55;margin:0 0 20px">${prose}</p>
  <p style="margin:0 0 28px">
    <a href="${link}" style="display:inline-block;padding:11px 18px;border-radius:8px;background:#F7931E;color:#15171F;font-size:13px;font-weight:700;text-decoration:none">${COPY[gap].subject}</a>
  </p>
  <p style="font-size:11px;line-height:1.5;color:#8A8F9A;margin:0">
    You are receiving this because you created a clbhouz account.
    <a href="${unsubUrl}" style="color:#8A8F9A;text-decoration:underline">Unsubscribe</a>
  </p>
</body></html>`.trim();

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'clbhouz <noreply@clbhouz.co.uk>',
        to: email,
        subject: COPY[gap].subject,
        text,
        html,
        headers: {
          'List-Unsubscribe': `<${unsubUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      }),
    });
    if (!res.ok) {
      const detail = await res.text();
      console.error('resend failed for', userId, detail);
      return { sent: false, error: detail.slice(0, 300) };
    }
    return { sent: true };
  } catch (e) {
    console.error('resend threw for', userId, e);
    return { sent: false, error: String(e).slice(0, 300) };
  }
}

// ─── Ledger ──────────────────────────────────────────────────────────────────
async function recordSent(userId: string, gap: Gap, channel: Channel): Promise<void> {
  // The UNIQUE constraint absorbs a duplicate; ignoring the conflict is the point.
  const { error } = await supabase
    .from('onboarding_nudges')
    .upsert({ user_id: userId, gap, channel }, { onConflict: 'user_id,gap,channel', ignoreDuplicates: true });
  if (error) console.error('ledger write failed', userId, gap, channel, error.message);
}

// ─── The run ─────────────────────────────────────────────────────────────────
interface Result {
  user_id: string;
  gap: Gap;
  dm: string;
  push: string;
  email: string;
}

Deno.serve(async (req) => {
  const cors = corsFor(req.headers.get('origin'));
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  // CRON_SECRET is not provisioned on this project today, so INTERNAL_FN_SECRET
  // (which is) is accepted as well. Either header value authorises the run.
  const provided = req.headers.get('x-cron-secret') ?? '';
  const accepted = [Deno.env.get('CRON_SECRET'), Deno.env.get('INTERNAL_FN_SECRET')]
    .filter((v): v is string => !!v);
  if (accepted.length === 0 || !accepted.includes(provided)) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  let dryRun = false;
  let limit = 200;
  try {
    const body = await req.json();
    dryRun = body?.dryRun === true;
    if (typeof body?.limit === 'number' && body.limit > 0) limit = Math.min(body.limit, 500);
  } catch { /* no body is fine */ }

  const now = Date.now();
  const newest = new Date(now - MIN_AGE_HOURS * 3600_000).toISOString();
  const oldest = new Date(now - MAX_AGE_DAYS * 86400_000).toISOString();

  const { data: members, error: membersErr } = await supabase
    .from('user_profiles')
    .select('id, username, username_is_custom, primary_club_id, hide_handicap_chip, created_at')
    .is('deleted_at', null)
    .lt('created_at', newest)
    .gt('created_at', oldest)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (membersErr) {
    return new Response(JSON.stringify({ error: membersErr.message }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const ids = (members ?? []).map((m) => m.id);
  if (ids.length === 0) {
    return new Response(JSON.stringify({ version: FUNCTION_VERSION, considered: 0, contacted: [] }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const [{ data: whsRows }, { data: ledgerRows }, { data: prefRows }, { data: unsubRows }] =
    await Promise.all([
      supabase.from('whs_connections').select('user_id').in('user_id', ids).is('deleted_at', null),
      supabase
        .from('onboarding_nudges')
        .select('user_id, gap, channel, resolved_at, sent_at')
        .in('user_id', ids),

      supabase
        .from('notification_preferences')
        .select('user_id, muted_types, muted_business_ids')
        .in('user_id', ids),
      supabase.from('email_unsubscribes').select('user_id').in('user_id', ids),
    ]);

  const hasWhs = new Set((whsRows ?? []).map((r) => r.user_id));
  const unsubscribed = new Set((unsubRows ?? []).map((r) => r.user_id));
  const prefs = new Map<string, Prefs>(
    (prefRows ?? []).map((r) => [r.user_id, r as unknown as Prefs]),
  );

  const sentChannels = new Map<string, Set<string>>(); // userId -> "gap:channel"
  const contactedGaps = new Map<string, Set<Gap>>();
  const openLedger = new Map<string, { gap: Gap; channel: Channel }[]>();
  /* THE SAME-DAY RULE (MICRO_BRIEF_NUDGE_PRIORITY_CHAIN_BROKEN S4). A member who
     closes a gap at 10am must not be asked about the next one at 10:05. Enforced
     on the LEDGER, not a timer: any row sent today stops every send today. */
  const contactedToday = new Set<string>();
  const today = new Date().toISOString().slice(0, 10);
  for (const row of ledgerRows ?? []) {
    const key = row.user_id as string;
    if (!sentChannels.has(key)) sentChannels.set(key, new Set());
    sentChannels.get(key)!.add(`${row.gap}:${row.channel}`);
    if (!contactedGaps.has(key)) contactedGaps.set(key, new Set());
    contactedGaps.get(key)!.add(row.gap as Gap);
    if (typeof row.sent_at === 'string' && row.sent_at.slice(0, 10) === today) {
      contactedToday.add(key);
    }
    if (!row.resolved_at) {
      if (!openLedger.has(key)) openLedger.set(key, []);
      openLedger.get(key)!.push({ gap: row.gap as Gap, channel: row.channel as Channel });
    }
  }


  const results: Result[] = [];
  let resolvedCount = 0;
  let skippedCapped = 0;
  let skippedNothingOpen = 0;

  for (const member of members ?? []) {
    const userId = member.id as string;
    const open: Record<Gap, boolean> = {
      // The 76 members without a whs_connections row are NOT one population.
      // Some have not got round to connecting; others tapped "I don't hold an
      // official handicap" and hide_handicap_chip was persisted - the product
      // has already told them that is fine. Only the first group is a
      // conversion problem; the second is behaving correctly and must be left
      // alone. hide_handicap_chip is the ONLY explicit decline signal - never
      // infer a decline from inactivity, country or anything else.
      whs: !hasWhs.has(userId) && !member.hide_handicap_chip,
      club: !member.primary_club_id,
      // username_is_custom is the only honest signal: signup GENERATES a
      // username, so "is it blank" never fires. NULL means unknown - do not
      // chase. Only an explicit false qualifies.
      username: member.username_is_custom === false,
    };

    // 1. Stamp resolved_at on anything they have since done. Never chased again.
    for (const row of openLedger.get(userId) ?? []) {
      if (!open[row.gap]) {
        if (!dryRun) {
          await supabase
            .from('onboarding_nudges')
            .update({ resolved_at: new Date().toISOString() })
            .eq('user_id', userId)
            .eq('gap', row.gap)
            .is('resolved_at', null);
        }
        resolvedCount++;
      }
    }

    // 2. Three gaps maximum, ever.
    if ((contactedGaps.get(userId)?.size ?? 0) >= GAP_PRIORITY.length) {
      skippedCapped++;
      continue;
    }

    // 3. One ask. Highest-priority open gap with an unsent channel.
    const done = sentChannels.get(userId) ?? new Set<string>();
    let gap: Gap | null = null;
    for (const candidate of GAP_PRIORITY) {
      if (!open[candidate]) continue;
      const missing = (['dm', 'push', 'email'] as Channel[]).some(
        (ch) => !done.has(`${candidate}:${ch}`),
      );
      if (missing) {
        gap = candidate;
        break;
      }
    }
    if (!gap) {
      skippedNothingOpen++;
      continue;
    }

    const result: Result = { user_id: userId, gap, dm: 'skipped', push: 'skipped', email: 'skipped' };

    if (dryRun) {
      results.push({ ...result, dm: 'dry_run', push: 'dry_run', email: 'dry_run' });
      continue;
    }

    // DM — the primary channel. Its failure must not stop the others, and
    // theirs must not stop its ledger row.
    if (!done.has(`${gap}:dm`)) {
      try {
        const err = await sendDm(userId, gap, member.username as string | null);
        if (err) {
          result.dm = `failed: ${err}`;
          console.error('dm failed for', userId, err);
        } else {
          await recordSent(userId, gap, 'dm');
          result.dm = 'sent';
        }
      } catch (e) {
        result.dm = `failed: ${String(e).slice(0, 200)}`;
        console.error('dm threw for', userId, e);
      }
    } else {
      result.dm = 'already_sent';
    }

    // Push — via notifications, so auto_queue_push_notification still decides.
    if (!done.has(`${gap}:push`)) {
      try {
        const { outcome, error } = await sendPush(userId, gap, prefs.get(userId), member.username as string | null);
        if (outcome === 'sent') {
          await recordSent(userId, gap, 'push');
          result.push = 'sent';
        } else {
          // No device or muted: expected, not an error, not retried.
          result.push = error ? `failed: ${error}` : outcome;
        }
      } catch (e) {
        result.push = `failed: ${String(e).slice(0, 200)}`;
        console.error('push threw for', userId, e);
      }
    } else {
      result.push = 'already_sent';
    }

    // Email — permanent opt-out honoured, missing key is a skip not a throw.
    if (done.has(`${gap}:email`)) {
      result.email = 'already_sent';
    } else if (unsubscribed.has(userId)) {
      result.email = 'unsubscribed';
    } else {
      try {
        const { data: authUser } = await supabase.auth.admin.getUserById(userId);
        const email = authUser?.user?.email ?? null;
        if (!email) {
          result.email = 'no_address';
        } else {
          const out = await sendEmail(userId, email, gap, member.username as string | null);
          if (out.sent) {
            await recordSent(userId, gap, 'email');
            result.email = 'sent';
          } else {
            result.email = out.skipped ?? `failed: ${out.error ?? 'unknown'}`;
          }
        }
      } catch (e) {
        result.email = `failed: ${String(e).slice(0, 200)}`;
        console.error('email threw for', userId, e);
      }
    }

    results.push(result);
  }

  return new Response(
    JSON.stringify({
      version: FUNCTION_VERSION,
      dry_run: dryRun,
      considered: members?.length ?? 0,
      contacted: results,
      resolved: resolvedCount,
      skipped_capped: skippedCapped,
      skipped_nothing_open: skippedNothingOpen,
    }),
    { headers: { ...cors, 'Content-Type': 'application/json' } },
  );
});
