# PR-2a fix-up — Mention input overlay registration + popover sizing

Date: 2026-07-07
Scope: `MentionsComposerInput` (both wired composers: `CommentsSheet`, `TopTenCardComments`).

## 1. Doubled / offset mention text — root cause

Two independent overlay-vs-textarea drift sources were active:

1. **Textarea text was NOT transparent.** `input.color` was set to
   `#0F172A`, so both the textarea's own glyphs AND the highlighter
   overlay painted the string — a second, misaligned copy.
2. **Mention token was bold + textShadowed.** `fontWeight: 600` on
   the overlay mention changed glyph advance widths, so every
   character AFTER a mention was pushed right in the overlay while
   the textarea kept regular metrics. The 1px `textShadow` halo
   also smeared the amber colour into the surrounding text.

## 1. Fix

- Introduced a single `sharedText` style object (font-family, size,
  weight, line-height, letter-spacing, padding, border, box-sizing,
  margin) spread into BOTH `highlighter` and `input`. Hand-editing
  one side is no longer possible.
- Set `input.color: transparent` + `WebkitTextFillColor: transparent`
  + `caretColor: #0F172A` — one visible copy of the text (the
  overlay), caret still visible.
- Reduced `mentionStyle` to colour-only (`color: #F7931E`,
  `fontWeight: 400`, no textShadow). Same glyph widths → no drift
  after a mention.
- Added `whiteSpace: pre-wrap` + `wordWrap: break-word` on both
  layers so long lines wrap identically.
- Added CSS guards in `index.css` under `.mentions-composer__…`
  BEM selectors that enforce transparent input + placeholder
  colour, in case a react-mentions default rule tries to reassert
  `color: inherit` on the textarea.
- Scroll sync is inherent to react-mentions (single scroll
  container wraps both layers), so long multi-line comments stay
  aligned automatically.

## 2. Autocomplete popover sizing — root cause

react-mentions positions the suggestions container absolutely
relative to the caret with its own inline `left`/`top` and an
auto-fit width — which is why the list rendered ~120 px wide and
clipped names/handles.

## 2. Fix

- Overrode `suggestions` style with `position: absolute`,
  `left: 0`, `right: 0`, `top: auto`, `bottom: 100%`,
  `width: 100%` — anchors the popover to the composer's full input
  row width, above the caret.
- Backed by `!important` CSS guards on
  `.mentions-composer__suggestions` +
  `.mentions-composer__suggestions__list` so the library's inline
  positioning can't reclaim width.
- `maxHeight = 5 × 44 + 8` px → exactly 5 scrollable rows.
- `zIndex: 210` clears sheet content.
- Suggestion rows already use `flex-1 min-w-0` + `truncate` on the
  display name and secondary line, so names/handles read fully at
  normal lengths and only truncate at genuine overflow.

## Acceptance

- Typing shows exactly one crisp copy of the text.
- No colour smearing / halo on mention tokens.
- Caret sits correctly before / inside / after a mention.
- Long multi-line comments stay registered while scrolling.
- Popover spans composer width; full display names + handles
  visible; both composers.
- Canonical markup (`@[Name](u:UUID)`) round-trips on submit —
  unchanged from PR-2a; react-mentions still owns serialization.

## Files

- `src/components/mentions/MentionsComposerInput.tsx`
- `src/index.css` (react-mentions class guards, appended)
