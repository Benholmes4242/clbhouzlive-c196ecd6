import type { SupabaseClient } from "@supabase/supabase-js";

export async function invokeWithAuth<T = unknown>(
  client: SupabaseClient,
  fn: string,
  options?: { body?: unknown; headers?: Record<string, string> }
): Promise<{ data: T | null; error: (Error & { status?: number }) | null }> {
  const { data, error } = await client.functions.invoke(fn, {
    body: options?.body,
    headers: options?.headers,
  });
  return {
    data: data as T | null,
    error: error as (Error & { status?: number }) | null,
  };
}
