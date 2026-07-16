# i18n conventions (Wave 0)

Target locales: `en` (source), `ja`, `ko`, `es`, `de`, plus the dev-only
pseudo-locale `en-XA` for text-expansion QA. LTR only. RTL is out of scope.

## What NEVER gets keyed

- **Golf lexicon** — Birdie, Eagle, Par, Bogey, Ace, Cut, etc. Stay in
  English across every locale.
- **Proper nouns from sports feeds** — player names, tour names, tournament
  names, course names. These arrive from Sportradar / our DB verbatim.
- **User-generated content** — post bodies, comments, mentions.
- **Analytics event names, testids, className / style values.**

## Key naming

```
namespace:component.purpose
```

- `namespace` = feature slice (`tourhub`, `profile`, `composer`, `common`,
  `courses`, `clubhouse`, …). Use `common` for shared UI primitives.
- `component.purpose` = camelCase, e.g. `heroRiver.loadMore`,
  `commentSheet.emptyState`.
- Plurals via i18next suffixes: `key_one`, `key_other`.
- Parameters are named: `"{{count}} posts"`, `"Welcome, {{name}}"`.

## Formatting

All display formatting (dates, times, numbers, ordinals, compact counts)
must go through `src/i18n/format.ts`. Do **not** call `toLocaleString`,
`date-fns` display helpers, or hand-rolled "5m ago" logic in components.

## Detection

Detection order is: persisted `clbhouz.locale` → `navigator.language` →
`en`. The in-app language picker (Wave later) writes to that storage key
and always wins over the OS / Median WebView locale.

## Wave rollout

- Wave 0 (this doc): plumbing only. No copy moves.
- Wave 1: formatting refactor — every hand-rolled formatter routes through
  `format.ts`.
- Wave 2: extract `common/` primitives.
- Waves 3+: per-feature vertical extractions with lint ratchet flipped from
  warn → error path-by-path.
