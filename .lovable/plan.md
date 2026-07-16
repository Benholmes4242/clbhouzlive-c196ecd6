# Wave 3c — Achievements + Quest extraction

## Scope receipts (BEFORE)

Under the standard i18nLiteralOptions run against `src/components/achievements` and `src/components/quest`:

- **94** `i18next/no-literal-string` warnings
- **37** attribute-guard hits (`aria-label`/`title`/`placeholder`/`alt`/`label`)
- Files with attr-guard hits: 16 (all 12 achievements/*, 6 quest/*)

Total extraction surface: **~131 literal sites** across **22 files** (~4,770 LOC).

## Namespace + wiring

- New namespace: `achievements` at `public/locales/{en,de,es,ja,ko,en-XA}/achievements.json`
- Register in `src/i18n/index.ts` `ns:` array
- Common adoptions to prefer where texts match verbatim: `common:action.share`, `common:action.close`, `common:action.done`, `common:action.dismiss`, `common:state.loading`, `common:label.viewAll` (audit and adopt only on exact-string matches)

## Key mint plan (~91 chrome strings)

Grouped under `achievements.*`:

- `card.*` — AchievementCard chrome (progress bar labels, lock states)
- `detail.*` — AchievementDetailModal (headers, tier ladder, unlock rules, share CTA)
- `toast.*` — AchievementToast + LevelUpToast (unlock announcement, level-up copy, dismiss aria)
- `levelUp.*` — LevelUpSheet + LevelUpGate (headline, subhead, tier reveal, continue CTA)
- `elite.*` — EliteGameCard (mode headers, stat rows, empty states — the 1,513-line beast)
- `nudge.*` — NudgeBanner (streak nudges, comeback prompts)
- `season.*` — SeasonRecapModal (recap headline, stat labels, share)
- `quest.hero.*` — TrophyRoomHero (progress, "to <club>", "Complete!", "Courses played")
- `quest.ladder.*` — MilestoneLadder ("{{played}}/{{total}} played", "{{remaining}} away!")
- `quest.leaderboard.*` — LeaderboardCard (headers, empty state, rank labels)
- `quest.momentum.*` — MomentumCard (streak copy)
- `quest.trophy.*` — TrophyCase (case chrome, filters)
- `quest.recent.*` — RecentlyAddedSection (headers, empty state)
- `quest.regional.*` — RegionalJourneySummary (region headers)
- `quest.empty.*` — QuestEmptyState

### Plurals to convert (ternary → `_one`/`_other`)

Expected sites: `{{count}} days`, `{{count}} streak`, `{{count}} badges`, `{{count}} courses`, `{{count}} left`, `{{count}} played`. All will be split into `_one`/`_other` and switched via `t('key', { count })`.

### `<Trans>` for mixed markup

`{totalPlayed} of {nextThreshold} · <span>{nextClubName}</span>` (TrophyRoomHero:267) and similar composites will use `<Trans i18nKey=... components={{ bold: <span className=... /> }} values={...} />`.

## Brand vocabulary — FLAG FOR BEN

Per the brief, these are product-decision names. I will FLAG the full inventory and **leave them as literals with `// eslint-disable-next-line i18next/no-literal-string -- brand: awaiting rule`** until you rule translate-or-keep. The chrome around them still gets keyed.

Preliminary flagged list (final list ships in R2):

**Grand Slam tier ladder** (from MilestoneLadder + TrophyRoomHero + club naming):
- Rookie, Contender, Regular, Veteran, Champion, Legend, Grand Slam (or the exact ladder in code — will confirm exact set in R2)

**Elite Game tier/gem names** (from EliteGameCard):
- Bronze, Silver, Gold, Platinum, Diamond gem/level names as they appear
- Elite Game mode names (Solo, Head-to-Head, League, etc. as coded)

**Achievement badge names** (from AchievementDetailModal + AchievementCard metadata):
- Individual badge titles — these already come from data (DB rows), so may already be non-literal. Any hard-coded title constants get flagged.

**Season recap headline names** (from SeasonRecapModal)

R2 will paste the exact string inventory extracted from source, not this preliminary sketch.

## Lint override (activation)

Append to `eslint.config.js`:

```js
// ─── Wave 3c — scope-dir ERROR flip for achievements + quest ────────
{
  files: [
    "src/components/achievements/**/*.{ts,tsx}",
    "src/components/quest/**/*.{ts,tsx}",
  ],
  rules: {
    "i18next/no-literal-string": ["error", i18nLiteralOptions],
    "no-restricted-syntax": ["error", literalAttrSyntax, ...toLocaleSyntax],
  },
}
```

Flipped ONLY after both scopes are at genuine 0 (raw eslint receipts).

## Execution order

1. Read all 22 files, inventory every literal (chrome + attr) + brand-name candidates
2. Draft `en/achievements.json` (all keys + `_one`/`_other` plural forms)
3. Fan out to `de/es/ja/ko/achievements.json` as en-clones (translation happens downstream); `en-XA/achievements.json` pseudo-padded per existing pattern
4. Register namespace in `src/i18n/index.ts`
5. Rewrite each source file: `useTranslation('achievements')`, replace literals with `t(...)`, use `<Trans>` for mixed markup, add `// eslint-disable-next-line ... -- brand: awaiting rule` on brand-vocabulary names
6. Flip ERROR override in `eslint.config.js`
7. Verify: `tsgo --noEmit` + raw `npx eslint <scope>` receipts + repo-wide count + parser round-trip

## Report format (R1–R6)

- **R1** `git rev-parse HEAD` + `tsgo --noEmit` output
- **R2** Full key list + common.* adoptions + **THE FLAGGED NAME LIST** (verbatim strings, file:line for each)
- **R3** Raw `eslint` receipts: one dirty-file BEFORE, both scope dirs AFTER (i18n + attr-guard) — actual tool output, not summaries
- **R4** Repo-wide `i18next/no-literal-string` warning count vs prior baseline 2,854
- **R5** en spot-check (Achievement toast, LevelUp sheet, TrophyRoomHero progress, MilestoneLadder pluralized rows) + en-XA visible pad flags
- **R6** JSON parser round-trip clean for all 6 locales

## Confirm before I mint

The brand-vocabulary flagging is the only judgment call. My reading of the brief: **flag + literal-with-disable** for tier ladder / gem / mode names; extract everything else. Approve or amend and I'll execute end-to-end in one commit.
