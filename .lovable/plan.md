# Feat pill layout, owner copy, and colour

## Build
- Reduce the Explore round pill to two figures: PAR and NET.
- Move the single selected rarity sentence into the achievement lane beneath the feat label; show owner copy instead of public copy when owner data resolves.
- Keep figure columns vertically centred while allowing the left lane and pill height to grow naturally without truncation.
- Apply the same one-line selection rule to round detail, without changing Board rows, headline prose, or hero chips.
- Use the existing `SC_FILL_GOLD` (`#FFD200`) token for the owner sentence and qualifying feat icon; keep public rarity copy muted.

## Copy and identity
- Add separate congratulatory locale keys for repeat, rare-two, rare-three, sole-holder, and personal-first branches in en, de, es, ja, ko, and en-XA.
- Pass the branch line and a validated first-name token into those locale strings; never compose punctuation or congratulations in TypeScript.
- Use the existing viewer profile already held by each surface. If its first token is one character or contains a digit, dot, underscore, or `@`, use the existing plain branch key.

## Verification
- Update focused rarity and pill tests, including owner replacement, handle fallback, and two-column layout.
- Verify at 393px with screenshots for Lennon owner, non-owner, longest repeat copy, German owner copy, and handle fallback.
- Confirm Board rows and `get_explore_stream` remain untouched, and run the focused tests plus TypeScript checks.
