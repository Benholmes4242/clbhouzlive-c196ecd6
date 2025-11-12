import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Invokes a Supabase Edge Function with automatic JWT forwarding.
 * Always includes the Authorization header when a session exists.
 * Skips execution during SSR to prevent runtime errors.
 */
export async function invokeWithAuth<T = unknown>(
  supabase: SupabaseClient,
  fn: string,
  opts?: { body?: any }
) {
  // Don't run on the server
  if (typeof window === "undefined") {
    return { 
      data: null as T | null, 
      error: { status: 0, message: "SSR_SKIP" } as any 
    };
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;

  return supabase.functions.invoke<T>(fn, {
    body: opts?.body ?? {},
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}
