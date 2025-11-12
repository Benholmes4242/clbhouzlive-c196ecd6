import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PanelRole = "none" | "limited" | "full" | "unknown";

// Server returns: "full" | "limited" | "none"
type PanelRoleServer = "full" | "limited" | "none";

export function usePanelRole() {
  const [role, setRole] = useState<PanelRole>("none");
  const [loading, setLoading] = useState(true);

  const fetchRole = async () => {
    setLoading(true);
    try {
      // Explicit auth header fallback (supabase-js v2 includes it automatically, but just in case)
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke("secure-site-access-check", { 
        body: {},
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
      });
      
      if (error) {
        console.error('[AdminAccess] Role check failed:', error);
        console.error('[AdminAccess] Error details:', JSON.stringify(error, null, 2));
        // CORS/network failures will show here - don't silently fail
        setRole("unknown");
      } else {
        // Simplified: key off role directly, treating missing/invalid as unknown
        const serverRole = (data?.role ?? "unknown") as PanelRole;
        console.log('[AdminAccess] Role check success:', { serverRole, data });
        setRole(serverRole);
      }
    } catch (e) {
      // Network/CORS errors that bypass the error callback
      console.error('[AdminAccess] Role check exception (likely CORS/network):', e);
      setRole("unknown");
    }
    setLoading(false);
  };

  useEffect(() => {
    let mounted = true;

    const safeFetch = async () => {
      if (!mounted) return;
      await fetchRole();
    };

    safeFetch();

    const onVis = () => {
      if (document.visibilityState === "visible" && mounted) {
        fetchRole();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      mounted = false;
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return { role, loading, refresh: fetchRole };
}
