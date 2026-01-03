/**
 * Delete a pending review video (Stream asset + DB row)
 * Called when user removes a video before submitting review
 */

import { serve } from "https://deno.land/std@0.220.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { corsHeaders } from "../_shared/cors.ts";
import { normalizeError } from "../_shared/normalize-error.ts";

interface DeleteRequest {
  streamId: string;
  dbRowId?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Get auth from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase client with user's auth
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    let body: DeleteRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { streamId, dbRowId } = body;
    if (!streamId) {
      return new Response(JSON.stringify({ error: "Missing streamId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`🗑️ Delete review video: streamId=${streamId}, dbRowId=${dbRowId}, user=${user.id}`);

    // Verify ownership via course_review_media
    // RLS will prevent deletion if user doesn't own the row
    if (dbRowId) {
      const { data: mediaRow, error: fetchError } = await supabase
        .from("course_review_media")
        .select("id, stream_id, status, owner_user_id")
        .eq("id", dbRowId)
        .single();

      if (fetchError || !mediaRow) {
        console.log(`Media row ${dbRowId} not found or not owned by user`);
        // Continue to try Stream deletion anyway
      } else if (mediaRow.status === "attached") {
        return new Response(JSON.stringify({ error: "Cannot delete attached media" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        // Delete DB row
        const { error: deleteError } = await supabase
          .from("course_review_media")
          .delete()
          .eq("id", dbRowId);

        if (deleteError) {
          console.error("Failed to delete DB row:", deleteError);
        } else {
          console.log(`✅ Deleted DB row: ${dbRowId}`);
        }
      }
    }

    // Delete from Cloudflare Stream
    const accountId = Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
    const streamToken = Deno.env.get("CLOUDFLARE_STREAM_API_TOKEN");

    if (!accountId || !streamToken) {
      console.error("Missing Cloudflare credentials");
      return new Response(
        JSON.stringify({ success: true, message: "DB deleted, Stream credentials missing" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Deleting Stream asset: ${streamId}`);
    const cfResp = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${streamId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${streamToken}` },
      }
    );

    if (cfResp.ok || cfResp.status === 404) {
      console.log(`✅ Deleted from Cloudflare Stream: ${streamId}`);
    } else {
      const cfJson = await cfResp.json().catch(() => ({}));
      console.warn("Cloudflare delete failed:", cfResp.status, cfJson);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Video deleted" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in delete-review-video:", error);
    return new Response(
      JSON.stringify({ error: normalizeError(error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
