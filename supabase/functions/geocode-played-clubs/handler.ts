import { probeIdsError } from './probe.ts';
/** Request handler with injected dependencies (no Deno/npm imports so it is unit-testable).
 * Auth runs synchronously; action "probe" answers 200 synchronously and writes nothing; otherwise an authorised call replies 202 at once and the batch runs via waitUntil. */
export interface HandlerDeps {
  cors: Record<string, string>;
  authorize: (req: Request) => Promise<Response | null>;
  runBatch: () => Promise<void>;
  waitUntil: (p: Promise<unknown>) => void;
  /** Brief 28 test mode: synchronous, writes nothing. */
  probe?: (ids: string[]) => Promise<unknown>;
}

const json = (cors: Record<string, string>, b: unknown, status: number) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

export function createHandler(deps: HandlerDeps) {
  return async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: deps.cors });
    const denied = await deps.authorize(req);
    if (denied) return denied;
    let body: { action?: unknown; club_ids?: unknown } = {};
    try { const text = await req.text(); body = text ? JSON.parse(text) : {}; } catch { body = {}; }
    if (body && body.action === 'probe' && deps.probe) {
      const problem = probeIdsError(body.club_ids);
      if (problem) return json(deps.cors, { error: problem }, 400);
      return json(deps.cors, await deps.probe(body.club_ids as string[]), 200);
    }
    deps.waitUntil(deps.runBatch().catch((err) => console.error('geocode-played-clubs failed', err)));
    return new Response(JSON.stringify({ started: true }), {
      status: 202, headers: { ...deps.cors, 'Content-Type': 'application/json' },
    });
  };
}
