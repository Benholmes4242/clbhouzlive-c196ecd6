---
name: Sign-up and pro six fixes
description: Setup enforcement, contained photos and no pro-board promises
type: constraint
---
New signed-in non-guest members with settled profile has_completed_onboarding=false must enter /welcome from app routes, except welcome/auth/legal/privacy/terms/delete-account. Never redirect while loading. Post-auth profile read errors lead to /welcome; step one has no Skip, steps 2–4 retain it. Reachable photo croppers must contain without stretching, zoom 1–4 and restrict position; keep crop output/cap/quality. Comments body/composer use SHEET_SURFACE like Likes. Account doors use media max-width360 rather than size containment. ProDetails focus outline is ink at 2px/offset2; pro/verification/Welcome promises never mention opening Rounds boards. Ben's approval notification is “Your PRO label is live. No handicap needed.” Do not write SQL or migrations.