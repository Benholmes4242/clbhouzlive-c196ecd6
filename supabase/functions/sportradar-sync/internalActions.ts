/** Internal-only maintenance actions: internal secret required, body is { action } only. */
import { requireInternalSecret } from '../_shared/internalAuth.ts';
export const INTERNAL_ACTIONS = ['backfill_missing_leaderboards', 'scorecard_integrity'];
export function gateInternalAction(req: Request, body: Record<string, unknown>, corsHeaders: Record<string, string>): Response | null {
  if (!INTERNAL_ACTIONS.includes(body.action as string)) return null;
  const refusal = requireInternalSecret(req, corsHeaders);
  if (refusal) return refusal;
  if (Object.keys(body).some(key => key !== 'action')) {
    return new Response(JSON.stringify({ error: 'This action accepts only action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  return null;
}
