# WAGR server-owned decision notifications

## Outcome
Removed the client notifications insert and its try/catch from reviewWagrClaim. Order remains admin_review_wagr_link → invalidateAmateurMembers → approve-only sync-amateur-rankings. A local ownership comment documents the server trigger; no other application behaviour changed.

Files: src/features/admin/hooks/useVerifications.ts, src/test/wagrAdmin.test.tsx, roadmap.md, this report. No SQL, migrations or feed_config changes. Ben's trigger and actual push delivery were not independently verified; all tests use mocked services and no real sync was invoked.

## Authorised case changes (wagrAdmin.test.tsx)
- Renamed/reworked “WAGR approval calls review RPC before invoking targeted sync” → “WAGR approval calls review RPC then targeted sync without a notifications insert”. Old: `expect(h.calls).toEqual(['rpc', 'notification', 'sync']);` and `expect(h.notification).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'am', recipient_actor_type: 'user', recipient_actor_id: 'am', actor_id: 'admin', type: 'moderation', title: 'WAGR profile linked', message: 'Your World Amateur Golf Ranking is now on your profile, with the AM badge.' }));`. New: RPC then sync, no insert. Why: notification is server-owned.
- Renamed/reworked “WAGR rejection records the note and never invokes sync” → “WAGR rejection calls review RPC without a notifications insert or sync”. Old: `expect(h.notification).toHaveBeenCalledWith(expect.objectContaining({ title: 'WAGR link not confirmed', message: "We couldn't confirm that WAGR profile is yours. You can try again from Settings." }));`. New: only review RPC, no insert or sync. Note argument assertion preserved. Why: notification is server-owned.
- Updated “WAGR failed approval RPC never invokes sync”: preserved `await expect(reviewWagrClaim('am', true, '')).rejects.toThrow('denied'); expect(h.invoke).not.toHaveBeenCalled();`; added exact RPC arguments and no notification insert. Why: explicitly cover the authorised failed-review rule.
- Deleted “WAGR notification failure warns without failing the review or skipping sync”. Assertions: `expect(warn).toHaveBeenCalled(); expect(h.invoke).toHaveBeenCalled();`. Why: removed client notification path has no failure/warning to exercise; replaced by approval/no-insert coverage.
- Deleted “WAGR approval notifies even when the following sync fails”. Assertions: `await expect(reviewWagrClaim('am', true, '')).rejects.toThrow('sync blocked'); expect(h.calls).toEqual(['rpc', 'notification']); expect(h.notification).toHaveBeenCalled();`. Why: obsolete client-notification contract; replaced by approved RPC→sync/no-insert coverage. Source sync error handling remains unchanged.

## Counts and commands
Before: 8,693 full-suite cases, wagrAdmin 7. After: 8,691 full-suite cases, wagrAdmin 5. Delta −2 is exactly the two deleted cases named above; no additions or other deletions.

Each shard ran in its own command:
```text
bunx vitest run --shard=1/4 --maxWorkers=2 --reporter=json --outputFile=/tmp/wagr-notify/shard-1.json
bunx vitest run --shard=2/4 --maxWorkers=2 --reporter=json --outputFile=/tmp/wagr-notify/shard-2.json
bunx vitest run --shard=3/4 --maxWorkers=2 --reporter=json --outputFile=/tmp/wagr-notify/shard-3.json
bunx vitest run --shard=4/4 --maxWorkers=2 --reporter=json --outputFile=/tmp/wagr-notify/shard-4.json
```

| Shard | Executed | Passed | Failed |
|---|---:|---:|---:|
| 1/4 | 2,224 | 2,224 | 0 |
| 2/4 | 2,083 | 2,083 | 0 |
| 3/4 | 2,187 | 2,187 | 0 |
| 4/4 | 2,197 | 2,197 | 0 |
| Total | 8,691 | 8,691 | 0 |

All four exited 0, success=true. Preview log: build OK at 2026-11-14T12:18:58Z. git diff --check passed.

## Exact source and test diff
```diff
diff --git a/src/features/admin/hooks/useVerifications.ts b/src/features/admin/hooks/useVerifications.ts
index 22b0e0556a..78631dbff5 100644
--- a/src/features/admin/hooks/useVerifications.ts
+++ b/src/features/admin/hooks/useVerifications.ts
@@ -205,22 +205,11 @@ export async function fetchVerifications(): Promise<VerificationRow[]> {
   );
 }
 
+// WAGR decision notifications belong to wagr_link_decision_notify; the client only reviews, invalidates and syncs approvals.
 export async function reviewWagrClaim(userId: string, approve: boolean, note: string) {
   const reviewed = await supabase.rpc('admin_review_wagr_link', { p_user: userId, p_approve: approve, p_note: note });
   if (reviewed.error) throw reviewed.error;
   invalidateAmateurMembers();
-  try {
-    const { data: { user } } = await supabase.auth.getUser();
-    if (user) {
-      const result = await supabase.from('notifications').insert({
-        user_id: userId, recipient_actor_type: 'user', recipient_actor_id: userId,
-        actor_id: user.id, type: 'moderation',
-        title: approve ? 'WAGR profile linked' : 'WAGR link not confirmed',
-        message: approve ? 'Your World Amateur Golf Ranking is now on your profile, with the AM badge.' : "We couldn't confirm that WAGR profile is yours. You can try again from Settings.",
-      });
-      if (result.error) throw result.error;
-    }
-  } catch (error) { console.warn('[wagr] notify failed', error); }
   if (approve) {
     const synced = await supabase.functions.invoke('sync-amateur-rankings', { body: { user_id: userId } });
     if (synced.error || synced.data?.errored > 0) throw new Error(synced.error?.message ?? 'Approved, but the WAGR sync failed.');
diff --git a/src/test/wagrAdmin.test.tsx b/src/test/wagrAdmin.test.tsx
index eaa0a7e31e..78c12cc1ac 100644
--- a/src/test/wagrAdmin.test.tsx
+++ b/src/test/wagrAdmin.test.tsx
@@ -26,33 +26,25 @@ it('WAGR pending claims have their own count and do not inflate pro/golfer count
   expect(hook.result.current.data.find(row => row.id === 'am')).toMatchObject({ type: 'wagr', wagrName: 'Lewy', displayName: 'Member' });
   hook.unmount(); client.clear();
 });
-it('WAGR approval calls review RPC before invoking targeted sync', async () => {
+it('WAGR approval calls review RPC then targeted sync without a notifications insert', async () => {
   await reviewWagrClaim('am', true, 'Confirmed');
-  expect(h.calls).toEqual(['rpc', 'notification', 'sync']);
-  expect(h.notification).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'am', recipient_actor_type: 'user', recipient_actor_id: 'am', actor_id: 'admin', type: 'moderation', title: 'WAGR profile linked', message: 'Your World Amateur Golf Ranking is now on your profile, with the AM badge.' }));
+  expect(h.calls).toEqual(['rpc', 'sync']);
+  expect(h.notification).not.toHaveBeenCalled();
   expect(h.rpc).toHaveBeenCalledWith('admin_review_wagr_link', { p_user: 'am', p_approve: true, p_note: 'Confirmed' });
   expect(h.invoke).toHaveBeenCalledWith('sync-amateur-rankings', { body: { user_id: 'am' } });
 });
-it('WAGR rejection records the note and never invokes sync', async () => {
+it('WAGR rejection calls review RPC without a notifications insert or sync', async () => {
   await reviewWagrClaim('am', false, 'Different person'); expect(h.invoke).not.toHaveBeenCalled();
   expect(h.rpc).toHaveBeenCalledWith('admin_review_wagr_link', { p_user: 'am', p_approve: false, p_note: 'Different person' });
-  expect(h.notification).toHaveBeenCalledWith(expect.objectContaining({ title: 'WAGR link not confirmed', message: "We couldn't confirm that WAGR profile is yours. You can try again from Settings." }));
+  expect(h.calls).toEqual(['rpc']);
+  expect(h.notification).not.toHaveBeenCalled();
 });
 it('WAGR failed approval RPC never invokes sync', async () => {
   h.rpc.mockResolvedValue({ data: null, error: new Error('denied') });
   await expect(reviewWagrClaim('am', true, '')).rejects.toThrow('denied'); expect(h.invoke).not.toHaveBeenCalled();
+  expect(h.rpc).toHaveBeenCalledWith('admin_review_wagr_link', { p_user: 'am', p_approve: true, p_note: '' });
+  expect(h.notification).not.toHaveBeenCalled();
 });
 it('WAGR failed queue read is not treated as no claims', async () => {
   h.failed = true; await expect(fetchVerifications()).rejects.toThrow('denied');
-});
-it('WAGR notification failure warns without failing the review or skipping sync', async () => {
-  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
-  h.notification.mockResolvedValue({ error: new Error('notification denied') });
-  await reviewWagrClaim('am', true, '');
-  expect(warn).toHaveBeenCalled(); expect(h.invoke).toHaveBeenCalled(); warn.mockRestore();
-});
-it('WAGR approval notifies even when the following sync fails', async () => {
-  h.invoke.mockResolvedValue({ error: new Error('sync blocked') });
-  await expect(reviewWagrClaim('am', true, '')).rejects.toThrow('sync blocked');
-  expect(h.calls).toEqual(['rpc', 'notification']); expect(h.notification).toHaveBeenCalled();
 });
\ No newline at end of file
```
