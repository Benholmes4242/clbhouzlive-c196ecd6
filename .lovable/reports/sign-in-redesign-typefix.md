# Sign-in redesign — preview type correction

- Changed only `src/test/signInRedesign.test.tsx:18`: `initImmediate: false` → `initAsync: false`, the supported i18next option for the same synchronous provider setup.
- No assertions, case names, application source, or existing tests changed. No cases added/deleted/renamed/rewritten.
- Command: `bunx vitest run src/test/signInRedesign.test.tsx --maxWorkers=2 --reporter=json --outputFile=/tmp/sign-in-redesign/typefix.json`.
- Result: 13 executed / 13 passed / 0 failed.
- Fresh preview signal: `=== build 2026-11-15T08:00:08Z ===` / `build OK`.
- Inventory unchanged: expected 8,744 from last fully passing 8,731 + 13 sign-in cases. No full-suite rerun: the separate existing caret sweep stop remains at `src/test/ep51SearchAndCarets.test.tsx:32:23`, `AssertionError: expected [ Array(1) ] to deeply equal []`. Prior shard totals: 2,203/2,203; 2,116/2,116; 2,196/2,195, one failure; shard 4 unrun.
- `roadmap.md` records type correction while retaining the caret blocker. Original stop report remains historical and unchanged.
