import { supabase } from "@/integrations/supabase/client";

type Action =
  | "list_admins"
  | "grant_limited"
  | "grant_full"
  | "downgrade"
  | "revoke"
  | "set_expiry"
  | "clear_expiry"
  | "list_audit";

export async function adminRoleManage<T = any>(action: Action, body: Record<string, any> = {}) {
  const { data, error } = await supabase.functions.invoke("admin-role-manage", {
    body: { action, ...body },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as T;
}
