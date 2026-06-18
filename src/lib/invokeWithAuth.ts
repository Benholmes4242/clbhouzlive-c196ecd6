import { supabase } from "@/integrations/supabase/client";

export async function invokeWithAuth<T = unknown>(
  fn: string,
  options?: { body?: unknown; headers?: Record<string, string> }
): Promise<{ data: T | null; error: Error | null }> {
  const { data, error } = await supabase.functions.invoke(fn, {
    body: options?.body,
    headers: options?.headers,
  });
  return { data: data as T | null, error: error as Error | null };
}
