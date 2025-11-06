// Deletes site_gate_attempts older than 30 days
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  try {
    console.log('🧹 Starting cleanup of old gate attempts');
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! // service role required to bypass RLS
    );
    
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    console.log(`📅 Deleting attempts older than: ${cutoff}`);
    
    const { error, count } = await supabase
      .from("site_gate_attempts")
      .delete({ count: "exact" })
      .lt("last_failed_at", cutoff);
    
    if (error) {
      console.error('❌ Cleanup error:', error);
      throw error;
    }
    
    console.log(`✅ Cleanup complete. Removed ${count ?? 0} old attempts`);
    
    return new Response(JSON.stringify({ ok: true, removed: count ?? 0 }), {
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    console.error("❌ cron-clean-attempts error:", e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { 
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }
});
