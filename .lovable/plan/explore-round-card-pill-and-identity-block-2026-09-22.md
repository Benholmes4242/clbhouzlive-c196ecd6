# Explore round card pill and identity block

## Scope
- Update the live non-pair Explore round-card pill and identity presentation only.
- Add the dedicated full play-date formatter requested in `exploreCopy.tsx` while leaving `relativeDay()` unchanged for reviews and existing callers.
- Update the six `courses.json` locales and focused round-card tests.
- Do not change callout selection, feat rarity calculations, pair cards, on-photo cards, SQL, RPCs, or handicap data.

## Implementation
1. **Restructure the achievement pill**
   - Keep the pill’s outer surface, radius, spacing, tier attributes, and no-callout behavior.
   - Replace the inner layout with icon plus one text column.
   - Stack `RARE` / `NEW` / `MOVED UP` above the label, then place the optional subline and existing rarity sentence beneath it on the same left edge.
   - Remove the obsolete wrapper and fixed 52px achievement height; allow sublines to wrap naturally.
   - Preserve the existing rare-versus-new tag precedence and `FeatRarityLines` behavior.

2. **Complete achievement copy**
   - Wire the already-present bogey-free subline.
   - Lengthen course-record and rank-up qualifier copy in all six locales.
   - Add localized `birdieRun` and pluralized `birdiesSub` keys inside `amateur.stream.callout` for all six locales.
   - Use “Birdie run” plus the count sentence only for a single birdies feat; preserve today’s joined label and no birdies subline for multi-feat rounds.
   - Avoid changing similarly named, unrelated `birdieRun` keys elsewhere in the locale files.

3. **Split the round identity into three lines**
   - Keep the avatar, name, figures, and reactions where they are.
   - Replace the combined course/date meta line with separate course and date elements.
   - Let only the course ellipsise; keep the date whole on its own line.
   - Remove `data-round-identity-meta` and update its two known test references to the new course/date hooks.

4. **Use a full play date and correct figure color**
   - Add `playDateFull()` beside the existing date helpers, using the browser locale and adding the year only for dates outside the current year.
   - Use it only for the non-pair round identity; keep `kickerDate` and review date behavior unchanged.
   - Remove the under-par color flag from NET only; retain it for VS HCP.

5. **Verification**
   - Extend focused tests for tag order/alignment structure, wrapped record copy, bogey-free copy, birdie single/multi-feat behavior, separate full date lines including prior-year output, no-callout behavior, pair-card preservation, and NET/VS HCP colors.
   - Validate all six locale files parse and supply the new keys.
   - Run focused Explore tests, the project test suite for baseline comparison, and TypeScript validation.
   - Verify mixed round cards at mobile width in the live preview when authenticated data is available; otherwise use deterministic rendered fixtures and report the limitation.

## Report-only findings
- `AchievementCalloutPanel` is an apparently unused older renderer in the same file; it will not be removed or refactored.
- Existing missing `tagRare` locale entries and untranslated dead-panel `netRecord` entries are outside this brief and will be reported, not swept.
