# EP2 — Edit profile: the You group and its sheets

Files touched
- src/pages/EditProfile.tsx — You group under the card; shared save runner (photos + sheets); local username/You values update card and rows.
- src/features/edit-profile/EditProfileYou.tsx (new) — rows 2A, sheets 2B–2F.
- src/features/edit-profile/youRules.ts (new) — pure rules (gender labels, location value, name toggle, 30-day dates).
- src/features/edit-profile/edit-profile.css — EP2 styles.
- src/hooks/useProfileSave.ts — opt-in `profileFields: 'name'|'bio'|'location'|'gender'` partial; default save unchanged.
- src/features/business-create/BusinessCreateStep3.tsx — BizcSheet opt-in actionLabel/onAction/actionDisabled/hideAction; defaults reproduce "Done".
- src/components/profile/edit-v2/LocationSection.tsx — opt-in `appearance="card"`; default unchanged (ManageProfile).
- src/lib/profile/previousUsername.ts (new) + src/pages/ProfilePageV2.tsx — not-found username resolves via resolve_previous_username, navigate replace keeping sub-path/query/hash.
- Typed client already contained change_username, resolve_previous_username and username_changed_at; nothing added.

Tests
- Added src/test/ep2EditProfileYou.test.tsx (22 tests). No existing test changed, renamed or removed.
- Full suite: 4,198 / 442 files -> 4,220 / 443 files, all passing (+22 = the new file).

Notes
- The ProfilePageV2 redirect is tested through its helper (rpc call, path keeping sub-path) plus a source check of the page wiring; the full page was not mounted.
- Only /profile/:username renders ProfilePageV2; /profile/:old/followers is a separate route and is not redirected by this brief.
- Setup's username input caps at 20; the brief's USERNAME_MAX (30) was used. The syntax rule (3-20) still applies.
