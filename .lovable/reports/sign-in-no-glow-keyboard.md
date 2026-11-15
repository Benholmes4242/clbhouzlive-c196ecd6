# Sign-in: no glow and keyboard positioning

## Changed files
- `src/pages/auth/components/AuthHeroScreen.tsx`: removed glow; focusin/focusout keyboard mode with 100ms recheck, visualViewport resize/scroll pinning, <420px tight mode and listener cleanup. Closing resets only a nonzero iOS window/document offset, never #root. Scoped ESLint exception documents this user-approved reset.
- `src/pages/auth/components/auth-hero.css`: removed glow rule; explicit tagline values and smoothing, inherited font per clarification; keyboard logo omission, full 34px tagline, tight-mode tagline omission and 16px panel bottom. Small-phone non-keyboard rules and white caret preserved.
- `src/index.css`: removed `--auth-glow`; its sole consumer was the deleted auth glow rule. No other users.
- `src/test/authHeroKeyboard.test.tsx`: five new cases covering removal, clarified typography, viewport height/offset, delayed close/reset, and 380px tight mode.

## Verification
Baseline: 8,760. After: **8,765 passed, 0 failed** (+5 named cases in the new file). No existing tests deleted, renamed or rewritten.
Command, each shard separately: `bunx vitest run --shard=N/4 --maxWorkers=2 --reporter=json --outputFile=/tmp/sign-in-keyboard/shardN.json`.
- Shard 1: 2,236
- Shard 2: 2,104
- Shard 3: 2,203
- Shard 4: 2,222
- Total: **8,765**
Focused: `bunx vitest run src/test/authHeroKeyboard.test.tsx src/test/signInRedesign.test.tsx src/test/ep51SearchAndCarets.test.tsx`: 26 passed.
Harness latest signal: `build OK`, 2026-11-15T11:43:23Z. `git diff --check` clean.
ESLint check reported an existing bare `alt="clbhouz"` restriction in AuthHeroScreen (line shifted to 199); unchanged branding/logo outside this brief.
Browser /auth at 320×568: simulated visualViewport 490px, input focus applies keyboard class/490px height, tagline computes 34px, no horizontal overflow; viewport scroll pins top at 120px; blur removes class and inline styles. Real iPhone keyboard behavior and emailed-code delivery not verified. OTP is separately AuthForm-owned, not an input inside this screen; existing OTP remains unchanged.
No SQL, migrations, feed_config or other source files touched.
