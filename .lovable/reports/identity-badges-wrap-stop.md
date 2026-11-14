# Personal identity badges wrapping — stop

## Outcome
Wrapping implementation and the two authorised structure updates are saved. Focused run: **44 executed / 43 passed / 1 failed**. All four full-suite shards are unrun under the stop rule. Last fully passing suite: **8,599**; current inventory is **8,600** (+1 named source case), not a verified passing total.

## Exact stop
`src/test/proBadgeMembers.test.ts:50:76`
Case: `Members badge source contract renders the large Creator foil badge directly after PRO on a creator profile`
```text
AssertionError: expected undefined to be 'H1' // Object.is equality
```
Unchanged assertion:
```ts
expect(badge?.previousElementSibling?.previousElementSibling?.tagName).toBe('H1');
```
This third assertion encodes the retired direct-sibling heading structure. The brief authorises only the proVerification2 and cr2CreatorProfile assertions, so it was not altered or rerun. Proposed correction requiring authorisation: inspect `badge?.parentElement?.previousElementSibling?.tagName` for H1; retain the PRO/Creator sibling assertion.

## Changed lines
- ProfileCoverBand.tsx:221–224 — conditional identity-badges wrapper, PRO then Creator; h1 untouched.
- pro-label.css:8–10 — signed-off wrapping row, heading width constraints and unsplit badge group.
- profile-creator.css: former line 1 — conflicting identity rules removed only.
- proVerification2.test.tsx:61–69 — authorised row/group structure update.
- cr2CreatorProfile.test.tsx:60–63 — authorised Creator-only group update.
- proBadgeMembers.test.ts:24–27 — one new source case, `wraps the personal identity row while keeping its badge group unsplit`.

## Authorised existing case updates
No cases deleted or renamed. Two cases updated; their old and new assertions appear in the exact diff below.
- `pro identity precedes Creator in the cover identity row`: old `expect(row?.children[1].getAttribute('data-size')).toBe('large');` and `expect(row?.children[2].className).toBe('profile-creator-label');`. New assertions inspect [h1, identity-badges], then PRO/Creator children. Why: explicitly authorised new grouped structure.
- `creator label is present only when enabled and is a sibling of the name`: old `expect(document.querySelector('.profile-creator-label')?.previousElementSibling).toBe(screen.getByRole('heading', { name: 'Ellie' }));`. New assertions inspect the group immediately after heading and its sole Creator child. Why: explicitly authorised Creator-only group structure.

## Command
`bunx vitest run src/test/proBadgeMembers.test.ts src/test/proVerification2.test.tsx src/test/cr2CreatorProfile.test.tsx --maxWorkers=2 --reporter=json --outputFile=/tmp/identity-wrap-focused.json`

## Exact source/test diff
```diff
diff --git a/src/components/profile/hero/ProfileCoverBand.tsx b/src/components/profile/hero/ProfileCoverBand.tsx
index 86f8601164..8b2f5b7026 100644
--- a/src/components/profile/hero/ProfileCoverBand.tsx
+++ b/src/components/profile/hero/ProfileCoverBand.tsx
@@ -218,8 +218,10 @@ export const ProfileCoverBand: React.FC<Props> = ({
             >
               {displayName}
             </h1>
-            {isPro && <ProLabel size="large" />}
-            {isCreator && <span className="profile-creator-label" data-size="large"><span className="pro-label-text">Creator</span></span>}
+            {(isPro || isCreator) && <span className="identity-badges">
+              {isPro && <ProLabel size="large" />}
+              {isCreator && <span className="profile-creator-label" data-size="large"><span className="pro-label-text">Creator</span></span>}
+            </span>}
             </div>
             {afterSubline}
           </div>
diff --git a/src/features/creator/profile-creator.css b/src/features/creator/profile-creator.css
index 0026b8916e..2d53173bd0 100644
--- a/src/features/creator/profile-creator.css
+++ b/src/features/creator/profile-creator.css
@@ -1,4 +1,3 @@
-.profile-creator-identity{display:flex;align-items:center;gap:7px;min-width:0}.profile-creator-identity h1{flex:1;min-width:0}
 .profile-video-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:2px;width:100%}
 .profile-video-tile.profile-video-tile,.profile-video-loading{position:relative;height:172px;min-width:0;padding:0;border:0;border-radius:0;overflow:hidden;background:var(--welcome-card);box-shadow:none;transform:none}
 .profile-video-tile img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.profile-video-shade{position:absolute;inset:0;background:var(--profile-video-shade)}
diff --git a/src/features/pro-verification/pro-label.css b/src/features/pro-verification/pro-label.css
index 295246a12a..620cf7b564 100644
--- a/src/features/pro-verification/pro-label.css
+++ b/src/features/pro-verification/pro-label.css
@@ -5,8 +5,9 @@
 .pro-member-name { display:inline-flex; align-items:center; gap:6px; max-width:100%; min-width:0; vertical-align:middle; }
 .pro-inline-name { display:inline-flex; align-items:center; gap:4px; max-width:100%; min-width:0; vertical-align:middle; line-height:inherit; }
 .pro-inline-text { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
-.pro-identity-row { display:flex; align-items:center; gap:7px; min-width:0; }
-.pro-identity-row > h1 { min-width:0; }
+.pro-identity-row, .profile-creator-identity { display:flex; align-items:center; flex-wrap:wrap; column-gap:7px; row-gap:6px; min-width:0; }
+.pro-identity-row > h1, .profile-creator-identity > h1 { flex:0 1 auto; min-width:0; max-width:100%; }
+.identity-badges { display:inline-flex; align-items:center; gap:7px; flex:none; }
 .pro-profile-note { margin:12px 16px 16px; padding:12px 14px; border-radius:14px; background:var(--pro-note-ground); border:1px solid var(--pro-note-hairline); display:flex; gap:10px; align-items:flex-start; font-size:13px; line-height:1.45; color:var(--pro-note-muted); }
 .pro-profile-note b { display:block; color:var(--pro-note-ink); font-size:14px; }
 .pro-profile-note > i { width:8px; height:8px; border-radius:50%; background:var(--pro-note-muted); margin-top:6px; flex:none; }
diff --git a/src/test/cr2CreatorProfile.test.tsx b/src/test/cr2CreatorProfile.test.tsx
index 3de5d1b98c..9523733240 100644
--- a/src/test/cr2CreatorProfile.test.tsx
+++ b/src/test/cr2CreatorProfile.test.tsx
@@ -57,7 +57,10 @@ it('creator label is present only when enabled and is a sibling of the name', ()
  const { rerender } = render(<ProfileCoverBand coverUrl={null} avatar={null} displayName="Ellie" subline={null} />, { wrapper });
  expect(document.querySelector('.profile-creator-label')).toBeNull();
  rerender(<ProfileCoverBand coverUrl={null} avatar={null} displayName="Ellie" subline={null} isCreator />);
- expect(document.querySelector('.profile-creator-label')?.previousElementSibling).toBe(screen.getByRole('heading', { name: 'Ellie' }));
+ const badges = document.querySelector('.identity-badges');
+ expect(badges?.previousElementSibling).toBe(screen.getByRole('heading', { name: 'Ellie' }));
+ expect(badges?.children).toHaveLength(1);
+ expect(badges?.children[0].className).toBe('profile-creator-label');
 });
 it('creator defaults to Videos while a non-creator defaults to Posts', () => { expect(creatorTab(null, true, false)).toBe('videos'); expect(creatorTab(null, false, false)).toBe('activity'); });
 it('non-creator video links resolve to Posts', () => { expect(creatorTab('videos', false, false)).toBe('activity'); });
diff --git a/src/test/proBadgeMembers.test.ts b/src/test/proBadgeMembers.test.ts
index cc7191e9bc..780f52c8eb 100644
--- a/src/test/proBadgeMembers.test.ts
+++ b/src/test/proBadgeMembers.test.ts
@@ -21,6 +21,11 @@ function rule(source: string, selector: string) {
 }
 
 describe('Members badge source contract', () => {
+  it('wraps the personal identity row while keeping its badge group unsplit', () => {
+    expect(rule(label, '.pro-identity-row, .profile-creator-identity')).toContain('flex-wrap:wrap');
+    expect(rule(label, '.identity-badges')).toContain('flex:none');
+  });
+
   it('shares the plate and rim rule between PRO and Creator', () => {
     expect(rule(label, '.pro-label, .profile-creator-label')).toContain('var(--member-badge-plate) padding-box, var(--member-badge-rim) border-box');
   });
diff --git a/src/test/proVerification2.test.tsx b/src/test/proVerification2.test.tsx
index 69d6cb16ea..742eb5b900 100644
--- a/src/test/proVerification2.test.tsx
+++ b/src/test/proVerification2.test.tsx
@@ -58,8 +58,14 @@ describe('Brief 2 public pro identity', () => {
     const { container } = mount(<ProfileCoverBand coverUrl={null} avatar={null} displayName="Long Name" subline={null} isPro isCreator />);
     const row = container.querySelector('.pro-identity-row');
     expect(row?.children[0].tagName).toBe('H1');
-    expect(row?.children[1].getAttribute('data-size')).toBe('large');
-    expect(row?.children[2].className).toBe('profile-creator-label');
+    expect(row?.children).toHaveLength(2);
+    const badges = row?.children[1];
+    expect(badges?.className).toBe('identity-badges');
+    expect(badges?.children).toHaveLength(2);
+    expect(badges?.children[0].className).toBe('pro-label');
+    expect(badges?.children[0].getAttribute('data-size')).toBe('large');
+    expect(badges?.children[1].className).toBe('profile-creator-label');
+    expect(badges?.children[1].previousElementSibling).toBe(badges?.children[0]);
   });
 });
 
```

## Executed focused test names
- src/test/cr2CreatorProfile.test.tsx — creator label is present only when enabled and is a sibling of the name — passed
- src/test/cr2CreatorProfile.test.tsx — creator defaults to Videos while a non-creator defaults to Posts — passed
- src/test/cr2CreatorProfile.test.tsx — non-creator video links resolve to Posts — passed
- src/test/cr2CreatorProfile.test.tsx — no implicit Posts content is selected during creator loading — passed
- src/test/cr2CreatorProfile.test.tsx — creator summary never reads when signed out — passed
- src/test/cr2CreatorProfile.test.tsx — chips switch the server kind and tiles open the loaded list at the tapped index — passed
- src/test/cr2CreatorProfile.test.tsx — creator Videos renders three counted RailChips centred with the shared sm geometry — passed
- src/test/cr2CreatorProfile.test.tsx — Long form filters the creator grid and tracks the unchanged chip event — passed
- src/test/cr2CreatorProfile.test.tsx — round pill uses m:ss or N videos and isolates the scorecard tap — passed
- src/test/cr2CreatorProfile.test.tsx — round video collector does not read without a signed-in viewer — passed
- src/test/cr2CreatorProfile.test.tsx — anonymous whole-page default shows Posts without a creator skeleton or creator read — passed
- src/test/cr2CreatorProfile.test.tsx — signed-in whole-page creator default waits in the skeleton then shows Videos without Posts flashing — passed
- src/test/cr2CreatorProfile.test.tsx — signed-in whole-page non-creator defaults to Posts and replaces a Videos deep link with Posts — passed
- src/test/proBadgeMembers.test.ts — Members badge source contract wraps the personal identity row while keeping its badge group unsplit — passed
- src/test/proBadgeMembers.test.ts — Members badge source contract shares the plate and rim rule between PRO and Creator — passed
- src/test/proBadgeMembers.test.ts — Members badge source contract uppercases the shared foil letters — passed
- src/test/proBadgeMembers.test.ts — Members badge source contract removes the independent Creator badge rule — passed
- src/test/proBadgeMembers.test.ts — Members badge source contract renders the large Creator foil badge directly after PRO on a creator profile — failed
- src/test/proBadgeMembers.test.ts — Members badge source contract defines the exact plate, amber rim and foil tokens and retires the pearl plate — passed
- src/test/proBadgeMembers.test.ts — Members badge source contract keeps the normal badge at 20px with an inside-box amber rim — passed
- src/test/proBadgeMembers.test.ts — Members badge source contract uses clipped amber foil letters with the signed-off normal type — passed
- src/test/proBadgeMembers.test.ts — Members badge source contract keeps the small badge at 16px with 8.5px letters — passed
- src/test/proBadgeMembers.test.ts — Members badge source contract keeps the island badge at 22px with 10.5px letters and no shadow — passed
- src/test/proBadgeMembers.test.ts — Members badge source contract keeps badge rules free of pill corners and motion while preserving pending and surname rules — passed
- src/test/proBadgeMembers.test.ts — Members badge source contract renders the exact outer class, default PRO, optional AM and small size — passed
- src/test/proVerification2.test.tsx — Brief 2 public pro identity batches and deduplicates all visible screen ids into one RPC — passed
- src/test/proVerification2.test.tsx — Brief 2 public pro identity caches returned and absent identities per id for five minutes — passed
- src/test/proVerification2.test.tsx — Brief 2 public pro identity invalidating own status refetches visible identities — passed
- src/test/proVerification2.test.tsx — Brief 2 public pro identity pending and unverified ids have no pro identity — passed
- src/test/proVerification2.test.tsx — Brief 2 public pro identity failed public reads never grant a label — passed
- src/test/proVerification2.test.tsx — Brief 2 public pro identity pro identity precedes Creator in the cover identity row — passed
- src/test/proVerification2.test.tsx — Brief 2 profile visibility rules linked tour pro gets a public Tour tab — passed
- src/test/proVerification2.test.tsx — Brief 2 profile visibility rules unlinked pro with results gets the Tour tab, owner and visitor — passed
- src/test/proVerification2.test.tsx — Brief 2 profile visibility rules unlinked pro with no results gets no Tour tab, owner included — passed
- src/test/proVerification2.test.tsx — Brief 2 profile visibility rules connected pro owner keeps Tour but no Handicap — passed
- src/test/proVerification2.test.tsx — Brief 2 profile visibility rules teaching pro gets neither Tour nor Handicap tab — passed
- src/test/proVerification2.test.tsx — Brief 2 profile visibility rules ordinary owner retains Handicap — passed
- src/test/proVerification2.test.tsx — Brief 2 profile visibility rules pending note is private to the owner — passed
- src/test/proVerification2.test.tsx — Brief 2 profile visibility rules verified profile suppresses pending note — passed
- src/test/proVerification2.test.tsx — Brief 2 Tour results reads current season and shows eight starts with both player links — passed
- src/test/proVerification2.test.tsx — Brief 2 Tour results falls back exactly one season only when current results are empty — passed
- src/test/proVerification2.test.tsx — Brief 2 Tour results does not borrow previous season after a current-season error — passed
- src/test/proVerification2.test.tsx — Brief 2 Tour results unlinked pro with results shows year-grouped rows that open the result sheet — passed
- src/test/proVerification2.test.tsx — Brief 2 Tour results unlinked pro with no results renders nothing, owner included — passed

No authenticated or 320px visual verification claimed; badge appearance and ProProfileBuildOne unchanged.
