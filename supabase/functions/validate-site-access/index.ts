import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsFor } from "../_shared/cors.ts";

// LEGACY endpoint. Superseded by `secure-site-access` (PBKDF2-hashed codes +
// signed cookie). All hardcoded fallback codes and the unsigned UUID token
// have been removed; this endpoint now fails closed on every request until
// it is deleted from the deployment.
const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = corsFor(req.headers.get("Origin"));
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.warn("validate-site-access called — legacy endpoint, denying.");
  return new Response(
    JSON.stringify({
      success: false,
      message: "This endpoint has been retired. Use secure-site-access.",
    }),
    {
      status: 410,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    },
  );
};

serve(handler);
