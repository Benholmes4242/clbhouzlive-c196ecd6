# Explore gallery identity and screenshots

## Change
`useDiscoverMediaPreview.ts` now chooses identity using `row.actor_type === 'business'`, not lookup success. Business rows never access the uploader profile in mapping. Missing business replies produce an empty username/name/avatar and false verification. Personal mapping is unchanged.

## Tests
Command: `bunx vitest run src/test/businessAuthorAppWide.test.tsx --maxWorkers=2` — 9 passed.

Full-suite commands run separately, in order:
- `bunx vitest run --shard=1/4 --maxWorkers=2` — 2,125 passed.
- `bunx vitest run --shard=2/4 --maxWorkers=2` — 1,956 passed.
- `bunx vitest run --shard=3/4 --maxWorkers=2` — 2,077 passed.
- `bunx vitest run --shard=4/4 --maxWorkers=2` — 2,015 passed.

Total: **8,173 passed, zero failures**, 728 test files. Previous reported baseline: 8,172. Delta +1: `businessAuthorAppWide.test.tsx`, “keeps business identity empty when the business lookup misses despite an uploader profile”. Asserts business actor type, empty name/avatar/username, false verification, and name not machgolfclub. No existing tests deleted, renamed or rewritten.

Preview signal: latest available build log says `build OK`.

## Screenshots (390 × 970)
- MasterGolf header: captured and visually checked; MT on dark fill, no logo.
- Search overlay with MasterGolf typed: captured and visually checked; MT on dark fill.
- Machrihanish fullscreen via Long form: not reached. Both Long form URLs, including `/amateur?view=watch&watch=long`, show navigation with no posts in this browser. No authenticated verification is available (`external_unmanaged`).
- Shared link: not reached; the actual post id was not obtained from the empty Long form view. No invented post id or fixture screenshot substituted.

No SQL, migrations, deployed service changes, native configuration changes or unrelated production edits.