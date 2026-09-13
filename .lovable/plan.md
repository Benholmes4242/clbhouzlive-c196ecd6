# Explore Magazine Phase D — Server Ranker

## Goal
Replace the finite client-composed Explore body with one server-ranked, keyset-paginated stream while preserving the device-approved scoring, consequences, cadence, shelves, scope behavior, and card renderer.

No SQL will be applied automatically. Every database change will be drafted under `docs/sql/` for Ben to run. `supabase/migrations/` stays untouched.

## Preflight findings and gates
- `gam_round_stats.created_at` is genuine ingest time. A production member’s 79 historical rounds arrived in minute-sized sync clusters on 6 Sep 2026 while their play dates span 2018–2026; individual rows show arrival gaps up to 3,032 days. D2 can use it.
- The live `get_viewer_standing`, `board_pool`, `get_board_courses`, and `get_long_form_videos_v2` definitions have been captured with security, volatility, search path, and grants before drafting replacements.
- D1 cannot switch All to the RPC until Ben runs the draft. The D1 implementation therefore stops at a deployment gate: SQL draft + harness first, live verification and client cutover second.
- The brief’s five-argument RPC signature cannot receive the already-resolved club ID, county, and country required by D3. The draft will add nullable scalar geography parameters while preserving the five original arguments and defaults.
- `SECURITY INVOKER` means candidate depth is bounded by the caller’s current RLS visibility. The D1 census/harness will prove whether that equals the intended eligible universe; it will not bypass RLS or silently change the function to definer.
- The SQL response will return the render contract as JSON fields plus `next_cursor`; rich client-only `payload` objects remain reconstructed in the adapter because SQL cannot return TypeScript hook objects. This keeps `StreamItem` unchanged at the renderer boundary.

## D1 — All view, ranked and paginated
1. Save production-definition evidence beside the SQL draft and inventory exact All candidate sources and grants.
2. Draft `docs/sql/explore_stream_d1.sql`:
   - `explore_config` with explicit grants, RLS, public read policies, seeded weights, and in-function defaults.
   - `get_explore_stream` as `STABLE SECURITY INVOKER`, with All implemented and other views returning a deliberate unsupported result until D3.
   - Reuse `get_viewer_standing` output for `n`, `of`, movement, and field size; do not create a second standing or field count.
   - Port the client weights, binary seen damp, strict tie rejection, story-leading rule, consequence cadence, and outer-ring cap exactly.
3. Use an opaque cursor containing ranked `(score,id)` plus the prior page cadence tail. The tail carries the previous key/ring spacing state so cadence does not reset at page seams; score/id remains the keyset boundary.
4. Add a local PG16 fixture harness proving same-pool rank fidelity, five-page no-duplicate/no-skip pagination, cross-page cadence, and a full cold-member page.
5. After Ben runs the draft, add `exploreKeys.stream(viewer,view,scope)` and `useExploreStream` with `useInfiniteQuery`, five-minute staleness, mount refetch, no focus refetch, and server order unchanged.
6. Persist only the first page by adding the Explore prefix to both the persistence and infinite-shape allowlists. Replace All’s reveal slicing with the existing sentinel calling `fetchNextPage`.
7. Verify source/build, RPC metadata, two live pages, card/shelf standing equality, analytics invocations, and 320/390 overflow. Device items remain “landed, not verified.”

## D2 — Arrival and backlog
1. Extend the draft RPC with a round-only lane split: `created_at - play_date > 30 days` becomes backlog; every other kind remains news.
2. Zero backlog freshness, forbid backlog lead, admit backlog only through the configured one-in-three allowance after news cannot fill the page, then use platform-notable depth.
3. Add the existing “From {Month}” kicker path without changing non-round dates or card rendering.
4. Extend the harness for an old synced round, a newly synced ace, quiet-week page filling, lane ratios, and no caught-up copy.
5. After Ben runs the revision, verify live pages and report D2 device checks as landed, not verified.

## D3 — Scores, Courses, Reviews, Watch
1. Add view branches to the same RPC using the candidate and shelf contracts already accepted in B/C.
2. Pass resolved `primaryClubId`, county, and country from `useViewerScoreScope`; never read home-club free text or re-resolve geography server-side.
3. Move only ranked body rows to the RPC. Existing shelf hooks and insertion positions remain client-owned.
4. Preserve no-handicap behavior, scope empty states, connect routing, consequence figures, event calls, and card interactions.
5. Harness every view/scope and verify multi-page keyset/cadence before removing its client fallback.

## D4 — Wired sources and retirement
1. Populate “On your list” second-line copy from the strongest recent consequence already computed in the stream; retain area as fallback.
2. Change long-form and every other audited stream source to expose loading, failed/retry, and settled-empty distinctly.
3. Remove `useExploreStreamClient` from the page path only after every view passes the server path. Keep the file on the dead-file list as the reference model and rollback; delete nothing.
4. Retain client consequence types/headline rendering, hole-shape batching, shelves, geography resolver, standing shelf, interactions, and analytics.
5. Run final build, locale-key audit, event invocation grep, source error audit, authenticated pagination checks, and 320/390 geometry checks. Report device items as landed, not verified.

## Deliverables per gate
- Files and line ranges changed.
- Live function dumps and draft SQL paths.
- Config schema/defaults and grants.
- Harness output and real-data arrival evidence.
- Cursor/cadence boundary design.
- Lane split by content kind.
- Standing-number reuse proof.
- Every swallowed-error source and its resolution.
- Exact client ranker removals and retained modules.
- Persistence prefix and analytics grep.
- Contradictions and runtime/auth limitations.
