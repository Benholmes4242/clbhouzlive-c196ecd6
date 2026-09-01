/**
 * ONBOARDING EMAIL UNSUBSCRIBE — one click, no login, no confirmation step.
 *
 * The link carries the member id and an HMAC of it computed with a server-only
 * secret, so the URL cannot be guessed and nothing needs storing to issue it.
 * GET renders the page; POST covers List-Unsubscribe-Post one-click clients.
 *
 * Writes public.email_unsubscribes, which the nudge job reads as a hard stop
 * for every future email, not just this sequence.
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsFor } from '../_shared/cors.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } },
);

async function expectedToken(userId: string): Promise<string> {
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

function page(headline: string, note: string, status: number): Response {
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${headline}</title></head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#15171F;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif">
  <div style="max-width:380px;padding:32px;text-align:center">
    <div style="font-size:17px;font-weight:700;color:#E7E9EE;margin-bottom:10px">${headline}</div>
    <div style="font-size:13px;line-height:1.55;color:#8A8F9A">${note}</div>
  </div>
</body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
}

Deno.serve(async (req) => {
  const cors = corsFor(req.headers.get('origin'));
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const url = new URL(req.url);
  const userId = url.searchParams.get('u') ?? '';
  const token = url.searchParams.get('t') ?? '';

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
  if (!isUuid || !/^[0-9a-f]{32}$/.test(token)) {
    return page('That link is not valid', 'Ask us to resend it, or turn emails off in Settings.', 400);
  }
  if (token !== (await expectedToken(userId))) {
    return page('That link is not valid', 'Ask us to resend it, or turn emails off in Settings.', 400);
  }

  const { data: authUser } = await supabase.auth.admin.getUserById(userId);
  const email = authUser?.user?.email ?? null;

  const { error } = await supabase
    .from('email_unsubscribes')
    .upsert(
      { user_id: userId, email, source: 'onboarding_nudge' },
      { onConflict: 'user_id', ignoreDuplicates: false },
    );

  if (error) {
    console.error('unsubscribe write failed', userId, error.message);
    return page('Something went wrong', 'Please try that link again in a moment.', 500);
  }

  return page(
    'You are unsubscribed',
    'We will not email you again. Notifications inside the app are unaffected.',
    200,
  );
});
