/**
 * WHS connection nudge — wrappers around the SECURITY DEFINER RPCs
 * `send_whs_connection_nudge` and `has_recently_nudged_whs`.
 *
 * Rate-limited server-side to 1 nudge per (sender, recipient) per 7 days.
 */
import { supabase } from '@/integrations/supabase/client';

export interface SendNudgeResult {
  ok: boolean;
  reason?:
    | 'unauthenticated'
    | 'self_nudge'
    | 'recipient_not_found'
    | 'not_connected'
    | 'rate_limited'
    | 'rpc_error';
}

export async function sendWhsConnectionNudge(
  recipientId: string,
): Promise<SendNudgeResult> {
  const { data, error } = await supabase.rpc(
    'send_whs_connection_nudge' as any,
    { p_recipient_id: recipientId },
  );
  if (error) {
    console.error('[sendWhsConnectionNudge] RPC error:', error);
    return { ok: false, reason: 'rpc_error' };
  }
  return (data ?? { ok: false, reason: 'rpc_error' }) as SendNudgeResult;
}

export async function hasRecentlyNudged(recipientId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc(
    'has_recently_nudged_whs' as any,
    { p_recipient_id: recipientId },
  );
  if (error) {
    console.error('[hasRecentlyNudged] RPC error:', error);
    return false;
  }
  return !!data;
}
