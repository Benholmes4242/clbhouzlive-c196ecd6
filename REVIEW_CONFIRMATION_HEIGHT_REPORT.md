# Receipt hero height correction

## Changed files
1. `src/features/review-v2/components/ReviewCourseHero.tsx`: optional className appended to rv2-photo; class-owned height omits inline height, default Step 1 retains inline 100%. Ownership noted in header.
2. `src/features/review-v2/components/ReviewReceipt.tsx`: supplies rv2-receipt-hero instead of the inline env() calculation.
3. `src/features/review-v2/components/reviewReceipt.css`: requested 196px-plus-safe-area class. A receipt-scoped version of the same rule also guards against Step 1's generic .rv2-photo rule loading later; browser fixture revealed that order otherwise collapses the block. No Step 1 CSS changes and no new negative tracking.
4. `src/test/reviewConfirmationRedesign.test.tsx`: only the explicitly authorised height assertion changed; all other assertions/case names preserved.
5. `roadmap.md`: correction and verification status.
6. `REVIEW_CONFIRMATION_HEIGHT_REPORT.md`: this report.

## Authorised assertion: old → new
Case: **receipt hero reuses the photo block but omits its reference line**.

Old:
```ts
expect(container.querySelector('[data-photo-header]')?.getAttribute('style')).toContain('196px');
```
New:
```ts
expect(container.querySelector('[data-photo-header]')).toHaveClass('rv2-receipt-hero');
expect(readFileSync('src/features/review-v2/components/reviewReceipt.css', 'utf8')).toContain('.rv2-receipt-hero { height: calc(env(safe-area-inset-top, 0px) + 196px); }');
```
Reason: jsdom drops env() in inline styles; stylesheet text and class verify the intended contract without altering visual height. Photo source and absent-reference assertions unchanged. No tests added, deleted or renamed in this correction. Step 1 files/tests unchanged.

## Tests and full-suite accounting
Targeted command, run before full shards and repeated after the CSS-order safeguard:
`bunx vitest run src/test/reviewConfirmationRedesign.test.tsx src/test/reviewReceiptAverageLine.test.tsx src/test/reviewStepOne.test.tsx src/test/courseRatingConsistency.test.ts --maxWorkers=2`

Both runs: **68/68, four files** (20 + 8 + 21 + 19). Final run at10:14:57 UTC after the safeguard.

Full scope commands:
- `bunx vitest run --maxWorkers=2 --shard=1/3`: 1,506/1,506, 156 files.
- `bunx vitest run --maxWorkers=2 --shard=2/3`: 1,378 passed, 1 failed, 1,379 executed, 156 files.
- `bunx vitest run --maxWorkers=2 --shard=3/3`: 1,694/1,694, 154 files.

Combined full execution: **4,578 passed / 1 failed / 4,579 total across 466 files**. These shards preceded the final CSS-order safeguard; targeted files were rerun after it, full shards were not rerun after the safeguard.

Last green 4,547/464 → review confirmation +20 in `reviewConfirmationRedesign.test.tsx`, one new file → ST4 +12 in `st4SettingsNotificationsFriends.test.tsx`, one new file → 4,579/466. This correction adds zero cases/files. Every delta reconciled; no removals. The earlier receipt-height failure is cleared.

Remaining pre-existing failure, unchanged:
`src/test/sheetTopV5.test.tsx:7:24`, **retained account vocabulary rules > no user-facing string in src says "Alerts"**:
`AssertionError: expected 'src/components/settings/SettingsNotif…' to be '' // Object.is equality`

The scan reports `src/components/settings/SettingsNotificationsCard.tsx:27`, the ST4-required Alerts label. No vocabulary assertion/source changes in this correction and no new test failures. Full green remains blocked by the separately recorded ST4 exception.

## Chromium at 390px
Isolated real-component sample fixture `/tmp/browser/review-height/check_height.py`, viewport390×855:
- Receipt photo block **196px**, measured safe area **0px**, no inline height; rv2-photo rv2-receipt-hero classes.
- Step 1 photo block and parent header **246px**, same safe area0; rv2-photo class and inline height100% unchanged.
- No page errors. Screenshots inspected: receipt-390.png and step1-390.png. A placeholder image was used for this geometry-only check, not a real course photo or signed-off visual comparison. The desktop Chromium safe area is zero; nonzero native safe-area rendering remains unverified, while both CSS rules retain env().

Latest automatic build10:14:46 UTC: build OK. Authenticated publish/readback unavailable with external_unmanaged and not claimed. No SQL, migrations, deployed RPC/edge changes, feed_config, round_pool_cap or native/Median changes.