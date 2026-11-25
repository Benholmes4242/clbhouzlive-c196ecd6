/** Request handler with injected dependencies (no Deno/npm imports so it is unit-testable).
 * Auth runs synchronously; an authorised call replies 202 at once and the batch runs via waitUntil. */
export interface HandlerDeps {
  cors: Record<string, string>;
  authorize: (req: Request) => Promise<Response | null>;
  runBatch: () => Promise<void>;
  waitUntil: (p: Promise<unknown>) => void;
}

export function createHandler(deps: HandlerDeps) {
  return async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: deps.cors });
    const denied = await deps.authorize(req);
    if (denied) return denied;
    deps.waitUntil(deps.runBatch().catch((err) => console.error('geocode-played-clubs failed', err)));
    return new Response(JSON.stringify({ started: true }), {
      status: 202, headers: { ...deps.cors, 'Content-Type': 'application/json' },
    });
  };
}
