# Tour-pro season form and result rows — stopped verification

## Result
Implemented the signed-off form strip and shared result rows using existing event data. All 31 new Vitest cases pass. The first full-suite shard passes; the second has 18 failures across four existing test files. Stopped without repairing or rerunning tests; shards three and four were not run.

No SQL, migrations, feed_config, round_pool_cap changes, server writes, imports, deployments or new reads. Existing heading/source/four tiles/See all/ResultDetail and owner/visitor gating remain unchanged. ProfileTourTab already consumes ProResultRow and inherits its new presentation without changes to that tab.

## Files and line numbers
- `src/features/pro-profile/proProfileRules.ts:26–33`: shared `finishClass`, using `finishPosition`; labels remain unchanged.
- `src/features/pro-profile/ProSeasonSection.tsx:1–15,39`: local ownership comment, classified row chip, conditional points, OWGR sorted round strokes and all-years last-ten form buttons opening the existing detail sheet.
- `src/features/pro-profile/pro-profile.css:29–47,110–112`: finish/form geometry and states, ellipsis subline, points, tabular score and round-line styling. The form-button selector overrides default Button padding without changing shared buttons.
- `src/index.css:113–117`: semantic finish wash/ring tokens. Existing ink, dim, gold and green tokens reused.
- `src/test/proSeasonForm.test.tsx:1–93`: 31 new cases; no existing test modified, deleted, renamed or rewritten.
- `roadmap.md:3–5`: completed implementation and stopped verification.
- `.lovable/reports/pro-season-form/`: this report, full focused/shard outputs and isolated browser-check evidence.

Architecture decisions are documented in the existing module headers. Root AGENTS.md was left unchanged because its budget has only 25 bytes remaining and no cross-area rule changed.

## Mock preservation
The mock labels event names, scores, points and older finishes as placeholders; none became app data. Its frozen heading, source and season tiles were not adopted over existing data-dependent output. The mock's fallback `.fin` and `.sc` styles are unused in its signed-off changed rows; the new `.fc`/`.tot` presentation is implemented. App fonts continue to inherit; no mock font stack was copied.

## Verification commands and shard totals
| Exact command | Executed | Passed | Failed | Files |
|---|---:|---:|---:|---:|
| `bunx vitest run src/test/proSeasonForm.test.tsx` | 31 | 31 | 0 | 1 |
| `bunx vitest run --shard=1/4` | 2,315 | 2,315 | 0 | 212 passed |
| `bunx vitest run --shard=2/4` | 2,308 | 2,290 | 18 | 208 passed, 4 failed |
| `bunx vitest run --shard=3/4` | Not run | — | — | Stop rule |
| `bunx vitest run --shard=4/4` | Not run | — | — | Stop rule |

Executed shard scope: **4,623 / 4,605 passed / 18 failed**, 424 files. The focused 31 cases are separate and were not in the two executed shards. Full outputs are `focused.log`, `shard-1.log` and `shard-2.log`.

### Continuous baseline accounting
Latest verified full-suite baseline: **9,411 tests / 844 files**, with historical shards 2,311 / 2,292 / 2,346 / 2,462.

After the two preceding pro briefs, inventory was **9,445 / 847**, not a verified passing total: +12 fallback/menu/counter cases (+4 profileCoverFallback, +4 proProfileBuildOneB, +4 proProfileOwnerMenu), then +22 owner-redesign cases (+18 proOwnerRedesign, +4 proOwnerClubs). Their exact names are in the preceding reports. Fixture-only type corrections and the hero-font ruling changed no counts.

This brief adds **31 cases / one file**, all named below: **9,445 → 9,476 tests; 847 → 848 files**. No losses. Per-shard totals for the 9,445 intermediate inventory were never executed and are unavailable; historical 9,411 shard counts are not claimed as that baseline. New-file partitioning can redistribute files, so only the full-suite delta is attributed to the new 31 cases. No verified passing full-suite total is claimed.

## New tests by name — proSeasonForm.test.tsx (31)
### Season shared finish classification (8)
- MC is out
- WD is out
- DQ is out
- 1st is win
- T2 is top
- T10 is top
- T11 is made
- T28 is made

### Season last-ten form (7)
- caps at ten newest finished events across years using See all ordering
- hides with 0 finished events
- hides with 1 finished events
- hides with 2 finished events
- renders three populated chips without inventing seven events
- each chip class and aria-label use the shared finish rules
- a form chip opens ResultDetail for that event, including an older year

### Shared pro result row (16)
- MC row uses out finish chip
- WD row uses out finish chip
- DQ row uses out finish chip
- 1st row uses win finish chip
- T2 row uses top finish chip
- T10 row uses top finish chip
- T11 row uses made finish chip
- T28 row uses made finish chip
- OWGR rounds show total and 72 72 in round order, omitting null strokes
- OWGR without rounds shows only its total
- points 1.24 render 1.24 pts
- points 0.003 render <0.01 pts
- points null have no span
- points 0 have no span
- non-OWGR retains signed under-par and added tag with no rounds line
- ProfileTourTab inherits the same OWGR finish chip and round line

## 320px and result-opening evidence
`python3 /tmp/browser/pro-season-form/check_season.py` passed after correcting two isolated harness import errors (CommonJS default exports). No app source was changed for those apparatus errors. The browser then exposed overlapping form chips from default Button padding; the scoped selector was corrected before the full-suite shards. Final actual-component checks:

| Width | Chip width | Grid columns | Row/child overflow |
|---:|---:|---:|---|
| 320 | 25.1875px | 10 | None |
| 390 | 32.1875px | 10 | None |
| 1280 | 121.1875px | 10 | None |

Viewed final 320 screenshot: T28 fits, chips do not overlap, four-round `68 69 67 69` leaves a readable ellipsized event name. Tapping the named form chip opened ResultDetail with the matching full event heading. No page errors. The ten-column and overflow assertions live in the retained browser check, rather than jsdom styling assertions. Screenshots: season-320.png, season-390.png, season-1280.png, detail-320.png.

These are isolated actual-component checks using clearly synthetic inputs, not authenticated live-profile readback. Authenticated end-to-end checks are unavailable for this project's external_unmanaged authentication. Preview harness latest entry: `=== build 2026-11-21T10:58:48Z ===` / `build OK`.

## STOP — exact errors and locations
The complete tool output is retained unchanged in `shard-2.log`; the next section lists each failing case with its error and location. All four failing files were untouched by this request. The six earlier counter/menu failures recur; eleven collection/name-weight cases encode the preceding owner redesign, and the OWGR-row case counts a new rounds span. These observations do not authorize rewriting any assertion.

Further verification is blocked on explicit rulings for these existing tests; no app or test repairs were made after the shard-two stop.
### src/test/allHeroesMatch.test.tsx > ALL_HEROES_MATCH pro profile shell > the pro name is 26px at normal spacing and the club line is gone

```text
AssertionError: expected '.pro-profile { color:var(--pro-profil…' to contain '.pro-hero-name { margin:0; font-size:…'
src/test/allHeroesMatch.test.tsx:147:17
```

### src/test/proCollectionSections.test.tsx > pro collections — visitor and own views > own empty view shows the three add cards with signed-off subs

```text
TestingLibraryElementError: Unable to find an element with the text: Driver to ball. Brands on clbhouz link to their page.. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.
src/test/proCollectionSections.test.tsx:90:25
```

### src/test/proCollectionSections.test.tsx > pro collections — visitor and own views > own empty bag has no Edit in its header and shows the add card

```text
AssertionError: expected null not to be null
src/test/proCollectionSections.test.tsx:101:79
```

### src/test/proCollectionSections.test.tsx > pro collections — visitor and own views > own empty partners has no Edit in its header and shows the add card

```text
AssertionError: expected null not to be null
src/test/proCollectionSections.test.tsx:113:84
```

### src/test/proCollectionSections.test.tsx > pro collections — sheet flows > Add by name adds the scheme and saves the website with the name

```text
TestingLibraryElementError: Unable to find an element with the text: Sponsors and brands you work with. Partners on clbhouz show their logo and link to their page.. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.
src/test/proCollectionSections.test.tsx:168:11
```

### src/test/proCollectionSections.test.tsx > pro collections — sheet flows > an invalid website toasts and does not save

```text
TestingLibraryElementError: Unable to find an element with the text: Sponsors and brands you work with. Partners on clbhouz show their logo and link to their page.. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.
src/test/proCollectionSections.test.tsx:178:11
```

### src/test/proCollectionSections.test.tsx > pro collections — sheet flows > bag: slot is required, brand search links business_id, editing the brand clears it

```text
TestingLibraryElementError: Unable to find an element with the text: Driver to ball. Brands on clbhouz link to their page.. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.
src/test/proCollectionSections.test.tsx:188:11
```

### src/test/proCollectionSections.test.tsx > pro collections — sheet flows > bag: typing after a match clears business_id

```text
TestingLibraryElementError: Unable to find an element with the text: Driver to ball. Brands on clbhouz link to their page.. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.
src/test/proCollectionSections.test.tsx:201:11
```

### src/test/proCollectionSections.test.tsx > pro collections — sheet flows > cap error from the server shows as a toast

```text
TestingLibraryElementError: Unable to find an element with the text: Driver to ball. Brands on clbhouz link to their page.. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.
src/test/proCollectionSections.test.tsx:212:11
```

### src/test/proCollectionSections.test.tsx > pro collections — sheet flows > partners: Add links a business, Added for existing, Add by name stores no business

```text
TestingLibraryElementError: Unable to find an element with the text: Sponsors and brands you work with. Partners on clbhouz show their logo and link to their page.. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.
src/test/proCollectionSections.test.tsx:221:11
```

### src/test/proCollectionSections.test.tsx > pro collections — sheet flows > career: save with the win switch, then edit and remove

```text
TypeError: Expected container to be an Element, a Document or a DocumentFragment but got null.
src/test/proCollectionSections.test.tsx:244:5
```

### src/test/proProfileBuildOneB.test.tsx > Pro profile build 1b mounted > OWGR row ignores dormant course par and stored to-par

```text
AssertionError: expected <b class="pro-profile-gross"></b>
…(1) to have a length of 1 but got 2
src/test/proProfileBuildOneB.test.tsx:42:452
```

### src/test/proProfileBuildOneB.test.tsx > Tour-pro hero fallback and compact counters > four counter labels use compact tracking

```text
AssertionError: expected …(5) to have a length of 4 but got 5
src/test/proProfileBuildOneB.test.tsx:53:269
```

### src/test/proProfileBuildOneB.test.tsx > Tour-pro hero fallback and compact counters > two counter labels keep default tracking

```text
AssertionError: expected …(3) to have a length of 2 but got 3
src/test/proProfileBuildOneB.test.tsx:54:237
```

### src/test/proProfileOwnerMenu.test.tsx > Tour-pro owner menu > owner business none keeps ordered account actions and no moderation

```text
TestingLibraryElementError: Unable to find role="menuitem"
src/test/proProfileOwnerMenu.test.tsx:95:32
```

### src/test/proProfileOwnerMenu.test.tsx > Tour-pro owner menu > owner business slug keeps ordered account actions and no moderation

```text
TestingLibraryElementError: Unable to find role="menuitem"
src/test/proProfileOwnerMenu.test.tsx:95:32
```

### src/test/proProfileOwnerMenu.test.tsx > Tour-pro owner menu > owner business id keeps ordered account actions and no moderation

```text
TestingLibraryElementError: Unable to find role="menuitem"
src/test/proProfileOwnerMenu.test.tsx:95:32
```

### src/test/proProfileOwnerMenu.test.tsx > Tour-pro owner menu > visitor keeps Copy link Report and Block without owner actions

```text
TestingLibraryElementError: Unable to find role="menuitem"
src/test/proProfileOwnerMenu.test.tsx:118:25
```
