# BIZ_ADDRESS_COUNTRY_FIRST

## Files
- src/features/business-create/Step2Other.tsx (~:186-245): Country card (step 1, testid kept `bizc-country-line`), listOnly CountrySelector (`bizc-country-picker`), Address Field (step 2, locked state opens the country list), lock line `bizc-country-first`, "Can't find it? Drop a pin" `bizc-cant-find`. Old .bizc-cline line and separate picker trigger removed.
- src/features/business-create/step2Bits.tsx: new `StepMark`; `Field` gains optional `marker`, `locked`, `onLockedTap`.
- src/features/business-create/business-create.css (~:64-79): .bizc-cline rules replaced by step/pick/lock/cant-find rules; .bizc-field sets panel inset vars. The stale `.bizc-cline button:focus-visible` selector on line 86 is now dead (left).
- src/components/business/CountrySelector.tsx: new optional `listOnly` (open, in-flow panel, no trigger). Default false, other consumers unchanged.
- src/components/business/AddressAutocomplete.tsx + new addressPanel.css: bare-only results and no-results panels; non-bare markup untouched; search logic untouched.
- Six profile.json files: new `businessCreate` block.

## Locale keys (every file): countryLabel, countryPlaceholder, addressPlaceholder, countryFirst, cantFind, dropPin

## Tests
Changed one assertion (authorised implicitly: the brief deletes the "Change" button) in src/test/bc2BusinessCreate.test.tsx, "Change opens the country picker and Drop a pin opens the pin sheet": `fireEvent.click(screen.getByText('Change'))` → `fireEvent.click(screen.getByTestId('bizc-country-line'))`. Same expectations.
Shards (sequential): 2,257 / 2,270 / 2,266 + 1 failed / 2,348 = 9,142 (unchanged vs 9,142).
STOP: shard 3 failed in untouched src/test/kindRails.test.tsx, "See all > opens /find-people?kind=pro and ?kind=creator":
`TestingLibraryElementError: Unable to find role="button" and name "See all, Pros to follow"` (body empty). Passes 3/3 alone. Awaiting ruling; test not edited.
Typecheck clean.

## Brief issues
- "ASCII only" for locales contradicts the locale-diacritics rule (de/es need proper accents) and cannot hold for ja/ko; used proper characters.
- "Reuse businessCreate.dropPin": no businessCreate keys existed in any locale file (all strings were defaultValue-only), so dropPin was added too.
- .bizc-field-label weight is 800 vs canon 700 — left as shipped, as instructed.
- Not checked on device/at 320 (sign-in needed); the Richmond results panel depends on live search.
