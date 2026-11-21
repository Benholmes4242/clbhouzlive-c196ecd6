# Owner redesign preview correction

- Changed only `src/test/proOwnerRedesign.test.tsx:33–34`: removed `updated_at` from the Partner fixture and `sort`/`updated_at` from the CareerMoment fixture to match the generated row types.
- App code, test names, assertions and all other fixtures remain unchanged. No tests deleted, renamed or rewritten; this is a fixture-field correction only.
- Command: `bunx vitest run src/test/proOwnerRedesign.test.tsx src/test/proOwnerClubs.test.tsx`.
- Result: **22 executed / 22 passed across two files**, unchanged from the preceding focused run. Full output: `type-fix-focused.log`.
- Preview harness: `=== build 2026-11-21T10:45:36Z ===` followed by `build OK`; both reported TS2353 errors are cleared.
- Full-suite inventory before/after remains **9,445 / 847 files projected**, with no delta from this correction. Last verified full-suite passing total remains **9,411 / 844 files**; the intervening +12 prior-pro and +22 owner-redesign cases are reconciled in the original report.
- Four full-suite shards were not resumed by this preview-only correction. The six earlier counter/menu failures remain untouched; broader redesign regression and authenticated browser verification remain outstanding.