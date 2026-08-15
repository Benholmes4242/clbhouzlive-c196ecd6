#!/usr/bin/env node
// CI guard against repo-versus-production drift in Supabase Edge Functions.
//
// The repo is the deploy source. Anything created or edited in the Supabase
// dashboard/CLI outside the repo drifts invisibly — this has bitten this project
// six times. This check lists every DEPLOYED function name and fails if one has
// no directory under supabase/functions/.
//
// Requires (set as CI secrets):
//   SUPABASE_ACCESS_TOKEN  — personal access token with Management API access
//   SUPABASE_PROJECT_REF   — e.g. ybxkehyomcakqjvuhnna
//
// Skips (exit 0) with a warning when credentials are absent so local runs and
// forked PRs don't fail spuriously.

import { readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const REF = process.env.SUPABASE_PROJECT_REF;
const DIR = "supabase/functions";

if (!TOKEN || !REF) {
  console.warn("[fn-drift] SUPABASE_ACCESS_TOKEN / SUPABASE_PROJECT_REF not set — skipping.");
  process.exit(0);
}

if (!existsSync(DIR)) {
  console.error(`[fn-drift] ${DIR} not found — run from the repo root.`);
  process.exit(1);
}

const res = await fetch(`https://api.supabase.com/v1/projects/${REF}/functions`, {
  headers: { Authorization: `Bearer ${TOKEN}` },
});

if (!res.ok) {
  console.error(`[fn-drift] Management API returned ${res.status}: ${await res.text()}`);
  process.exit(1);
}

const deployed = (await res.json()).map((f) => f.slug ?? f.name).filter(Boolean).sort();

const inRepo = new Set(
  readdirSync(DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== "_shared")
    .map((d) => d.name)
    .filter((name) => existsSync(join(DIR, name, "index.ts"))),
);

const missing = deployed.filter((slug) => !inRepo.has(slug));
const undeployed = [...inRepo].filter((slug) => !deployed.includes(slug)).sort();

console.log(`[fn-drift] ${deployed.length} deployed, ${inRepo.size} in repo.`);
if (undeployed.length) {
  console.warn(`[fn-drift] in repo but not deployed (informational): ${undeployed.join(", ")}`);
}

if (missing.length) {
  console.error(
    `[fn-drift] DRIFT — deployed but absent from ${DIR}/:\n` +
      missing.map((s) => `  - ${s}`).join("\n") +
      `\n\nRetrieve each source from the dashboard and commit it. Deploy only from the repo.`,
  );
  process.exit(1);
}

console.log("[fn-drift] OK — every deployed function exists in the repo.");
