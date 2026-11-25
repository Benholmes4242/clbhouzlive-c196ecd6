# Brief 31 addition — server-resolved curation read

## Rule and implementation

**A member's ten must use the same server-resolved courses everywhere, preserving chosen positions and deliberate gaps.** Implemented within the still-open Brief 31, not a separate closed 31A.

`useUserTopTenCourses` now makes one `get_top_ten_block({ p_owner: userId })` call, maps all supplied courses to the same public `TopTenCourse` shape (`id = course_id`, `rating = member_score`), and adds rank fields using one `golf_courses(id, global_rank, regional_rank, usa_rank)` select for those ids. Null blocks return `[]`; positions are sorted but never filled or compacted. Empty course arrays skip the rank read.

The `compareOwnRatings` import was removed from this hook only. `sortCoursesByRating.ts` and all hook callers are unchanged. Both `top-ten-block` and `top-ten-post-blocks` invalidations already existed and remain. The add/remove/reorder mutation bodies and public return section were compared byte-for-byte against `ec8551e3e6`: **identical**. No database writes were performed during verification.

## Cross-app audit

Only paths whose code was read are marked checked. These are source checks, not live account checks.

| Place | Outcome |
|---|---|
| `src/hooks/useUserTopTenCourses.ts` | Checked: resolver RPC plus rank enrichment; no ratings, pinned-table or exclusions read to resolve the ten. Mutation writes retained. |
| `src/components/profile/hero/ProfileHero.tsx` | Checked: first resolved position supplies fallback cover; no independent rating selection. Unchanged caller now receives the server list. |
| `src/components/profile/hero/ProfileTopTenRail.tsx` | Checked: renders position-ordered `useTenBlock` courses; follows rule. |
| `src/components/profile/courses/AddCourseModal.tsx` | Checked: Manage displays hook entries/positions; no alternate auto-rating selector. Receives the same resolved list as the profile. |
| `src/features/pro-profile/ProProfileBuildOne.tsx` | Checked: lowest resolved position supplies fallback cover; follows rule. |
| `src/features/edit-profile/EditProfileCompletion.tsx` | Checked in full: hook count supplies completion; no selection logic. |
| `src/features/edit-profile/EditProfileGolf.tsx` | Checked lines 1–100: count and Manage entrypoint consume the hook; no selection logic. |
| `src/components/topTen/useTenBlocks.ts` | Checked in full: profile calls `get_top_ten_block`, post batches call `get_top_ten_post_blocks`; no browser slot selection. |
| `src/components/topTen/TenBlock.tsx`, `topTenModel.ts` | Checked: render supplied positions; no ratings-page resolver. |
| `src/components/profile/courses/AllCoursesList.tsx` | Checked: sorts the played-course list, not ten slots. Unchanged under the explicit hook-only scope. |
| Chart, published/backfill and background database resolution | Source search did not locate checked-in bodies for the block RPCs or sufficient chart/post/background resolver definitions. **Unverified**; generated signatures do not establish function behavior. Ben's statement that the database shares the correct resolver remains the supplied brief authority. No SQL executed to inspect it. |

No other independent browser ten-slot selector was identified. No historical published post, chart record, permission, setting or sample data was changed. Caller-specific unrelated font/branding drift was not worked on in this addition.

## Tests and counts

```text
bunx vitest run src/test/brief31ResolvedTopTen.test.tsx --maxWorkers=1 --no-file-parallelism
```

**4/4 passed, one new file.** Cases:

1. `returns the ten server positions with Heritage at 10, auto flags and member scores unchanged` — verifies positions 1–10, picked 1–7/automatic 8–10, score mapping, one RPC, one rank batch and the full Heritage output at #10.
2. `preserves a gap at position 4 without compacting the nine returned courses`.
3. `returns an empty list for a null block and performs no rank read`.
4. `never reads ratings, pinned courses or exclusions to resolve the ten` — explicit mock assertions against all three forbidden read tables.

```text
bunx vitest run src/test/profileCoverFallback.test.tsx src/test/proProfileBuildOne.test.tsx src/test/proProfileBuildOneB.test.tsx src/test/ep1EditProfile.test.tsx src/test/ep3EditProfileGolf.test.tsx src/test/ep5Completion.test.tsx src/test/topTenSheet1.test.tsx --maxWorkers=1 --no-file-parallelism
```

**168/168 passed in seven unchanged files.** These consumer tests mock the hook; they are not live account-content proof. No existing test or assertion was deleted, renamed or rewritten by this addition.

Logs: `/tmp/brief31-resolved.log`, `/tmp/brief31-addition-callers.log`.

Last verified full-suite total: **10,676 tests / 930 files**. Full-suite after: **not run**. Expected combined Brief 31 population: **10,694 / 932** (+18/+2): original Brief 31 +14/+1, addition +4/+1. No failed test rerun and no full-suite shard started. The original square-tile assertion remains unchanged pending its exact test-only ruling; isolated addition tests do not close Brief 31.

Latest preview build entry observed: **build OK**, `2026-11-25T23:53:21Z`.

## Ben's requested profile and Manage screenshots

**Both live #10 confirmations and screenshots are unavailable/unverified.** The supported app-session command refused with:

```text
gateway error (failed_precondition): this project's Supabase backend is user-managed; Lovable does not sign its tokens, so no session can be minted for it
```

A fresh browser at `http://localhost:8080/auth` exposed “Continue with email” and “Look around first”; it has no Ben session. The immediate screenshot was blank during initial paint, so it is not supplied as useful visual evidence. No credentials were requested, no guest was created and no SQL was run to identify or impersonate an account. The mocked Heritage-at-10 result is not substituted for a real screenshot.

## Safety and remaining blockers

No SQL, migration, migration file, deployment, trigger or schedule. `feed_config` untouched; `round_pool_cap` remains 30. Existing mutation behavior and permissions unchanged.

Remaining: exact square-tile assertion ruling for main Brief 31 verification, all still-open capture/admission work in `report.md`, and an available app session for Ben's two required live checks. Do not claim the brief closed while those are unavailable.