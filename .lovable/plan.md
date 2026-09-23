# Canvas Stage 2A — Skeletons

## Goal
Move every dark-app loading placeholder onto the canonical Canvas → Panel → Cell → Raised ramp without changing its layout or animation behavior.

## Changes
- Inventory dedicated skeleton components plus inline loading placeholders and match each ground, card, and block to the real surface it represents.
- Replace pre-ramp colour literals with references from the shared surface token module.
- Preserve every shimmer direction, size, duration, easing, and geometry; change colour stops only.
- Move every dark surface incorrectly using the black-alpha light shimmer to the dark shimmer.
- Keep the light shimmer available and document whether any genuinely light surface still uses it.
- Update focused guard coverage so skeletons cannot drift back to pre-ramp colours or the wrong shimmer.

## Verification
- Run focused skeleton/token tests, then the project test command.
- Cold-load reachable public screens in the mobile preview and visually inspect the loading transition.
- Report all changed files and ramp assignments, incorrect-shimmer count, legitimate light users, remaining clashes, and inaccessible authenticated screens.

## Constraints
- No database or migration work.
- No layout, timing, animation, artwork, or unrelated colour changes.
- Remaining non-skeleton canvas clashes are report-only.
