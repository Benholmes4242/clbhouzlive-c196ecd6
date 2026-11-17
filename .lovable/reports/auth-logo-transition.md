# FIX_AUTH_LOGO_TRANSITION

**Change** (`src/pages/auth/components/auth-hero.css`, `AuthHeroScreen.tsx`):
- `.is-keyboard-open .auth-hero-brand img { display: none; }` → `{ opacity: 0; transform: scale(.88); height: 0; }`. Base logo carries `opacity: 1; transform: scale(1)`, 68px (52px in the max-height: 640px block, unchanged), with `opacity`, `transform`, `height` transitions of 240ms cubic-bezier(.2,.8,.2,1). The tagline h1 gains `transition: margin-top` with the same timing (18px ↔ 0; 14px ↔ 0 compact, existing values). The img height is animated directly; no wrapper was needed.
- `auth-logo-animate` has `both` fill, which would pin opacity/transform and defeat the transition, so the class is removed on the logo's `animationend` (local `logoEntered` state). The bounce runs on first load only; coming back from the code step uses the fade.
- Reduced motion: `.auth-hero-brand img, .auth-hero-brand h1 { transition: none; }` (instant change, as before).
- Untouched: tagline, dot, is-keyboard-tight rules, panels, keyboard detection.

**Tests**: new `src/test/authLogoTransition.test.tsx` (+5): collapsed/transparent but in the DOM with no display:none; restored values when keyboard mode clears; shared transition properties/timing; bounce class removed after its end; reduced motion has no transition. No existing assertion changed, deleted or renamed.

**Suite**: 9,126 → 9,131 (2,259 / 2,260 / 2,265 / 2,347), all passing, four shards one after another. Delta +5 = new file. Typecheck (`npx tsgo -b --noEmit`) clean.

**Device check**: iPhone email → code → back unchecked (no device available here); jsdom does not run CSS transitions, so smoothness is asserted by rule, not observed.
