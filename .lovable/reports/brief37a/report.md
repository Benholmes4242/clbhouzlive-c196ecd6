# Brief 37A — closed

## Requested changes
- `LinkedProSections.tsx`: visitor button now reads `Follow <first name>'s round, shot by shot`; owner button reads `Follow your round, shot by shot`.
- `ProProfileBuildOne.tsx`: passes the existing Brief 37 `first` value to that button; full name is still passed unchanged to the scorecard. Optional first-name fallback preserves standalone callers.
- `ProAskSection.tsx`: invitation line now reads `Practice, kit, life on tour. <first name>'s answers show here.` The owner never sees the invitation; its heading, Ask button, and visibility rules are unchanged.
- No other presentation, behavior, data reads, SQL, migrations, deployment, feed_config or round_pool_cap changes. Cap remains 30.

## Remaining pronoun audit — unchanged
Command: `rg -n -i '\b(he|his|she|her)\b' src/features/pro-profile src/features/pro-verification`

No other user-facing pro pronouns were found. The remaining five matches are comments only:
- `src/features/pro-profile/ProAskSection.tsx:28`: `?ask=inbox opens his questions on Waiting`.
- `src/features/pro-profile/ProProfileBuildOne.tsx:4`: `and its hero cells exist only when he has events.`
- `src/features/pro-profile/pro-profile.css:163`: `what the viewer alone sees (own waiting question, his waiting count).`
- `src/features/pro-verification/ProfileTourTab.tsx:3`: `no tour link shows his recorded results grouped by year; with no results`.
- `src/features/pro-verification/useProResultsVisible.ts:2`: `gates his own rows; this rpc answers whether a viewer may see them`.

## Tests and authorized assertion update
Existing test modified: `src/test/proAskSection.test.tsx` — `on with nothing shows the invitation card`.
- Old: `expect(screen.getByText('Practice, kit, life on tour. His answers show here.')).toBeTruthy();`
- New: `expect(screen.getByText("Practice, kit, life on tour. Mason's answers show here.")).toBeTruthy();`
- Why: Brief 37A explicitly replaces that documented line. The heading, exactly-once section-title and Ask-button assertions are unchanged.

New cases:
1. `src/test/brief37aProPronouns.test.tsx` — `visitor uses the supplied first name without his`: asserts rendered button text equals `Follow Mason's round, shot by shot`, and `expect(button.textContent).not.toMatch(/\bhis\b/i)`.
2. Same file — `owner uses your without his`: asserts rendered button text equals `Follow your round, shot by shot`, and the same no-his assertion.
3. `src/test/proAskSection.test.tsx` — `Brief 37A invitation uses the supplied first name without his`: asserts rendered line equals `Practice, kit, life on tour. Mason's answers show here.`, and `expect(line?.textContent).not.toMatch(/\bhis\b/i)`.

No tests deleted or renamed. Only the one existing assertion above changed.

Focused command: `bunx vitest run src/test/brief37aProPronouns.test.tsx src/test/proAskSection.test.tsx` — 37/37 passed across 2 files.

## Four sequential shards
Each ran separately, in order, with command:
`bunx vitest run --shard=N/4 --reporter=default --reporter=json --outputFile=/tmp/brief37a/shard-N.json`
Full stdout/stderr: `/tmp/brief37a/shard-N.log` (sandbox-local).

| Shard | Passed / executed tests | Files | Failures |
| --- | ---: | ---: | ---: |
| 1 | 2,575 / 2,575 | 235 | 0 |
| 2 | 2,568 / 2,568 | 235 | 0 |
| 3 | 2,715 / 2,715 | 235 | 0 |
| 4 | 2,895 / 2,895 | 234 | 0 |
| Total | 10,753 / 10,753 | 939 | 0 |

Baseline: Brief 37 close-out 10,750 tests / 938 files. After: 10,753 / 939. Delta +3 tests / +1 file reconciles entirely to the two new live-card cases and one new invitation case named above; existing proAskSection count increases 34 → 35. Shard allocation is not a per-file test delta.

## Verification limits
Rendered visitor/owner button and invitation coverage passed, along with the entire suite. Preview diagnostics: `build OK` at 2026-11-26T13:04:01Z. No signed-in live profile readback or screenshot was taken for this copy-only request; these tests are not claimed as live-account evidence.
