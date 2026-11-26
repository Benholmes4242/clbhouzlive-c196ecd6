# Brief 39 — Top 10 alerts open the post

Files changed: activityLinks.ts, supabase/functions/_shared/notifRoute.ts (new top_ten_update post-id branch before the shared top-ten branch); tests below.
process-push-queue: deployed successfully (source sha256 8c9c5520…93e5).

Tests updated (brief changes the documented route):
- brief31TopTen.test.tsx: "top_ten_update routes to the target profile courses tab" → "top_ten_update with a post id routes to the post". Old: toBe('/profile/owner?tab=courses'); new: toBe(`/post/${POST.id}`).
- notifRoute.parity.test.ts: "top_ten_update opens the member courses tab" → "top_ten_update with a post id opens the post". Old: toBe('/profile/u2?tab=courses'); new: toBe(`/post/${POST}`).
Added brief39TopTenAlertPost.test.ts (6: inbox and push × post_id / post entity / no-post fallback). top_ten_comment/reply tests unchanged and passing.

Four sequential shards: 2,581 + 2,580 + 2,772 + 2,830 = 10,763 tests / 941 files, 0 failures. Baseline 10,757/940; +6/+1 = the new file.
No SQL, migrations, feed_config or cap changes; no security Fix all. ten_card_figures.html not used by this brief.
