/**
 * VERIFICATION DOCUMENT RETENTION PURGE
 * docs/VERIFICATION_DOCUMENT_RETENTION.md — now implemented, not proposed.
 *
 * SQL cannot delete bucket objects, so the work is split:
 *   · public.list_expired_verification_documents()  — what is out of window
 *   · this function                                 — deletes the object
 *   · public.mark_verification_document_purged()    — nulls the path, audits it
 *
 * TWO MODES (one cron entry each):
 *   mode=retention (default) — requests past their window:
 *       approved            → 90 days after decision
 *       rejected / revoked  → 30 days after decision
 *       pending / needs_more_info → held, the reviewer needs it
 *   mode=orphans            — objects older than 7 days that NO request row
 *       references. Uploads happen before submit; orphans are pure liability.
 *
 * The FILE goes; the request row and proof_metadata stay (minus the path) with
 * document_purged_at stamped, so the audit trail of WHAT WAS DECIDED survives
 * while the identity evidence does not. Every deletion is itself audited.
 *
 * Auth: x-cron-secret, or a full admin bearer token.
 */
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

import { corsFor } from "../_shared/cors.ts";

const BUCKET = "business-verification-docs";
const ORPHAN_AGE_DAYS = 7;

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

type Outcome = {
  path: string;
  request_id?: string;
  kind: "retention" | "orphan";
  deleted: boolean;
  detail: string;
};

/** Deletes one object. A missing object counts as deleted — the goal is absence. */
async function deleteObject(path: string): Promise<string | null> {
  const { error } = await supabaseAdmin.storage.from(BUCKET).remove([path]);
  if (!error) return null;
  if (/not found/i.test(error.message)) return null;
  return error.message;
}

/** Walks the bucket one prefix level deep: paths are <business_id>/<ts>-<file>. */
async function listAllObjects(): Promise<{ path: string; created_at: string }[]> {
  const out: { path: string; created_at: string }[] = [];
  const { data: folders, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .list("", { limit: 1000 });
  if (error) throw error;

  for (const folder of folders ?? []) {
    // A file at the root has metadata; a folder does not.
    if ((folder as any).id && (folder as any).metadata) {
      out.push({ path: folder.name, created_at: (folder as any).created_at });
      continue;
    }
    const { data: files } = await supabaseAdmin.storage
      .from(BUCKET)
      .list(folder.name, { limit: 1000 });
    for (const f of files ?? []) {
      out.push({ path: `${folder.name}/${f.name}`, created_at: (f as any).created_at });
    }
  }
  return out;
}

serve(async (req) => {
  const corsHeaders = corsFor(req.headers.get("Origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const cronSecret = Deno.env.get("CRON_SECRET");
    const provided = req.headers.get("x-cron-secret");
    let authorised = !!cronSecret && provided === cronSecret;

    if (!authorised) {
      const authHeader = req.headers.get("Authorization") ?? "";
      const { data: userData } = await supabaseAdmin.auth.getUser(
        authHeader.replace("Bearer ", ""),
      );
      if (userData?.user) {
        const { data: m } = await supabaseAdmin
          .from("admin_memberships")
          .select("role")
          .eq("user_id", userData.user.id)
          .maybeSingle();
        authorised = !!m && m.role === "full";
      }
    }
    if (!authorised) return json({ ok: false, error: "Unauthorized" }, 401);

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const mode: "retention" | "orphans" = body?.mode === "orphans" ? "orphans" : "retention";
    const dryRun = body?.dry_run === true;
    const limit = Math.min(Number(body?.limit ?? 200), 500);

    const outcomes: Outcome[] = [];

    if (mode === "retention") {
      const { data: expired, error } = await supabaseAdmin.rpc(
        "list_expired_verification_documents",
        { p_limit: limit },
      );
      if (error) throw error;

      for (const row of (expired ?? []) as any[]) {
        const path: string = row.document_path;
        if (dryRun) {
          outcomes.push({
            path,
            request_id: row.request_id,
            kind: "retention",
            deleted: false,
            detail: `${row.status} — ${row.retention_days}d window elapsed (dry run)`,
          });
          continue;
        }

        const failure = await deleteObject(path);
        const { error: markErr } = await supabaseAdmin.rpc(
          "mark_verification_document_purged",
          { p_request_id: row.request_id, p_document_path: path, p_error: failure },
        );
        if (markErr) console.error("[doc-purge] mark failed", row.request_id, markErr);

        outcomes.push({
          path,
          request_id: row.request_id,
          kind: "retention",
          deleted: !failure,
          detail: failure
            ? `delete failed: ${failure} — path retained, next sweep retries`
            : `${row.status} — ${row.retention_days}d window elapsed`,
        });
      }
    } else {
      const cutoff = Date.now() - ORPHAN_AGE_DAYS * 24 * 60 * 60 * 1000;
      const all = await listAllObjects();
      const candidates = all
        .filter((o) => !o.created_at || new Date(o.created_at).getTime() < cutoff)
        .slice(0, limit);

      if (candidates.length) {
        const { data: referenced, error } = await supabaseAdmin.rpc(
          "verification_documents_referenced",
          { p_paths: candidates.map((c) => c.path) },
        );
        if (error) throw error;
        const keep = new Set(((referenced ?? []) as any[]).map((r) => r.document_path));

        for (const c of candidates) {
          if (keep.has(c.path)) continue;
          if (dryRun) {
            outcomes.push({ path: c.path, kind: "orphan", deleted: false, detail: "orphan (dry run)" });
            continue;
          }
          const failure = await deleteObject(c.path);
          outcomes.push({
            path: c.path,
            kind: "orphan",
            deleted: !failure,
            detail: failure ? `delete failed: ${failure}` : `orphan older than ${ORPHAN_AGE_DAYS}d`,
          });
        }
      }
    }

    const deleted = outcomes.filter((o) => o.deleted).length;
    console.log(
      `[doc-purge] mode=${mode} dry_run=${dryRun} considered=${outcomes.length} deleted=${deleted}`,
      JSON.stringify(outcomes),
    );
    return json({ ok: true, mode, dry_run: dryRun, considered: outcomes.length, deleted, outcomes });
  } catch (e: any) {
    console.error("[doc-purge] error", e);
    return json({ ok: false, error: e?.message ?? String(e) }, 500);
  }
});
