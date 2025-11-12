import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Invokes a Supabase Edge Function with automatic JWT forwarding.
 * Always includes the Authorization header when a session exists.
 */
export async function invokeWithAuth<T = unknown>(
  supabase: SupabaseClient,
  fn: string,
  opts?: { body?: any }
) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  return supabase.functions.invoke<T>(fn, {
    body: opts?.body ?? {},
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}
