# Flaky tests Nov 16 (test-only, no product code)

1. fixOverflowSource.test.ts — file list read once in beforeAll (`sourceFiles`), scan test timeout 60000. Assertions unchanged (scanned > 1000, violations []). Duration alone: before 3508ms (timed out at 15000ms under shard load), after 2660–3363ms.
2. kindRails.test.tsx "opens /find-people?kind=pro and ?kind=creator" — already used findByRole; now first waits (waitFor) for the `get_people_to_follow_by_kind` call for each kind, then findByRole with a 10000ms wait; test timeout 30000. Path assertions unchanged.

Repeat: fixOverflowSource 20/20, kindRails 20/20.
Suite: 2,284 / 2,199 / 2,236 / 2,281 = 9,000, delta 0, no failures.
