/**
 * Shared error parser for `secure-admin-operations` invocations.
 *
 * `supabase.functions.invoke()` surfaces non-2xx responses as a
 * `FunctionsHttpError` whose `.context` is the raw `Response`. The JSON
 * body carries our real message (e.g. `"Cannot delete your own account"`,
 * `"username_taken"`, `"Missing required fields"`). Without reading it the
 * caller only sees a generic "Edge Function returned a non-2xx status code".
 *
 * Callers should pipe both the transport error AND any `data.error` payload
 * through this helper so failure toasts always show a real message.
 */
export async function parseAdminOpError(
  error: unknown,
  data?: unknown,
  fallback = 'Action failed',
): Promise<string> {
  // Data-shaped error (200 with `{ error: '...' }` body).
  if (data && typeof data === 'object' && 'error' in (data as any)) {
    const v = (data as any).error;
    if (v) return typeof v === 'string' ? v : JSON.stringify(v);
  }
  if (!error) return fallback;
  const anyErr = error as any;
  try {
    const ctx = anyErr?.context;
    if (ctx && typeof ctx.clone === 'function') {
      // Clone so subsequent reads don't fail on a consumed stream.
      const cloned = ctx.clone();
      const body = await cloned.json().catch(() => null);
      if (body?.error) {
        return typeof body.error === 'string' ? body.error : JSON.stringify(body.error);
      }
      const txt = await ctx.clone().text().catch(() => '');
      if (txt) return txt;
    }
  } catch (_) {
    /* ignore */
  }
  if (anyErr?.message) return String(anyErr.message);
  return fallback;
}
