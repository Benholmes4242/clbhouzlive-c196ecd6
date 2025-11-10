import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PanelRole = "none" | "limited" | "full";

export function usePanelRole() {
  const [role, setRole] = useState<PanelRole>("none");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchRole = async () => {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke("secure-site-access-check", { body: {} });
      if (!mounted) return;
      if (error || !data?.ok) setRole("none");
      else setRole((data.role as PanelRole) ?? "none");
      setLoading(false);
    };

    fetchRole();

    const onVis = () => {
      if (document.visibilityState === "visible") fetchRole();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      mounted = false;
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return { role, loading };
}
