# Pro profile build 2 — hide Edit on empty sections

## Change (production, 2 lines, `src/features/pro-profile/ProCollectionSections.tsx`)

- Bag header: `header('IN THE BAG','bag')` → `header('IN THE BAG','bag',bag.length>0)`
- Partners header: `header('PARTNERS','partners')` → `header('PARTNERS','partners',partners.length>0)`

`header` already takes `editable` and renders `Edit` only when `canEdit && editable`, so an
empty bag or partners section now shows just the title plus its dashed add card, matching the
signed-off mock. Career was already gated on `moments.length>0` and is untouched. No other
production change; no SQL, no migrations.

## Tests (`src/test/proCollectionSections.test.tsx`, 4 added, none changed or deleted)

1. `own empty bag has no Edit in its header and shows the add card` — empty bag with partners
   and career filled: `[data-pro-bag] .pro-collection-edit` is null, `[data-pro-bag] .pro-profile-add`
   is present.
2. `own bag with one item shows Edit` — `[data-pro-bag] .pro-collection-edit` is present.
3. `own empty partners has no Edit in its header and shows the add card` — empty partners with
   bag and career filled: `[data-pro-partners] .pro-collection-edit` is null, add card present.
4. `own partners with one item shows Edit` — `[data-pro-partners] .pro-collection-edit` is present.

Existing assertions untouched, including `own filled view shows Edit on each section` (3 Edits)
and the guest/visitor cases.

## Runs

- Focused: `bunx vitest run src/test/proCollectionSections.test.tsx --maxWorkers=2` → 16 passed (16).
- Shard 1: 1,889 passed / 161 files, 0 failures.
- Shard 2: 1,765 passed / 161 files, 0 failures.
- Shard 3: 1,876 passed / 161 files, 0 failures.
- Shard 4: 1,777 passed / 160 files, 0 failures.
- Total: 7,307 tests / 643 files, zero failures.

Baseline before this change was 7,303 / 643. The +4 is exactly the four new tests, all of which
landed in shard 2 (1,761 → 1,765); every other shard is unchanged. The three known FS_NOTCH
failures did not recur.

## Not verified

The owner's view on a real device: sign-in for this project is external/unmanaged, so no
session can be minted here. The four cases above are mounted jsdom checks on the rendered
headers.
