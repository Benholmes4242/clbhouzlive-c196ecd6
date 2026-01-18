import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { cors } from "../_shared/cors.ts";

type PanelRoleServer = "full" | "limited" | "none";

const mapDbRoleToClient = (roles: string[]): PanelRoleServer => {
  if (roles.includes("admin")) return "full";
  if (roles.includes("limited_admin")) return "limited";
  return "none";
};

const handler = async (req: Request): Promise<Response> => {
  const rid = crypto.randomUUID();
  const headers = {
    ...cors(req.headers.get('Origin')),
    'X-Debug-Function': 'secure-site-access-check@2025-01-12'
  };

  // Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  console.log(JSON.stringify({
    rid,
    fn: 'secure-site-access-check',
    method: req.method,
    origin: req.headers.get('Origin'),
    time: new Date().toISOString(),
    note: 'begin'
  }));

  try {
    // Get Supabase client with user's auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log(JSON.stringify({ rid, status: 200, code: 'NO_AUTH_SOFT' }));
      const response = { ok: true, role: 'none' as PanelRoleServer, user_id: null, is_admin: false };
      return new Response(
        JSON.stringify(response),
        { status: 200, headers: { 'Content-Type': 'application/json', ...headers } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.log(JSON.stringify({ rid, status: 500, code: 'CONFIG_ERROR' }));
      return new Response(
        JSON.stringify({ ok: false, code: 'CONFIG_ERROR', message: 'Server configuration error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...headers } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader }
      }
    });

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log(JSON.stringify({ rid, status: 401, code: 'AUTH_FAILED', error: authError?.message }));
      return new Response(
        JSON.stringify({ ok: false, code: 'AUTH_FAILED', message: 'Authentication failed' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...headers } }
      );
    }

    // Check user's admin roles
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (rolesError) {
      console.log(JSON.stringify({ rid, status: 500, code: 'DB_ERROR', error: rolesError.message }));
      return new Response(
        JSON.stringify({ ok: false, code: 'DB_ERROR', message: 'Database error' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...headers } }
      );
    }

    // Map DB roles to client role
    const rolesList = (roles || []).map(r => r.role);
    const role = mapDbRoleToClient(rolesList);

    const response = {
      ok: true,
      role,
      user_id: user.id,
      is_admin: role !== "none"
    };

    console.log(JSON.stringify({
      rid,
      status: 200,
      code: 'OK',
      role,
      user_id: user.id,
      db_roles: rolesList
    }));

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...headers },
    });
    
  } catch (error: any) {
    const msg = String(error?.message || error);
    console.log(JSON.stringify({
      rid,
      status: 500,
      code: 'EDGE_ERROR',
      error: msg
    }));
    
    return new Response(
      JSON.stringify({ ok: false, code: 'EDGE_ERROR', message: msg }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...headers } }
    );
  }
};

serve(handler);
