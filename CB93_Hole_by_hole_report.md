# CB93 — Hole by hole

## Diff summary
- `sections.tsx`: updated only the Hole by hole area; reused HIP card/inset values, canonical score colours, difficulty ramp, toParParts and howItPlaysShare. Hardest first defaults; title reads measured extremes; five columns replace six. Removed the unused top DistributionStrip implementation. One expanded hole shows optional yards, four counts and shares; empty state uses full-round eligibility and CB91 naming. Null means do not enter the numeric ramp.
- `ClubAnalyticsPage.tsx`: sole authorized surrounding change passes existing businessName/courseCount to HoleBySection; no reads added.
- `cb93HoleByHole.test.tsx`: 14 new behavior tests. No existing tests rewritten, renamed, deleted or retargeted; audit found no direct assertions protecting the old default, headings, subline or strip.
- Roadmap and requirement memory updated. No architecture module introduced; local section header records ownership.

## Checks
- `bunx vitest run src/test/cb93HoleByHole.test.tsx src/test/cb92HowItPlays.test.tsx src/test/cb92HowItPlaysPage.test.tsx src/test/cb91CoursesTop.test.tsx`: **32 passed**, four files.
- `bunx vitest run`: **3,200 passed**, 372 files, zero failures. Last reported baseline **3,186 / 371** plus exactly **14 / 1** in the new CB93 file. Pre-existing failures: **none observed**.
- Final full-suite rerun after heading-fit adjustment: **3,200 passed / 372 files**, zero failures. Automatic preview build: **build OK**, 2026-10-26T14:06:35Z. Standalone typecheck not run because the environment reserves build/typechecking for its automatic checks.
- The fixed 30px HOLE header required a 0.9 horizontal text fit; nominal 9.5px type and the specified grid remain unchanged. This is a local fit adjustment, not a shared typography change.
- Controlled actual component at 438 × 970: hardest-first order, expanded hole, card-order switch and retained open hole verified; screenshots reviewed, no card overflow. Mock illustrative score/yardage values were not added to production data. The brief's 44px final column wins over the mock's 40px CSS.
- Live authenticated page/readback remains unverified: this project uses externally managed authentication, unavailable for automated session restoration.

## Protected scope
CB91/CB92 and other section output unchanged. No SQL, migrations or migration files, deployed RPC/edge changes, feed_config changes, round_pool_cap changes (30 retained), or native/Median changes.