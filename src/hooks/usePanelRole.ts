import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PanelRole = "none" | "limited" | "full";

export function usePanelRole() {
  const [role, setRole] = useState<PanelRole>("none");
  const [loading, setLoading] = useState(true);

  const fetchRole = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("secure-site-access-check", { body: {} });
    if (error || !data?.ok) setRole("none");
    else setRole((data.role as PanelRole) ?? "none");
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
