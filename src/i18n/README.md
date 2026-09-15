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

## Detection — ENGLISH ONLY for now

`de`, `es`, `ja` and `ko` are keyed but only ~26% translated, so a device set
to one of them rendered a mostly-English app. They are switched OFF until a
language has had native review. Their files stay on disk untouched.

**The switch is `ENABLED_LOCALES` in `src/i18n/index.ts`** — one line to turn a
reviewed language back on (`en-XA` is dev-only, for text-expansion QA).

Resolution order is now: persisted `clbhouz.locale` **if it is enabled** → `en`.
`navigator.language` is deliberately not consulted, and a cached value for a
disabled locale is removed on boot (`pruneStoredLocale`).

New copy still goes through `t()` with an `en` value; new keys do not need
`de`/`es`/`ja`/`ko` values. When a language is re-enabled, write its
"missing key / untranslated value" guard test then.

## Wave rollout

- Wave 0 (this doc): plumbing only. No copy moves.
- Wave 1: formatting refactor — every hand-rolled formatter routes through
  `format.ts`.
- Wave 2: extract `common/` primitives.
- Waves 3+: per-feature vertical extractions with lint ratchet flipped from
  warn → error path-by-path.
