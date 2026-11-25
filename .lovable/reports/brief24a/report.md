# Brief 24A — report (shards held)
A b573d5adaa claim tail plurals in en, en-XA, de, es, ja, ko; count passed.
B 4e2ca646d7 + b3a46a76be number-input-only padding rule; resolveDialDefault (draft → sub_country nation → address → navigator region → GB).
C c5663e1f84 both routers (client + _shared/notifRoute, process-push-queue redeployed) → /business/{slug||id}; no business id → /notificationmessages (the app has no /activity route).
D fd56115de9 titleSelf for roleSheet, jobSheet, ownerSheet, removeSheet (en, en-XA); titled() uses it on own row.
E a95ef8c3ae clubPlaceLine/searchResultPlace and Step2Club address label: region, sub_country.
F not built: useRecentSearchesV2 stores query strings only (id, query, ts) — no business/person entity or id to check. Awaiting ruling.
Tests 44aac72344: brief24aSetupFixes.test.ts (7 cases); parity file +5 cases.
Existing tests changed:
- notifRoute.parity.test.ts N4 'course_claim_approved with entity_type course': data `{ course_id: CID }` → `{ course_id: CID, business_id: 'biz-1' }`; route `/courses/${CID}` → `'/business/biz-1'`. FIXTURES 'course_claim_approved' unchanged (both routers now agree on /notificationmessages).
- bc2BusinessCreate.test.tsx:149 'Bromley, Kent' → 'Kent, Bromley'; :155 'Bromley, Kent · 2 courses' → 'Kent, Bromley · 2 courses' (E1 order).
Shards not run: shard 3 is blocked by the open Brief 24B stop (brief18EyebrowInk ClubFromTheClub.tsx:55 line shift).
No SQL run, no migration written.
