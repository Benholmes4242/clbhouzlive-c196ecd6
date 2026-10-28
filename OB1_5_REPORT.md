# OB1.5 — Setup: full-width handicap sign-in and the syncing screen

## Prop and callback names
- `WhsConnectScreen`: new `setupEmbedded?: boolean` (passed only by
  `WelcomeHandicap`; never keyed off `layout`/`hideChrome`) and
  `onSyncingChange?: (syncing: boolean) => void` (fires on every transition
  and once more, false, on unmount).
- `EnglandGolfForm` / `SyncingScreen`: new `setupEmbedded?: boolean`.
- `PrimaryButton`: new `className?` — when set it REPLACES the inline visual
  style so the host's pill class paints the button.
- `Stage` / `FooterBar`: new optional `style` merge prop.

## Diff summary
- `WhsConnectScreen.tsx` — stage resolves to `sync` when
  `submitting && (!completeOnSuccess || setupEmbedded)`; the sync stage and
  form receive `setupEmbedded`; the `onSyncingChange` effect.
- `EnglandGolfForm.tsx` — in setup: no StageHead, Stage padding `10px 0 0`
  with no background/border, first field 24px below the host's sub-line,
  FooterBar at 20px sides / 34px + safe-area bottom, submit button carries
  `welcome-primary` (52px pill, INK on canvas, 16px/600, full width; disabled
  state from `.welcome-shell button:disabled`). Fields, hint, Show, trust
  notes and error styling unchanged.
- `SyncingScreen.tsx` — in setup: no StageHead, flush Stage, steps 36px below
  the host's sub-line. Same cosmetic one-way timer and marks; the screen still
  ends only when `callConnectWhs` resolves.
- `WelcomeHandicap.tsx` — the `<h1>{country.body}</h1>` is gone; passes
  `setupEmbedded` and `onSyncingChange`.
- `Welcome.tsx` — when the connect body is open it renders the one heading:
  kicker "Your handicap", h1 "Sign in to {body}." (new key
  `welcome.connectTitle`), sub "The same details you use for the {body} app."
  (new key `welcome.connectSub`); while `syncing` the h1/sub swap to
  `whsConnect.sync.headline`/`sub`, and the back button and Skip hide. The
  progress bar stays on step 4. Success/failure paths unchanged (failure
  restores heading and controls via `onSyncingChange(false)`).
- `welcome.css` — removed the now-dead `.welcome-connect>h1` rule.
- Locales — `welcome.connectTitle` / `welcome.connectSub` added to `en` and
  `en-XA` auth.json (the only locales carrying the welcome section).
- Analytics unchanged.

## Test changes (old → new)
- `ob1Welcome.test.tsx` "Connect opens sign-in directly…": h1 assertion
  `'England Golf'` → `'Sign in to England Golf.'`; source assertion
  `'completeOnSuccess hideChrome'` → `'completeOnSuccess hideChrome
  setupEmbedded'`. The WhsConnectScreen mock gained a `sync-toggle` button
  that calls `onSyncingChange(true)`.
- Added in `ob1Welcome.test.tsx`: "while connecting, the heading is Pulling
  your record. and back and Skip hide".
- New `src/test/ob15SetupConnect.test.tsx` (5 tests): setup sign-in structure;
  in-flight steps + `onSyncingChange`; failure restores form/message/host;
  success calls `onConnected`; profile flow unchanged (StageHead, 24px Stage,
  default pill, in-flight sync stage as before).
- No tests deleted or renamed.

## Results
- Targeted: `ob15SetupConnect.test.tsx` + `ob1Welcome.test.tsx` 79/79.
- Full suite: **3,999/3,999 across 427 files, all passing** (last green
  3,993/426; +6 tests, +1 file, all named above).
- `tsgo --noEmit` clean.

## Notes / unverified
- The profile connect flow (`/manage/handicap`, embedded handicap view)
  renders exactly as today — covered by the "no setupEmbedded" test.
- Signed-in browser preview of the two setup panels was not exercised.
- No SQL, no migrations, no RPC or edge-function edits, `feed_config`
  untouched, `round_pool_cap` stays at 30, no native/Median config changes.
