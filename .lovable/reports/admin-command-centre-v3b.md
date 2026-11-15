# Admin Command centre v3B — three stopped checks cleared

## Status
Complete and verified. Focused run 38/38 (33 v3 + 5 unchanged AdminShell). Four separate full shards passed with zero failures or skips. Build OK; `git diff --check` clean.

## Files changed
- `src/features/admin/pages/DashboardPage.tsx` — `data-tone` on the under-par span; status cells print figures only (`isShortFigure` / `ccCellFigure`); zero rounds buckets get a 2px stub.
- `src/features/admin/pages/commandCentreV3.css` — `.admin-cc-v3 { line-height: normal; }` root rule; `overflow-wrap:anywhere` removed from `.status-cell .value`.
- `src/test/adminCommandCentreV3.test.tsx` — panel helper scoped to panel headings; the two authorised assertion updates; three new cases.

No other file changed. `cc3Rules.ts`, `useCcEngine.ts`, `src/index.css`, the v2 hook, AdminShell and adminTheme are untouched this round.

## Authorised assertion changes (before → after)

1. Panel helper (was matching both the Clubs top card and the Clubs panel):
   - before: `const el = screen.getByText(title).closest('section'); if (!el) throw new Error(\`Missing ${title}\`); return el;`
   - after: `const el = [...document.querySelectorAll('section')].find(s => s.querySelector(':scope > .hd > .ti')?.textContent === title); if (!el) throw new Error(\`Missing ${title}\`); return el as HTMLElement;`

2. Under-par colour (jsdom reported an empty inline style value):
   - before: `expect((p.querySelector('[data-cc-to-par]') as HTMLElement).style.color).toBe('var(--cc3-under)');`
   - after: `expect(p.querySelector('[data-cc-to-par]')?.getAttribute('data-tone')).toBe('under');` plus `expect(readFileSync(resolve('src/features/admin/pages/DashboardPage.tsx'), 'utf8')).toContain('x.to_par < 0 ? UNDER_PAR');` plus `expect(readFileSync(resolve('src/index.css'), 'utf8')).toMatch(/--cc3-under:\s*#E24B3F/i);`

Both edits were authorised in the brief; no other existing assertion was altered. `readFileSync` was already imported; `resolve` from `node:path` was added.

## New cases (3)
- `prints a dash instead of chip words in the six cells and keeps the tone on the dot` — Echo chip detail `Unavailable` and Push chip detail `Unavailable` both render `—`, the Echo dot keeps its bad tone, no cell prints the word, and `.status-cell .value` no longer wraps anywhere.
- `keeps the page on normal line height so rows match the mock` — reads `commandCentreV3.css` from disk and finds `line-height: normal` on the `.admin-cc-v3` root rule.
- `gives a zero rounds bucket a 2px stub, faded for earlier days and ink for the last` — a zero bucket renders `height: 2px` without `on`, the last zero bucket renders `2px` with `on`, a full bucket stays `100%`.

## Count reconciliation
Baseline 8,797. Authorised v2 deletion −16, v3 additions +30, v3B additions +3 → expected **8,814**.
Observed, one command each: shard 1 **2,243**, shard 2 **2,135**, shard 3 **2,212**, shard 4 **2,224** = **8,814** across 769 test files. Zero failures, zero skips, so no rerun was needed and no named intermittent case (`tourIsland.test.tsx:235`, `guestStage24.test.tsx:85`) or pre-existing `coursesBrowseHighestRatedRemoval.test.tsx` failure appeared.

## Checks and limits
- Harness latest: `build OK`, `2026-11-15T17:16:23Z`.
- No SQL, migrations, deployed RPC/edge function changes, `feed_config` or `round_pool_cap` changes.
- Admin access, real data readback, on-device rendering and 320px overflow remain unverified; Ben checks on device.
