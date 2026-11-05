/** Internal-header presence is authoritative: failed checks never try JWT.
 * Internal schedules may only run all pros; JWT callers retain targeted runs.
 */
import { requireInternalSecret } from '../_shared/internalAuth.ts';

export async function authenticateSyncRequest(
  req: Request,
  corsHeaders: Record<string, string>,
  authorizeJwt: () => Promise<Response | null>,
): Promise<Response | null> {
  if (req.headers.has('x-internal-secret')) return requireInternalSecret(req, corsHeaders);
  return authorizeJwt();
}

export function internalTargetError(req: Request, userId: string | undefined, corsHeaders: Record<string, string>): Response | null {
  if (!req.headers.has('x-internal-secret') || userId === undefined) return null;
  return new Response(JSON.stringify({ error: 'Internal secret permits all-pros runs only' }), {
    status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}