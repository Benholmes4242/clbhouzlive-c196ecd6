import { supabase } from '@/integrations/supabase/client';

const EDGE_BASE = "https://ybxkehyomcakqjvuhnna.supabase.co/functions/v1";

async function withAuthHeaders(init: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = new Headers(init.headers || {});
  headers.set('Content-Type', 'application/json');
  if (session?.access_token) headers.set('Authorization', `Bearer ${session.access_token}`);
  // IMPORTANT: do NOT include credentials for cross-origin edge calls (breaks CORS when origin is *)
  return { ...init, headers };
}

/** Call any Supabase Edge function with a one-time silent retry on 401 */
export async function callEdge(path: string, init: RequestInit = {}, retry = true) {
  const req = await withAuthHeaders(init);
  const url = `${EDGE_BASE}/${path}`;
  const res = await fetch(url, req);

  // Read response body once
  let bodyText = '';
  try {
    bodyText = await res.text();
  } catch (e) {
    console.error('[callEdge] Failed to read response text', e);
  }

  // Log everything for debugging
  console.log('[callEdge] Response', {
    path,
    status: res.status,
    ok: res.ok,
    bodyText: bodyText.substring(0, 500), // First 500 chars
  });

  // Silent retry: stale/paused sessions → refresh once, then re-call
  if (res.status === 401 && retry) {
    console.warn(`[callEdge] 401 from ${path} → refreshing session & retrying once`);
    const { error } = await supabase.auth.refreshSession();
    if (!error) {
      const req2 = await withAuthHeaders(init);
      const res2 = await fetch(url, req2);
      
      let bodyText2 = '';
      try {
        bodyText2 = await res2.text();
      } catch (e) {
        console.error('[callEdge] Failed to read retry response text', e);
      }

      console.log('[callEdge] Retry response', {
        path,
        status: res2.status,
        ok: res2.ok,
        bodyText: bodyText2.substring(0, 500),
      });

      if (!res2.ok) {
        let json: any = null;
        try {
          json = bodyText2 ? JSON.parse(bodyText2) : null;
        } catch (e) {
          // non-JSON error
        }
        const msg = json?.error || json?.message || `Edge request failed with status ${res2.status}`;
        throw new Error(msg);
      }

      if (!bodyText2) return null;
      try {
        return JSON.parse(bodyText2);
      } catch (e) {
        console.error('[callEdge] JSON parse failed on retry', { path, bodyText: bodyText2, error: e });
        throw new Error('Invalid JSON from edge function');
      }
    }
  }

  if (!res.ok) {
    let json: any = null;
    try {
      json = bodyText ? JSON.parse(bodyText) : null;
    } catch (e) {
      // non-JSON / HTML error page etc
    }

    const msg = json?.error || json?.message || `Edge request failed with status ${res.status}`;
    throw new Error(msg);
  }

  if (!bodyText) return null;

  try {
    return JSON.parse(bodyText);
  } catch (e) {
    console.error('[callEdge] JSON parse failed', { path, bodyText, error: e });
    throw new Error('Invalid JSON from edge function');
  }
}

// Optional convenience wrappers
export const edgeGet  = (path: string, init?: RequestInit) => callEdge(path, { ...init, method: 'GET' });
export const edgePost = (path: string, body?: unknown, init?: RequestInit) =>
  callEdge(path, { ...init, method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) });
