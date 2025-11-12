import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { invokeWithAuth } from "@/lib/invokeWithAuth";

export type PanelRole = "none" | "limited" | "full" | "unknown";

// Server returns: "full" | "limited" | "none"
type PanelRoleServer = "full" | "limited" | "none";

export function usePanelRole() {
  const { user, loading: sessionLoading } = useSupabaseSession();
  const [role, setRole] = useState<PanelRole>("none");
  const [loading, setLoading] = useState(true);

  const fetchRole = async () => {
    // Wait for session to resolve first
    if (sessionLoading) return;
    
    // Skip during SSR
    if (typeof window === "undefined") return;
    
    // If not authenticated, they're definitely not an admin
    if (!user) {
      setRole("none");
      setLoading(false);
      return;
    }

    // Authenticated: safe to invoke
    setLoading(true);
    try {
      const { data, error } = await invokeWithAuth<{ ok: boolean; role: PanelRoleServer; user_id: string; is_admin: boolean }>(
        supabase, 
        "secure-site-access-check", 
        { body: {} }
      );
      
      if (error) {
        console.error('[AdminAccess] Role check failed:', error);
        // 401 = unauthenticated/expired token = not admin
        // Other errors = network/CORS/server issues
        if ((error as any).status === 401) {
          setRole("none");
        } else {
          setRole("unknown");
        }
      } else {
        const serverRole = (data?.role ?? "none") as PanelRoleServer;
        console.log('[AdminAccess] Role check success:', { serverRole, data });
        setRole(serverRole);
      }
    } catch (e) {
      console.error('[AdminAccess] Role check exception (likely CORS/network):', e);
      setRole("unknown");
    }
    setLoading(false);
  };

  useEffect(() => {
    // Only fetch when session is ready
    if (!sessionLoading) {
      fetchRole();
    }
  }, [sessionLoading, user?.id]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible" && !sessionLoading) {
        fetchRole();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [sessionLoading, user?.id]);

  return { role, loading, refresh: fetchRole };
}
