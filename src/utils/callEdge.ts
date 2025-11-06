import { supabase } from '@/integrations/supabase/client';

const EDGE_BASE = "https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1";

async function withAuthHeaders(init: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = new Headers(init.headers || {});
  headers.set('Content-Type', 'application/json');
  if (session?.access_token) headers.set('Authorization', `Bearer ${session.access_token}`);
  return { ...init, headers, credentials: 'include' as RequestCredentials };
}

/** Call any Supabase Edge function with a one-time silent retry on 401 */
export async function callEdge(path: string, init: RequestInit = {}, retry = true) {
  const req = await withAuthHeaders(init);
  const res = await fetch(`${EDGE_BASE}/${path}`, req);

  // Silent retry: stale/paused sessions → refresh once, then re-call
  if (res.status === 401 && retry) {
    console.warn(`[callEdge] 401 from ${path} → refreshing session & retrying once`);
    const { error } = await supabase.auth.refreshSession();
    if (!error) {
      const req2 = await withAuthHeaders(init);
      const res2 = await fetch(`${EDGE_BASE}/${path}`, req2);
      if (!res2.ok) throw new Error(`[callEdge] ${path} failed (${res2.status}): ${await res2.text().catch(() => res2.statusText)}`);
      return parseResponse(res2);
    }
  }

  if (!res.ok) {
    throw new Error(`[callEdge] ${path} failed (${res.status}): ${await res.text().catch(() => res.statusText)}`);
  }
  return parseResponse(res);
}

async function parseResponse(res: Response) {
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}

// Optional convenience wrappers
export const edgeGet  = (path: string, init?: RequestInit) => callEdge(path, { ...init, method: 'GET' });
export const edgePost = (path: string, body?: unknown, init?: RequestInit) =>
  callEdge(path, { ...init, method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) });
