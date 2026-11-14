/** Mock-only adapter records typed SDK operations; never performs network reads. */
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import type { WagrClientFactory } from './wagrAuth.ts';
export type Operation = { table: string; method: string; args: unknown[] };
export function testClient(resolve: (ops: Operation[]) => { data: unknown; error: unknown }, options: { valid?: boolean; anonymous?: boolean; admin?: boolean } = {}) {
  const calls: Operation[][] = [];
  const factory: WagrClientFactory = () => ({
    auth: {
      getClaims: () => Promise.resolve({ data: { claims: { sub: '11111111-1111-4111-8111-111111111111', is_anonymous: options.anonymous === true } }, error: options.valid === false ? new Error('invalid') : null }),
      getUser: () => Promise.resolve({ data: { user: {} }, error: options.valid === false ? new Error('invalid') : null }),
    },
    rpc: () => Promise.resolve({ data: options.admin === true, error: null }),
    from: (table: string) => {
      const ops: Operation[] = [];
      const chain: Record<string, unknown> = {};
      for (const method of ['select', 'eq', 'order', 'range', 'single', 'maybeSingle', 'insert', 'upsert', 'update', 'delete', 'not']) chain[method] = (...args: unknown[]) => { ops.push({ table, method, args }); return chain; };
      chain.then = (accept: (value: unknown) => void, reject: (reason: unknown) => void) => { calls.push(ops); return Promise.resolve(resolve(ops)).then(accept, reject); };
      return chain;
    },
  }) as unknown as SupabaseClient;
  return { factory, calls };
}
export function testEnvironment() {
  const names = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'INTERNAL_FN_SECRET'];
  const previous = names.map(name => Deno.env.get(name));
  const values = ['https://example.supabase.co', 'test-anon', 'test-service', 'test-internal'];
  names.forEach((name, i) => Deno.env.set(name, values[i]));
  return () => names.forEach((name, i) => { const value = previous[i]; if (value === undefined) Deno.env.delete(name); else Deno.env.set(name, value); });
}