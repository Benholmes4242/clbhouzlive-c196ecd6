# Canonical headings — Brief 17

## Implementation and continuation

Tournament section heads reuse CanonSectionHead via TournamentSectionHead; shared font and frozen overview board remain unchanged. MeasuredTournamentHead checks full titles after layout, observes width, and rechecks on font readiness/loading. The Moments records candidate is measured separately before the final plain-total form. Pure choices switch only above two measured lines. Overview shared-lead titles are untouched. No SQL, migrations, feed_config, pool-cap changes or new server reads.

- Shared lead: full names → **Two share the lead**; no new line beneath.
- Unfolding pair: full names → **Two level after {n} rounds**; fallback retains the existing opening bold sentence.
- Moments: course record(s) → record(s) → total **so far** (live) / **this week** (completed). Empty Moments still hides; original emptyShort/emptyBody stay.

## Stops and retained differences

- tourSheetHeadingCanon.test.tsx:79–82 retargeted to [data-tv-section="field"] [data-tv-head-eyebrow] (ruled)
- Unfolding fallback opening now names the pair via tiedTopNames (ruled)

### Test edits

- `src/test/tourSheetHeadingCanon.test.tsx:79–82` — old: `container.querySelector<HTMLElement>('.tv-head h2')` → new: `container.querySelector<HTMLElement>('[data-tv-section="field"] [data-tv-head-eyebrow]')`

## Test commands and counts

Accepted baseline: **10,316 tests /896 files**. Final run: **10,434 tests /899 files** — **+118 tests, +3 files**. Reconciliation: initial Brief 17 inventory +94 (83 rule cases and +11 render cases); Ben’s zero-Moments ruling removed two newly introduced cases (not accepted-baseline tests): the zero-title rule expecting “No moments yet” and the empty-Moments rendering expecting that title, both removed because Moments must remain hidden; the measured-fallback continuation added 26 cases (20 rule cases and 6 rendering cases, every one named in the reconciliation list below). 94 − 2 + 26 = 118. Three new files collect **102 + 10 + 6 = 118** cases. No accepted-baseline case, name or assertion edited beyond the ruled tourSheetHeadingCanon retarget above.

Commands executed separately and sequentially:
```text
bunx vitest run --shard=1/4 --maxWorkers=2 --minWorkers=2 --reporter=verbose
bunx vitest run --shard=2/4 --maxWorkers=2 --minWorkers=2 --reporter=verbose
bunx vitest run --shard=3/4 --maxWorkers=2 --minWorkers=2 --reporter=verbose
bunx vitest run --shard=4/4 --maxWorkers=2 --minWorkers=2 --reporter=verbose
```
| Shard | Result | Files |
|---|---|---|
| 1 | 2,500 passed /2,500 |225|
| 2 | 2,493 passed /2,493 |225|
| 3 | 2,607 passed /2,607 |225|
| 4 | 2,834 passed /2,834 |224|
| **Total** | **10,434 passed /10,434** |**899**|

Raw logs/inventory/browser JSON stay in /tmp, outside the repository. Latest automatic preview signal after fixture removal: **build OK**, 2026-11-24T07:09:53Z.

## Captures and line measurements

Disposable real-section fixture, before from accepted `7bb17ab8ec`, after from the final implementation. Seeded query caches only; zero live reads or browser errors. All temporary HTML/TSX/modules removed. Chromium fixture evidence, not physical-iPhone or hosted-live-data verification. Full pages and section crops at 390/320, plus Friday tees crops, are enumerated below.

**Final after titles: all ≤2 lines at 320 and 390; no title overflow or page overflow.** Browser width sequence 320→390→320 restored the full shared-lead and unfolding forms at 390 and short forms at 320. Font loadingdone rechecks retained correct short forms; no browser errors. The long-course-record title becomes “Seven moments, two records”, two lines at 320.

| Fixture / after title | After 390 | After 320 |
|---|---:|---:|
| live-main / Four within three of the lead |1|2|
| live-main / Scott is T4, three shots back |1|1|
| live-main / Lee has led after every round |1|1|
| live-main / 36 groups, all off the 1st |1|1|
| live-main / 38 players under par today |1|1|
| live-main / The 17th is playing hardest |1|1|
| live-main / Seven moments, two eagles |2|2|
| upcoming-main / 20 groups, off the 1st and 10th |2|2|
| upcoming-main / 18 of the top 50, 19 of the top 100 |1|2|
| upcoming-main / Par 72, 7,449 yards |1|1|
| upcoming-fri / 24 groups, off the 1st and 10th |2|2|
| upcoming-fri / 18 of the top 50, 19 of the top 100 |1|2|
| upcoming-fri / Par 72, 7,449 yards |1|1|
| completed-main / Smith second, one back |1|2|
| completed-main / 38 players finished under par |1|1|
| completed-main / The 17th played hardest |1|1|
| completed-main / Seven moments, two eagles |2|2|
| live-long / Christiansen and Featherstone share the lead → Two share the lead |2|1|
| live-long / Scott is T4, three shots back |1|1|
| live-long / Christiansen and Featherstone level after three rounds → Two level after three rounds (re-taken after the tiedTopNames ruling; fallback opening reads “Christiansen and Featherstone are tied at the top.”) |2|1|
| live-long / 36 groups, all off the 1st |1|1|
| live-long / 38 players under par today |1|1|
| live-long / The 17th is playing hardest |1|1|
| live-long / Seven moments, two eagles |2|2|
| upcoming-field-none / 20 groups, off the 1st and 10th |2|2|
| upcoming-field-none / None of the top 50, nine of the top 100 |2|2|
| upcoming-field-none / Par 72, 7,449 yards |1|1|
| live-eagles / Four within three of the lead |1|2|
| live-eagles / Scott is T4, three shots back |1|1|
| live-eagles / Lee has led after every round |1|1|
| live-eagles / 36 groups, all off the 1st |1|1|
| live-eagles / 38 players under par today |1|1|
| live-eagles / The 17th is playing hardest |1|1|
| live-eagles / Three eagles so far |1|1|
| live-records / Four within three of the lead |1|2|
| live-records / Scott is T4, three shots back |1|1|
| live-records / Lee has led after every round |1|1|
| live-records / 36 groups, all off the 1st |1|1|
| live-records / 38 players under par today |1|1|
| live-records / The 17th is playing hardest |1|1|
| live-records / Seven moments, two course records → Seven moments, two records |2|2|

### Before titles (legacy unchanged heads)

| Fixture / before title | Before 390 | Before 320 |
|---|---:|---:|
|live-main / LEADERBOARD|1|1|
|live-main / HOW IT'S UNFOLDING|1|2|
|live-main / THURSDAY'S TEE TIMES|1|1|
|live-main / ROUND 3|1|1|
|live-main / THE COURSE|1|1|
|upcoming-main / TEE TIMES|1|1|
|upcoming-main / THE FIELD|1|1|
|upcoming-main / THE COURSE|1|1|
|upcoming-fri / TEE TIMES|1|1|
|upcoming-fri / THE FIELD|1|1|
|upcoming-fri / THE COURSE|1|1|
|completed-main / FINAL LEADERBOARD|1|1|
|completed-main / THE WEEK IN NUMBERS|1|1|
|completed-main / THE COURSE|1|1|
|live-long / LEADERBOARD|1|1|
|live-long / HOW IT'S UNFOLDING|1|2|
|live-long / THURSDAY'S TEE TIMES|1|1|
|live-long / ROUND 3|1|1|
|live-long / THE COURSE|1|1|
|upcoming-field-none / TEE TIMES|1|1|
|upcoming-field-none / THE FIELD|1|1|
|upcoming-field-none / THE COURSE|1|1|
|live-eagles / LEADERBOARD|1|1|
|live-eagles / HOW IT'S UNFOLDING|1|2|
|live-eagles / THURSDAY'S TEE TIMES|1|1|
|live-eagles / ROUND 3|1|1|
|live-eagles / THE COURSE|1|1|
|live-records / LEADERBOARD|1|1|
|live-records / HOW IT'S UNFOLDING|1|2|
|live-records / THURSDAY'S TEE TIMES|1|1|
|live-records / ROUND 3|1|1|
|live-records / THE COURSE|1|1|

### Fallback-specific 320 line table

| Candidate | Before fallback | Final title | Final lines |
|---|---:|---|---:|
|Christiansen and Featherstone share the lead|3|Two share the lead|1|
|Christiansen and Featherstone level after three rounds|3|Two level after three rounds|1|
|Seven moments, two course records|3|Seven moments, two records|2|

The final plain-total branch is covered by the new stubbed-measurement rendering case; none of the natural 320 fixtures needs it. Singular short wording and all pure choices at 1/2/3 lines are in the case inventory below.

### Capture files

- `captures/after-completed-main-320-section-0.png`
- `captures/after-completed-main-320-section-1.png`
- `captures/after-completed-main-320-section-2.png`
- `captures/after-completed-main-320-section-3.png`
- `captures/after-completed-main-320.png`
- `captures/after-completed-main-390-section-0.png`
- `captures/after-completed-main-390-section-1.png`
- `captures/after-completed-main-390-section-2.png`
- `captures/after-completed-main-390-section-3.png`
- `captures/after-completed-main-390.png`
- `captures/after-live-eagles-320-section-0.png`
- `captures/after-live-eagles-320-section-1.png`
- `captures/after-live-eagles-320-section-2.png`
- `captures/after-live-eagles-320-section-3.png`
- `captures/after-live-eagles-320-section-4.png`
- `captures/after-live-eagles-320-section-5.png`
- `captures/after-live-eagles-320-section-6.png`
- `captures/after-live-eagles-320.png`
- `captures/after-live-eagles-390-section-0.png`
- `captures/after-live-eagles-390-section-1.png`
- `captures/after-live-eagles-390-section-2.png`
- `captures/after-live-eagles-390-section-3.png`
- `captures/after-live-eagles-390-section-4.png`
- `captures/after-live-eagles-390-section-5.png`
- `captures/after-live-eagles-390-section-6.png`
- `captures/after-live-eagles-390.png`
- `captures/after-live-long-320-section-0.png`
- `captures/after-live-long-320-section-1.png`
- `captures/after-live-long-320-section-2.png`
- `captures/after-live-long-320-section-3.png`
- `captures/after-live-long-320-section-4.png`
- `captures/after-live-long-320-section-5.png`
- `captures/after-live-long-320-section-6.png`
- `captures/after-live-long-320.png`
- `captures/after-live-long-390-section-0.png`
- `captures/after-live-long-390-section-1.png`
- `captures/after-live-long-390-section-2.png`
- `captures/after-live-long-390-section-3.png`
- `captures/after-live-long-390-section-4.png`
- `captures/after-live-long-390-section-5.png`
- `captures/after-live-long-390-section-6.png`
- `captures/after-live-long-390.png`
- `captures/after-live-main-320-section-0.png`
- `captures/after-live-main-320-section-1.png`
- `captures/after-live-main-320-section-2.png`
- `captures/after-live-main-320-section-3.png`
- `captures/after-live-main-320-section-4.png`
- `captures/after-live-main-320-section-5.png`
- `captures/after-live-main-320-section-6.png`
- `captures/after-live-main-320.png`
- `captures/after-live-main-390-section-0.png`
- `captures/after-live-main-390-section-1.png`
- `captures/after-live-main-390-section-2.png`
- `captures/after-live-main-390-section-3.png`
- `captures/after-live-main-390-section-4.png`
- `captures/after-live-main-390-section-5.png`
- `captures/after-live-main-390-section-6.png`
- `captures/after-live-main-390.png`
- `captures/after-live-records-320-section-0.png`
- `captures/after-live-records-320-section-1.png`
- `captures/after-live-records-320-section-2.png`
- `captures/after-live-records-320-section-3.png`
- `captures/after-live-records-320-section-4.png`
- `captures/after-live-records-320-section-5.png`
- `captures/after-live-records-320-section-6.png`
- `captures/after-live-records-320.png`
- `captures/after-live-records-390-section-0.png`
- `captures/after-live-records-390-section-1.png`
- `captures/after-live-records-390-section-2.png`
- `captures/after-live-records-390-section-3.png`
- `captures/after-live-records-390-section-4.png`
- `captures/after-live-records-390-section-5.png`
- `captures/after-live-records-390-section-6.png`
- `captures/after-live-records-390.png`
- `captures/after-upcoming-field-none-320-section-0.png`
- `captures/after-upcoming-field-none-320-section-1.png`
- `captures/after-upcoming-field-none-320-section-2.png`
- `captures/after-upcoming-field-none-320.png`
- `captures/after-upcoming-field-none-390-section-0.png`
- `captures/after-upcoming-field-none-390-section-1.png`
- `captures/after-upcoming-field-none-390-section-2.png`
- `captures/after-upcoming-field-none-390.png`
- `captures/after-upcoming-fri-320.png`
- `captures/after-upcoming-fri-390.png`
- `captures/after-upcoming-fri-tees-320.png`
- `captures/after-upcoming-fri-tees-390.png`
- `captures/after-upcoming-main-320-section-0.png`
- `captures/after-upcoming-main-320-section-1.png`
- `captures/after-upcoming-main-320-section-2.png`
- `captures/after-upcoming-main-320.png`
- `captures/after-upcoming-main-390-section-0.png`
- `captures/after-upcoming-main-390-section-1.png`
- `captures/after-upcoming-main-390-section-2.png`
- `captures/after-upcoming-main-390.png`
- `captures/before-completed-main-320-section-0.png`
- `captures/before-completed-main-320-section-1.png`
- `captures/before-completed-main-320-section-2.png`
- `captures/before-completed-main-320-section-3.png`
- `captures/before-completed-main-320.png`
- `captures/before-completed-main-390-section-0.png`
- `captures/before-completed-main-390-section-1.png`
- `captures/before-completed-main-390-section-2.png`
- `captures/before-completed-main-390-section-3.png`
- `captures/before-completed-main-390.png`
- `captures/before-live-eagles-320-section-0.png`
- `captures/before-live-eagles-320-section-1.png`
- `captures/before-live-eagles-320-section-2.png`
- `captures/before-live-eagles-320-section-3.png`
- `captures/before-live-eagles-320-section-4.png`
- `captures/before-live-eagles-320-section-5.png`
- `captures/before-live-eagles-320-section-6.png`
- `captures/before-live-eagles-320.png`
- `captures/before-live-eagles-390-section-0.png`
- `captures/before-live-eagles-390-section-1.png`
- `captures/before-live-eagles-390-section-2.png`
- `captures/before-live-eagles-390-section-3.png`
- `captures/before-live-eagles-390-section-4.png`
- `captures/before-live-eagles-390-section-5.png`
- `captures/before-live-eagles-390-section-6.png`
- `captures/before-live-eagles-390.png`
- `captures/before-live-long-320-section-0.png`
- `captures/before-live-long-320-section-1.png`
- `captures/before-live-long-320-section-2.png`
- `captures/before-live-long-320-section-3.png`
- `captures/before-live-long-320-section-4.png`
- `captures/before-live-long-320-section-5.png`
- `captures/before-live-long-320-section-6.png`
- `captures/before-live-long-320.png`
- `captures/before-live-long-390-section-0.png`
- `captures/before-live-long-390-section-1.png`
- `captures/before-live-long-390-section-2.png`
- `captures/before-live-long-390-section-3.png`
- `captures/before-live-long-390-section-4.png`
- `captures/before-live-long-390-section-5.png`
- `captures/before-live-long-390-section-6.png`
- `captures/before-live-long-390.png`
- `captures/before-live-main-320-section-0.png`
- `captures/before-live-main-320-section-1.png`
- `captures/before-live-main-320-section-2.png`
- `captures/before-live-main-320-section-3.png`
- `captures/before-live-main-320-section-4.png`
- `captures/before-live-main-320-section-5.png`
- `captures/before-live-main-320-section-6.png`
- `captures/before-live-main-320.png`
- `captures/before-live-main-390-section-0.png`
- `captures/before-live-main-390-section-1.png`
- `captures/before-live-main-390-section-2.png`
- `captures/before-live-main-390-section-3.png`
- `captures/before-live-main-390-section-4.png`
- `captures/before-live-main-390-section-5.png`
- `captures/before-live-main-390-section-6.png`
- `captures/before-live-main-390.png`
- `captures/before-live-records-320-section-0.png`
- `captures/before-live-records-320-section-1.png`
- `captures/before-live-records-320-section-2.png`
- `captures/before-live-records-320-section-3.png`
- `captures/before-live-records-320-section-4.png`
- `captures/before-live-records-320-section-5.png`
- `captures/before-live-records-320-section-6.png`
- `captures/before-live-records-320.png`
- `captures/before-live-records-390-section-0.png`
- `captures/before-live-records-390-section-1.png`
- `captures/before-live-records-390-section-2.png`
- `captures/before-live-records-390-section-3.png`
- `captures/before-live-records-390-section-4.png`
- `captures/before-live-records-390-section-5.png`
- `captures/before-live-records-390-section-6.png`
- `captures/before-live-records-390.png`
- `captures/before-upcoming-field-none-320-section-0.png`
- `captures/before-upcoming-field-none-320-section-1.png`
- `captures/before-upcoming-field-none-320-section-2.png`
- `captures/before-upcoming-field-none-320.png`
- `captures/before-upcoming-field-none-390-section-0.png`
- `captures/before-upcoming-field-none-390-section-1.png`
- `captures/before-upcoming-field-none-390-section-2.png`
- `captures/before-upcoming-field-none-390.png`
- `captures/before-upcoming-fri-320.png`
- `captures/before-upcoming-fri-390.png`
- `captures/before-upcoming-fri-tees-320.png`
- `captures/before-upcoming-fri-tees-390.png`
- `captures/before-upcoming-main-320-section-0.png`
- `captures/before-upcoming-main-320-section-1.png`
- `captures/before-upcoming-main-320-section-2.png`
- `captures/before-upcoming-main-320.png`
- `captures/before-upcoming-main-390-section-0.png`
- `captures/before-upcoming-main-390-section-1.png`
- `captures/before-upcoming-main-390-section-2.png`
- `captures/before-upcoming-main-390.png`

## Locale keys

The tournamentHead subtree below is present in each of en, en-XA, de, es, ja and ko. The new Brief 17 keys currently retain English wording in all six locales; these are fallback copies, not reviewed translations. Original unrelated locale keys stay.

```json
{
  "board": {
    "sharedTwo": "Two share the lead"
  },
  "oneLower": "one",
  "fullBoard": "Full board",
  "race": {
    "levelCount_one": "Two level after one round",
    "levelCount_other": "Two level after {{rounds}} rounds",
    "levelTwo_one": "{{a}} and {{b}} level after one round",
    "levelTwo_other": "{{a}} and {{b}} level after {{rounds}} rounds",
    "levelMany_one": "{{leaders}} level after one round",
    "levelMany_other": "{{leaders}} level after {{rounds}} rounds",
    "every": "{{name}} has led after every round",
    "firstRound": "{{name}} in front after round one",
    "firstLead": "{{name}} leads for the first time",
    "since": "{{name}} has led since round {{round}}"
  },
  "numbers": {
    "eyebrow": "THE DAY IN NUMBERS · ROUND {{round}}",
    "today_one": "One player under par today",
    "today_other": "{{words}} players under par today",
    "today_zero": "Nobody under par today",
    "round_one": "One player under par in round {{round}}",
    "round_other": "{{words}} players under par in round {{round}}",
    "round_zero": "Nobody under par in round {{round}}",
    "finished_one": "One player finished under par",
    "finished_other": "{{words}} players finished under par",
    "finished_zero": "Nobody finished under par"
  },
  "course": {
    "eyebrow": "THE COURSE · {{state}}",
    "playing": "The {{hole}} is playing hardest",
    "played": "The {{hole}} played hardest",
    "soFarAmount": "So far, {{amount}} over par. ",
    "amount": "{{amount}} over par. "
  },
  "field": {
    "ranked_one": "One of the top 50, {{top100}} of the top 100",
    "ranked_other": "{{words}} of the top 50, {{top100}} of the top 100",
    "noFifty": "None of the top 50, {{top100}} of the top 100",
    "none": "No top-100 players this week"
  },
  "moments": {
    "soFar": "so far",
    "thisWeek": "this week",
    "plain_one": "One moment {{suffix}}",
    "plain_other": "{{words}} moments {{suffix}}",
    "allKind_one": "One {{kind}} {{suffix}}",
    "allKind_other": "{{words}} {{kind}} {{suffix}}",
    "mixed_one": "One moment, {{quantity}} {{kind}}",
    "mixed_other": "{{words}} moments, {{quantity}} {{kind}}",
    "kinds": {
      "recordShort_one": "record",
      "recordShort_other": "records",
      "ace_one": "ace",
      "ace_other": "aces",
      "albatross_one": "albatross",
      "albatross_other": "albatrosses",
      "record_one": "course record",
      "record_other": "course records",
      "comeback_one": "comeback",
      "comeback_other": "comebacks",
      "playoff_one": "playoff",
      "playoff_other": "playoffs",
      "eagle_one": "eagle",
      "eagle_other": "eagles",
      "streak_one": "streak",
      "streak_other": "streaks",
      "milestone_one": "milestone",
      "milestone_other": "milestones"
    }
  }
}
```

## Added-case reconciliation by name

- `src/test/tournamentHeadRules.test.ts`: Brief 17 shared hero title fixtures > Four within three of the lead
- `src/test/tournamentHeadRules.test.ts`: Brief 17 shared hero title fixtures > Scott is T4, three shots back
- `src/test/tournamentHeadRules.test.ts`: Brief 17 shared hero title fixtures > live picks leads
- `src/test/tournamentHeadRules.test.ts`: Brief 17 shared hero title fixtures > live picks level
- `src/test/tournamentHeadRules.test.ts`: Brief 17 shared hero title fixtures > no intro uses first pick tee
- `src/test/tournamentHeadRules.test.ts`: Brief 17 shared hero title fixtures > no intro or tee uses counted fallback
- `src/test/tournamentHeadRules.test.ts`: Brief 17 shared hero title fixtures > picks eyebrow live
- `src/test/tournamentHeadRules.test.ts`: Brief 17 shared hero title fixtures > picks eyebrow final
- `src/test/tournamentHeadRules.test.ts`: Brief 17 shared hero title fixtures > picks eyebrow suspended
- `src/test/tournamentHeadRules.test.ts`: Brief 17 shared hero title fixtures > picks eyebrow between
- `src/test/tournamentHeadRules.test.ts`: Brief 17 shared hero title fixtures > picks eyebrow beforeTee
- `src/test/tournamentHeadRules.test.ts`: Brief 17 shared hero title fixtures > delayed picks never show live dot
- `src/test/tournamentHeadRules.test.ts`: Brief 17 shared hero title fixtures > 36 groups, all off the 1st
- `src/test/tournamentHeadRules.test.ts`: Brief 17 shared hero title fixtures > 20 groups, off the 1st and 10th
- `src/test/tournamentHeadRules.test.ts`: Brief 17 shared hero title fixtures > Par 72, 7,449 yards
- `src/test/tournamentHeadRules.test.ts`: board head > final runner-up two back
- `src/test/tournamentHeadRules.test.ts`: board head > final playoff uses runner-up rule
- `src/test/tournamentHeadRules.test.ts`: board head > missing champion does not invent runner-up
- `src/test/tournamentHeadRules.test.ts`: board head > live delegates active scoring rows
- `src/test/tournamentHeadRules.test.ts`: board head > round live condition inprogress
- `src/test/tournamentHeadRules.test.ts`: board head > round live condition complete
- `src/test/tournamentHeadRules.test.ts`: board head > round live condition closed
- `src/test/tournamentHeadRules.test.ts`: board head > round live condition scheduled
- `src/test/tournamentHeadRules.test.ts`: board head > round live condition suspended
- `src/test/tournamentHeadRules.test.ts`: unfolding round-leader history > Lee has led after every round
- `src/test/tournamentHeadRules.test.ts`: unfolding round-leader history > two leaders -5
- `src/test/tournamentHeadRules.test.ts`: unfolding round-leader history > two leaders -5,-4
- `src/test/tournamentHeadRules.test.ts`: unfolding round-leader history > three leaders -5
- `src/test/tournamentHeadRules.test.ts`: unfolding round-leader history > three leaders -5,-4
- `src/test/tournamentHeadRules.test.ts`: unfolding round-leader history > one round sole leader
- `src/test/tournamentHeadRules.test.ts`: unfolding round-leader history > takes first lead in latest round
- `src/test/tournamentHeadRules.test.ts`: unfolding round-leader history > sole lead begins in round two
- `src/test/tournamentHeadRules.test.ts`: unfolding round-leader history > a tied middle round breaks sole-leader run
- `src/test/tournamentHeadRules.test.ts`: unfolding round-leader history > missing histories yield no invented head
- `src/test/tournamentHeadRules.test.ts`: unfolding round-leader history > drops bold opening and trims next part only
- `src/test/tournamentHeadRules.test.ts`: unfolding round-leader history > retains non-bold opening
- `src/test/tournamentHeadRules.test.ts`: unfolding round-leader history > completed narrative unchanged
- `src/test/tournamentHeadRules.test.ts`: day and week counts > 38 players under par today
- `src/test/tournamentHeadRules.test.ts`: day and week counts > today count 0
- `src/test/tournamentHeadRules.test.ts`: day and week counts > today count 1
- `src/test/tournamentHeadRules.test.ts`: day and week counts > today count 4
- `src/test/tournamentHeadRules.test.ts`: day and week counts > today count 12
- `src/test/tournamentHeadRules.test.ts`: day and week counts > complete round count 0
- `src/test/tournamentHeadRules.test.ts`: day and week counts > complete round count 1
- `src/test/tournamentHeadRules.test.ts`: day and week counts > complete round count 4
- `src/test/tournamentHeadRules.test.ts`: day and week counts > week count 0
- `src/test/tournamentHeadRules.test.ts`: day and week counts > week count 1
- `src/test/tournamentHeadRules.test.ts`: day and week counts > week count 4
- `src/test/tournamentHeadRules.test.ts`: day and week counts > TODAY authority and eliminated rows
- `src/test/tournamentHeadRules.test.ts`: course and field > course live
- `src/test/tournamentHeadRules.test.ts`: course and field > course completed
- `src/test/tournamentHeadRules.test.ts`: course and field > course amount is separated without altering easiest parts
- `src/test/tournamentHeadRules.test.ts`: course and field > upcoming par5 sentences retain their own rule
- `src/test/tournamentHeadRules.test.ts`: course and field > 18 of the top 50, 19 of the top 100
- `src/test/tournamentHeadRules.test.ts`: course and field > field branch 1
- `src/test/tournamentHeadRules.test.ts`: course and field > field branch 1,2,3,60
- `src/test/tournamentHeadRules.test.ts`: course and field > field branch 60,70,80
- `src/test/tournamentHeadRules.test.ts`: course and field > field branch 101,0,
- `src/test/tournamentHeadRules.test.ts`: course and field > strength only keeps strong/light lead, not top10 sentence
- `src/test/tournamentHeadRules.test.ts`: course and field > middle field has no lead
- `src/test/tournamentHeadRules.test.ts`: moments priority and plural rules > Seven moments, two eagles
- `src/test/tournamentHeadRules.test.ts`: moments priority and plural rules > all eagles live
- `src/test/tournamentHeadRules.test.ts`: moments priority and plural rules > all eagles completed
- `src/test/tournamentHeadRules.test.ts`: moments priority and plural rules > kind ace precedes any lower priority
- `src/test/tournamentHeadRules.test.ts`: moments priority and plural rules > kind albatross precedes any lower priority
- `src/test/tournamentHeadRules.test.ts`: moments priority and plural rules > kind record precedes any lower priority
- `src/test/tournamentHeadRules.test.ts`: moments priority and plural rules > kind comeback precedes any lower priority
- `src/test/tournamentHeadRules.test.ts`: moments priority and plural rules > kind playoff precedes any lower priority
- `src/test/tournamentHeadRules.test.ts`: moments priority and plural rules > kind eagle precedes any lower priority
- `src/test/tournamentHeadRules.test.ts`: moments priority and plural rules > kind streak precedes any lower priority
- `src/test/tournamentHeadRules.test.ts`: moments priority and plural rules > kind milestone precedes any lower priority
- `src/test/tournamentHeadRules.test.ts`: moments priority and plural rules > kind ace plural
- `src/test/tournamentHeadRules.test.ts`: moments priority and plural rules > kind albatross plural
- `src/test/tournamentHeadRules.test.ts`: moments priority and plural rules > kind record plural
- `src/test/tournamentHeadRules.test.ts`: moments priority and plural rules > kind comeback plural
- `src/test/tournamentHeadRules.test.ts`: moments priority and plural rules > kind playoff plural
- `src/test/tournamentHeadRules.test.ts`: moments priority and plural rules > kind eagle plural
- `src/test/tournamentHeadRules.test.ts`: moments priority and plural rules > kind streak plural
- `src/test/tournamentHeadRules.test.ts`: moments priority and plural rules > kind milestone plural
- `src/test/tournamentHeadRules.test.ts`: moments priority and plural rules > single eagle completed
- `src/test/tournamentHeadRules.test.ts`: moments priority and plural rules > single unnotable moment
- `src/test/tournamentHeadRules.test.ts`: moments priority and plural rules > unnotable moments counted
- `src/test/tournamentHeadRules.test.ts`: Ben continuation: measured fallback choices > board measured 1 lines
- `src/test/tournamentHeadRules.test.ts`: Ben continuation: measured fallback choices > board measured 2 lines
- `src/test/tournamentHeadRules.test.ts`: Ben continuation: measured fallback choices > board measured 3 lines
- `src/test/tournamentHeadRules.test.ts`: Ben continuation: measured fallback choices > unfolding measured 1 lines
- `src/test/tournamentHeadRules.test.ts`: Ben continuation: measured fallback choices > unfolding measured 2 lines
- `src/test/tournamentHeadRules.test.ts`: Ben continuation: measured fallback choices > unfolding measured 3 lines
- `src/test/tournamentHeadRules.test.ts`: Ben continuation: measured fallback choices > records measured 1 lines
- `src/test/tournamentHeadRules.test.ts`: Ben continuation: measured fallback choices > records measured 2 lines
- `src/test/tournamentHeadRules.test.ts`: Ben continuation: measured fallback choices > records measured 3 lines
- `src/test/tournamentHeadRules.test.ts`: Ben continuation: measured fallback choices > plain moments measured 1 lines
- `src/test/tournamentHeadRules.test.ts`: Ben continuation: measured fallback choices > plain moments measured 2 lines
- `src/test/tournamentHeadRules.test.ts`: Ben continuation: measured fallback choices > plain moments measured 3 lines
- `src/test/tournamentHeadRules.test.ts`: Ben continuation: measured fallback choices > only a two-player shared live lead qualifies
- `src/test/tournamentHeadRules.test.ts`: Ben continuation: measured fallback choices > two round-leaders get the specified short title
- `src/test/tournamentHeadRules.test.ts`: Ben continuation: measured fallback choices > fallback retains the opening bold narrative
- `src/test/tournamentHeadRules.test.ts`: Ben continuation: measured fallback choices > full title keeps dropping the opener even with a named candidate
- `src/test/tournamentHeadRules.test.ts`: Ben continuation: measured fallback choices > three leaders leave the original opening unchanged
- `src/test/tournamentHeadRules.test.ts`: Ben continuation: measured fallback choices > mixed course records shorten to records
- `src/test/tournamentHeadRules.test.ts`: Ben continuation: measured fallback choices > one course record shortens to one record
- `src/test/tournamentHeadRules.test.ts`: Ben continuation: measured fallback choices > last fallback is the plain total and phase suffix
- `src/test/tournamentMeasuredFallbacks.test.tsx`: measured tournament-only fallback rendering > three-line shared lead becomes Two share the lead without a line beneath
- `src/test/tournamentMeasuredFallbacks.test.tsx`: measured tournament-only fallback rendering > two-line shared lead keeps names
- `src/test/tournamentMeasuredFallbacks.test.tsx`: measured tournament-only fallback rendering > new full title rechecks instead of measuring the previous short title
- `src/test/tournamentMeasuredFallbacks.test.tsx`: measured tournament-only fallback rendering > unfolding fallback keeps the opening narrative
- `src/test/tournamentMeasuredFallbacks.test.tsx`: measured tournament-only fallback rendering > records candidate stays when it fits two lines
- `src/test/tournamentMeasuredFallbacks.test.tsx`: measured tournament-only fallback rendering > records candidate over two lines becomes plain total
- `src/test/tournamentSectionHeads.test.tsx`: tournament section heads > board action keeps handler and takes precedence over trailing
- `src/test/tournamentSectionHeads.test.tsx`: tournament section heads > race moves chart label and drops bold narrative opening
- `src/test/tournamentSectionHeads.test.tsx`: tournament section heads > field drops ranking aside and hero top10 sentence
- `src/test/tournamentSectionHeads.test.tsx`: tournament section heads > live course splits hardest title and amount
- `src/test/tournamentSectionHeads.test.tsx`: tournament section heads > finished course changes tense without duplicating hardest lead
- `src/test/tournamentSectionHeads.test.tsx`: tournament section heads > upcoming course renders its own lead only once
- `src/test/tournamentSectionHeads.test.tsx`: tournament section heads > numbers joins round eyebrow and counts active TODAY
- `src/test/tournamentSectionHeads.test.tsx`: tournament section heads > day switch sits in head and updates all-group title
- `src/test/tournamentSectionHeads.test.tsx`: tournament section heads > moments reads all seeded moments
- `src/test/tournamentSectionHeads.test.tsx`: tournament section heads > live tournament picks remove old intro while keeping record door/cards
