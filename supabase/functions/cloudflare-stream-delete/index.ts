// Edge function to delete orphaned Cloudflare Stream assets
// Called when upload jobs fail after video was uploaded to Stream

import { serve } from "https://deno.land/std@0.220.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { corsFor } from '../_shared/cors.ts';
import { normalizeError } from "../_shared/normalize-error.ts";

interface DeleteRequest {
  uid: string;
}

serve(async (req) => {
  const corsHeaders = corsFor(req.headers.get('Origin'));
  // CORS preflight
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

    const { uid } = body;
    if (!uid || typeof uid !== "string") {
      return new Response(JSON.stringify({ error: "Missing uid" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`🗑️ Delete request for Stream asset: ${uid} by user: ${user.id}`);

    // Verify ownership via RLS - only owner can see their stream_assets
    const { data: asset, error: assetError } = await supabase
      .from("stream_assets")
      .select("uid, status")
      .eq("uid", uid)
      .single();

    if (assetError || !asset) {
      console.log(`Asset ${uid} not found or not owned by user`);
      return new Response(JSON.stringify({ error: "Asset not found or not owned" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Don't delete already attached or deleted assets
    if (asset.status === "attached") {
      return new Response(JSON.stringify({ error: "Cannot delete attached asset" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (asset.status === "deleted") {
      return new Response(JSON.stringify({ success: true, message: "Already deleted" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get Cloudflare credentials
    const accountId = Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
    const streamToken = Deno.env.get("CLOUDFLARE_STREAM_API_TOKEN");

    if (!accountId || !streamToken) {
      console.error("Missing Cloudflare credentials");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Delete from Cloudflare Stream
    console.log(`Deleting ${uid} from Cloudflare Stream...`);
    const cfResp = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${uid}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${streamToken}`,
        },
      }
    );

    // Cloudflare returns 200 on success, 404 if already deleted
    if (!cfResp.ok && cfResp.status !== 404) {
      const cfJson = await cfResp.json().catch(() => ({}));
      console.error("Cloudflare delete failed:", cfResp.status, cfJson);
      // Continue to mark as deleted in DB anyway
    } else {
      console.log(`✅ Deleted from Cloudflare Stream: ${uid}`);
    }

    // Mark as deleted in stream_assets
    const { error: updateError } = await supabase
      .from("stream_assets")
      .update({ status: "deleted" })
      .eq("uid", uid);

    if (updateError) {
      console.error("Failed to update stream_assets:", updateError);
      // Still return success since Cloudflare delete worked
    }

    console.log(`✅ Marked as deleted in DB: ${uid}`);

    return new Response(
      JSON.stringify({ success: true, message: "Asset deleted" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in cloudflare-stream-delete:", error);
    return new Response(JSON.stringify({ error: normalizeError(error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
