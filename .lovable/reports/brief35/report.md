# Brief 35 — Share your ten: new card. STOPPED at test gate (build complete)

No SQL, migrations, writes, triggers or schedules. feed_config untouched; round_pool_cap 30. "Fix all" not used.

## Files
- `topTenShare/TopTenShareCard.tsx` — rebuilt to mock A/B (story ×1.35, post ×1.2656 of mock units); ten-position block, empty #16161A cells only for empty positions, CSS course fallback (course gradient + initials) for a present course without a photo, glass pill (rgba kept), footer identity line.
- `topTenShare/resolveSharePhotos.ts` (new) — CORS fetch → course-image-proxy → null + warning `{position, host}`.
- `topTenShare/TopTenShareSheet.tsx` — all ten photos; **removed the "Photo of my number one" toggle** (`showHeroPhoto`), which only served the old hero. Locale key `topTen.share.showHeroPhoto` left in place (unused).
- `topTenShare/exportShareCard.ts` — export copy drops backdrop-filter on pills (foreignObject drew it as a square halo); rgba background carries the pill.
- `ProfileTopTenRail.tsx` — passes the owner's first name to the card.
- `supabase/functions/course-image-proxy/{handler.ts,index.ts}`, `supabase/config.toml` (verify_jwt=false; public course photos only).

## Edge function
`course-image-proxy` **deployed**. Live: random uuid → 404; Turnberry-host course (`media.clbhouz.co.uk`, no CORS header) → 200 image/jpeg, ACAO *, Cache-Control public, max-age=86400.

## Exports
`captures/share-story.png` (1080×1920) and `captures/share-post.png` (1080×1349): a fixture ten of real catalogue courses (not Ben's account — sign-in cannot be created here). 16 direct CORS fetches were blocked in the browser (courses./media.clbhouz.co.uk); all ten tiles carry photographs via the proxy, 0 fallbacks.

## Tests
Typecheck: `showHeroPhoto` is accepted and ignored so `topTenShareCard.test.tsx:47` type-checks without a test edit.
Four sequential shards: 2,568 + 2,567 + 2,711 + 2,894 = **10,740 / 936 files**, 12 failing. Since Brief 34 (10,729/935): +11/+1 = new `brief35ShareCard.test.tsx` (11 pass).
Still failing from Brief 34 (awaiting ruling, 9): brief31TopTen pills; topTenOwnerLabelRender ×6; topTenTileWidth ×1; proProfileScale ×1.
New failures, `topTenShareCard.test.tsx` — encode the old card, not edited:
- "ten courses render a hero, two tiles and seven rows": `expected to have a length of 1 but got +0`
- "a 9.4 rating and an 8.6 are both ink": `expected 'rgb(255, 255, 255)' to be 'rgb(248, 250, 252)'` (pill text is #FFFFFF per brief)
- "the hero place reads variant, then region and sub_country": old hero-place element absent (brief: "<region> · <sub_country or country>")
