# FIX — Pro live card scale + outstanding 320/390px checks

## Files changed
- `src/features/pro-profile/pro-profile.css` (live card ruling only):
  - `.pro-profile-live-score b`: 24px → 19px (weight 800 kept)
  - `.pro-profile-card h3`: 18px → 15px (weight 800, line-height 1.25 kept; applies to every card using it, as intended)
  - `.pro-profile-live-position small`: 13px → 12px
  - `.pro-profile-footnote`: 12px → 11.5px
  - `.pro-profile-live-position strong` kept at 40px; no letter-spacing added anywhere.
- Sheets (Ask, collection, sponsor): unchanged per ruling 2.
- `src/test/proProfileScale.test.tsx`: added one test — live score 19px/800, card h3 15px/800/1.25, position small 12px, footnote 11.5px, headline strong stays 40px.

## Updated assertions
None — no existing test pinned the live score at 24px or the card h3 at 18px (searched the whole suite). No tests deleted.

## Shards (fresh, --maxWorkers=2)
- Shard 1: 1,989 · Shard 2: 1,840 · Shard 3: 1,953 · Shard 4: 1,897
- Total: 7,679 tests / 672 files, zero failures. FW1 meta-line did not recur. Build: OK.

## 320px and 390px checks
Checked with Playwright against the running preview plus a fixture page loading the real `pro-profile.css` with long names. Document width equals viewport width everywhere; the only elements extending past the viewport edge sit inside horizontal scroll rails (`hide-scrollbar` / `scrollbar-hide`), which is by design. No overflow fixes were needed.

- Pro sections fixture (season tiles 4-across, result rows with long event names, live card, career timeline, In the bag, partners, Ask): 320px NONE, 390px NONE. Long event names ellipsis via `.pro-profile-event b`.
- Tour tab result rows: same `ProResultRow` markup as the fixture result rows — covered, NONE.
- Tour overview hero (/tourhub): 320px NONE (one button inside a scroll rail, by design), 390px NONE.
- Tournament detail hero (/tourhub/tournament/3d67be1e-…): 320px NONE, 390px NONE.
- Courses page hero (/courses): 320px NONE, 390px NONE (rail cards inside scroll rails, by design).

### Not checkable in this environment
This project's auth is external/unmanaged, so no browser session can be minted and signed-in surfaces redirect to /auth. Left for a signed-in device pass: course detail hero, golfer profile hero (long name next to Edit/···), business profile hero (long club name next to crest), pro profile hero (kicker + PRO badge), review wizard step 1, and the search overlay All view with the IN ACTION rail. The search overlay's changes are covered by `searchOrderAndFallback.test.tsx` (section order + fallback tokens), and the pro sections by the fixture above.
