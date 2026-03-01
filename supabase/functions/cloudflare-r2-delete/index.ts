// Edge function to delete objects from Cloudflare R2 (drafts/ prefix only)
// Uses the Cloudflare API (same auth pattern as cloudflare-stream-delete)

import { serve } from "https://deno.land/std@0.220.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { corsHeaders } from "../_shared/cors.ts";
import { normalizeError } from "../_shared/normalize-error.ts";

interface DeleteRequest {
  objectKeys: string[];
}

serve(async (req) => {
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
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request
    let body: DeleteRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { objectKeys } = body;
    if (!objectKeys || !Array.isArray(objectKeys) || objectKeys.length === 0) {
      return new Response(JSON.stringify({ error: "objectKeys array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Safety: only allow deletion from drafts/ prefix
    const invalidKeys = objectKeys.filter((key: string) => !key.startsWith("drafts/"));
    if (invalidKeys.length > 0) {
      return new Response(
        JSON.stringify({ error: "Can only delete objects in drafts/ prefix", invalidKeys }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Cloudflare credentials
    const accountId = Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
    const apiToken = Deno.env.get("CLOUDFLARE_API_TOKEN");
    const r2AccessKeyId = Deno.env.get("R2_ACCESS_KEY_ID");
    const r2SecretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY");
    const bucketName = "clbhouz-post-images";

    if (!accountId) {
      console.error("Missing CLOUDFLARE_ACCOUNT_ID");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`🗑️ R2 delete request for ${objectKeys.length} object(s) by user: ${user.id}`);

    const results: { key: string; deleted: boolean; error?: string }[] = [];

    for (const key of objectKeys) {
      try {
        // Use Cloudflare API to delete R2 objects
        // https://developers.cloudflare.com/api/resources/r2/subresources/objects/methods/delete/
        const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/objects/${encodeURIComponent(key)}`;

        const response = await fetch(url, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${apiToken}`,
          },
        });

        // 200 = deleted, 404 = already gone
        const deleted = response.ok || response.status === 404;
        if (deleted) {
          console.log(`✅ Deleted R2 object: ${key}`);
        } else {
          const errText = await response.text().catch(() => "");
          console.error(`Failed to delete R2 object ${key}: ${response.status} ${errText}`);
        }

        results.push({ key, deleted });
      } catch (err) {
        console.error(`Error deleting R2 object ${key}:`, err);
        results.push({ key, deleted: false, error: String(err) });
      }
    }

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in cloudflare-r2-delete:", error);
    return new Response(JSON.stringify({ error: normalizeError(error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
