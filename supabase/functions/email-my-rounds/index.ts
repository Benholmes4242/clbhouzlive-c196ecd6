/** Caller-only export. The export RPC runs with the caller JWT; service role
 * reads/writes only the private delivery log and resolves the own auth email. */
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsFor } from '../_shared/cors.ts';
import { resolveCaller, unauthorized } from '../_shared/callerAuth.ts';
import { roundsCsv, roundsFilename, utf8Base64, type ExportRound } from './csv.ts';

serve(async req => {
  const corsHeaders = corsFor(req.headers.get('Origin'));
  const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return reply({ error: 'Method not allowed' }, 405);
  const caller = await resolveCaller(req);
  if (!caller) return unauthorized(corsHeaders);
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const resendKey = Deno.env.get('RESEND_API_KEY');
  if (!url || !serviceKey || !anonKey) return reply({ ok: false, status: 'failed' });
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  let roundCount: number | null = null;
  const log = async (status: 'sent' | 'failed') => {
    const { error } = await admin.from('round_exports').insert({ user_id: caller.id, rounds: roundCount, status });
    if (error) throw error;
  };
  try {
    const now = new Date();
    const { data: recent, error: recentError } = await admin.from('round_exports').select('id').eq('user_id', caller.id).eq('status', 'sent').gte('requested_at', new Date(now.getTime() - 10 * 60 * 1000).toISOString()).limit(1);
    if (recentError) throw recentError;
    if (recent?.length) return reply({ ok: true, status: 'recent' });
    const scoped = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${caller.jwt}` } }, auth: { persistSession: false } });
    const rounds: ExportRound[] = [];
    // PostgREST caps rows; page the caller RPC so "all" is not truncated.
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await scoped.rpc('export_my_rounds').order('play_date', { ascending: false }).range(offset, offset + 999);
      if (error) throw error;
      if (!Array.isArray(data)) throw new Error('Invalid rounds export');
      rounds.push(...data as ExportRound[]);
      if (data.length < 1000) break;
    }
    if (!rounds.length) return reply({ ok: false, status: 'empty' });
    roundCount = rounds.length;
    // Request bodies/addresses are never used. Resolve the current auth email.
    const { data: auth, error: authError } = await admin.auth.admin.getUserById(caller.id);
    if (authError || !auth.user?.email || !resendKey) throw new Error('Email delivery unavailable');
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'clbhouz <noreply@clbhouz.co.uk>', to: auth.user.email, subject: 'Your rounds on clbhouz', text: `Here are all ${roundCount} of your rounds on clbhouz, hole by hole. Open the attached file in Excel or Numbers.`, attachments: [{ filename: roundsFilename(now), content: utf8Base64(roundsCsv(rounds)) }] }),
    });
    if (!response.ok) {
      const details = await response.text();
      console.error(`[email-my-rounds] Resend [${response.status}]: ${details}`);
      await log('failed');
      return reply({ ok: false, status: 'failed', providerStatus: response.status, details });
    }
    await log('sent');
    return reply({ ok: true, status: 'sent', rounds: roundCount });
  } catch (error) {
    console.error('[email-my-rounds] export failed', error instanceof Error ? error.message : 'Delivery error');
    try { await log('failed'); } catch { console.error('[email-my-rounds] failed to record delivery status'); }
    return reply({ ok: false, status: 'failed' });
  }
});