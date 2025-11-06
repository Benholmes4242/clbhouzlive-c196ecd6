// Scheduled cleanup for old site_gate_attempts records
export const onSchedule: PagesFunction<{
  SUPABASE_URL: string,
  SUPABASE_SERVICE_ROLE_KEY: string
}> = async (ctx) => {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = ctx.env;
  const supabase = (await import("https://esm.sh/@supabase/supabase-js@2")).createClient(
    SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Delete attempts older than 30 days
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  await supabase.from("site_gate_attempts").delete().lt("last_failed_at", cutoff);
  
  return new Response("ok");
};
