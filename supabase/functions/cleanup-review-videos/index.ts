/**
 * TTL cleanup for orphaned review videos
 * Deletes pending videos older than 24 hours that were never attached to a review
 * Should be run on a schedule (e.g., hourly)
 */

import { serve } from "https://deno.land/std@0.220.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { corsHeaders } from "../_shared/cors.ts";
import { normalizeError } from "../_shared/normalize-error.ts";

const CLEANUP_AGE_HOURS = 24;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    // Use service role for cleanup operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Calculate cutoff time
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - CLEANUP_AGE_HOURS);
    const cutoffIso = cutoffTime.toISOString();

    console.log(`🧹 Cleaning up pending review videos older than ${CLEANUP_AGE_HOURS}h (before ${cutoffIso})`);

    // Find orphaned pending videos
    const { data: orphanedVideos, error: fetchError } = await supabase
      .from("course_review_media")
      .select("id, stream_id")
      .eq("media_type", "video")
      .eq("status", "pending")
      .lt("created_at", cutoffIso);

    if (fetchError) {
      console.error("Failed to fetch orphaned videos:", fetchError);
      throw fetchError;
    }

    if (!orphanedVideos || orphanedVideos.length === 0) {
      console.log("✅ No orphaned videos to clean up");
      return new Response(
        JSON.stringify({ success: true, deleted: 0, message: "No orphans found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${orphanedVideos.length} orphaned videos to clean up`);

    // Get Cloudflare credentials
    const accountId = Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
    const streamToken = Deno.env.get("CLOUDFLARE_STREAM_API_TOKEN");

    let deletedCount = 0;
    let failedCount = 0;

    for (const video of orphanedVideos) {
      try {
        // Delete from Cloudflare Stream (if credentials available)
        if (video.stream_id && accountId && streamToken) {
          const cfResp = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${video.stream_id}`,
            {
              method: "DELETE",
              headers: { Authorization: `Bearer ${streamToken}` },
            }
          );

          if (cfResp.ok || cfResp.status === 404) {
            console.log(`✅ Deleted Stream asset: ${video.stream_id}`);
          } else {
            console.warn(`⚠️ Failed to delete Stream asset ${video.stream_id}: ${cfResp.status}`);
          }
        }

        // Delete DB row
        const { error: deleteError } = await supabase
          .from("course_review_media")
          .delete()
          .eq("id", video.id);

        if (deleteError) {
          console.error(`Failed to delete DB row ${video.id}:`, deleteError);
          failedCount++;
        } else {
          console.log(`✅ Deleted DB row: ${video.id}`);
          deletedCount++;
        }
      } catch (error) {
        console.error(`Error cleaning up video ${video.id}:`, error);
        failedCount++;
      }
    }

    console.log(`🧹 Cleanup complete: ${deletedCount} deleted, ${failedCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        deleted: deletedCount,
        failed: failedCount,
        total: orphanedVideos.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in cleanup-review-videos:", error);
    return new Response(
      JSON.stringify({ error: normalizeError(error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
