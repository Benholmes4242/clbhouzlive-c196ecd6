# Canonical heading Brief 4 — close-out report

## Status and scope

Accepted implementation: `0540845934`; accepted test continuation: `6b68bfe45d`. This close-out changes documentation/evidence only. No application code, test, SQL, migration, feed_config or round_pool_cap changes.

**Close-out is not fully green:** the accepted previous run remains 9,964/9,964 across 879 files. Its raw shard logs were absent from disk and repository, so four fresh sequential runs were made to retain genuine full output. Shard 4 unexpectedly timed out in the existing guard. Testing stopped with no retry or repair. The corrected census also finds 199 rather than the requested 198; the extra declaration is documented below, not removed.

## Every production change

112 changed source lines across 50 production files: 101 above-700 occurrences normalised to 700, plus eleven authorised 650→600 declarations. Location numbers below are from the saved source change ledger; full original lines are quoted, so unrelated same-line conditions remain visible.

### `src/components/course-media-tab/CourseMediaEmptyStates.tsx:115`

**Before**
```tsx
    <button type="button" onClick={onAdd} style={{ marginTop: 14, width: '100%', height: 44, borderRadius: 12, background: '#F8FAFC', color: '#0A0A0C', fontSize: 14.5, fontWeight: 650, border: 0 }}>{t('media.empty.add', { defaultValue: 'Add a photo or video' })}</button>
```
**After**
```tsx
    <button type="button" onClick={onAdd} style={{ marginTop: 14, width: '100%', height: 44, borderRadius: 12, background: '#F8FAFC', color: '#0A0A0C', fontSize: 14.5, fontWeight: 600, border: 0 }}>{t('media.empty.add', { defaultValue: 'Add a photo or video' })}</button>
```

### `src/components/course-media-tab/HolePhotoPicker.tsx:39`

**Before**
```tsx
            className="aspect-square h-auto min-w-0 p-0 rounded-[9px] text-sm font-extrabold tabular-nums"
```
**After**
```tsx
            className="aspect-square h-auto min-w-0 p-0 rounded-[9px] text-sm font-bold tabular-nums"
```

### `src/components/course-media-tab/HolePhotoTagButton.tsx:11`

**Before**
```tsx
  if (assigned != null) return <span className="absolute right-[5px] bottom-[5px] z-10 rounded-full px-2 py-[3px] text-[9.5px] font-extrabold" style={{ background: A.INK, color: A.CANVAS }}>Hole {assigned}</span>;
```
**After**
```tsx
  if (assigned != null) return <span className="absolute right-[5px] bottom-[5px] z-10 rounded-full px-2 py-[3px] text-[9.5px] font-bold" style={{ background: A.INK, color: A.CANVAS }}>Hole {assigned}</span>;
```

### `src/components/course-media-tab/HolePhotoTagButton.tsx:13`

**Before**
```tsx
  return <Button variant="ghost" size="sm" aria-label={post.mediaItems[0]?.type === 'video' ? 'Tag video' : 'Tag photograph'} className="absolute right-[5px] bottom-[5px] z-10 h-auto min-h-0 rounded-full px-2 py-[3px] text-[9.5px] font-extrabold uppercase tracking-[0.06em]"
```
**After**
```tsx
  return <Button variant="ghost" size="sm" aria-label={post.mediaItems[0]?.type === 'video' ? 'Tag video' : 'Tag photograph'} className="absolute right-[5px] bottom-[5px] z-10 h-auto min-h-0 rounded-full px-2 py-[3px] text-[9.5px] font-bold uppercase tracking-[0.06em]"
```

### `src/components/course-media-tab/hole-photo-fast.css:37`

**Before**
```tsx
.hole-photo-batch-badge { position: absolute; left: 3px; top: 3px; z-index: 2; min-width: 16px; height: 16px; padding: 0 4px; border-radius: 999px; display: flex; align-items: center; justify-content: center; font-size: 9.5px; font-weight: 800; color: #fff; background: var(--hole-photo-success); }
```
**After**
```tsx
.hole-photo-batch-badge { position: absolute; left: 3px; top: 3px; z-index: 2; min-width: 16px; height: 16px; padding: 0 4px; border-radius: 999px; display: flex; align-items: center; justify-content: center; font-size: 9.5px; font-weight: 700; color: #fff; background: var(--hole-photo-success); }
```

### `src/components/course-media-tab/media-v2.css:46`

**Before**
```tsx
.media-v2-primary { width:100%; height:44px; margin-top:14px; border-radius:12px; background:var(--media-v2-ink); color:var(--media-v2-canvas); font-size:14.5px; font-weight:650; white-space:normal; }
```
**After**
```tsx
.media-v2-primary { width:100%; height:44px; margin-top:14px; border-radius:12px; background:var(--media-v2-ink); color:var(--media-v2-canvas); font-size:14.5px; font-weight:600; white-space:normal; }
```

### `src/components/course-media-tab/media-v2.css:50`

**Before**
```tsx
.media-v2-untagged > span { font-size:13px; font-weight:650; flex:none; }
```
**After**
```tsx
.media-v2-untagged > span { font-size:13px; font-weight:600; flex:none; }
```

### `src/components/course-media-tab/media-v3.css:17`

**Before**
```tsx
.media-v3-tag-hole { height:34px; min-width:0; padding:0; border-radius:9px; border:1px solid var(--media-v2-hair); background:var(--media-v2-inset); color:var(--media-v2-ink); font-size:13px; font-weight:650; font-variant-numeric:tabular-nums; }
```
**After**
```tsx
.media-v3-tag-hole { height:34px; min-width:0; padding:0; border-radius:9px; border:1px solid var(--media-v2-hair); background:var(--media-v2-inset); color:var(--media-v2-ink); font-size:13px; font-weight:600; font-variant-numeric:tabular-nums; }
```

### `src/components/course-media-tab/media-v3.css:26`

**Before**
```tsx
.media-v3-tag-primary { min-width:0; flex:1; height:48px; border-radius:14px; background:var(--media-v2-ink); color:var(--media-v2-canvas); font-size:15px; font-weight:650; white-space:normal; }
```
**After**
```tsx
.media-v3-tag-primary { min-width:0; flex:1; height:48px; border-radius:14px; background:var(--media-v2-ink); color:var(--media-v2-canvas); font-size:15px; font-weight:600; white-space:normal; }
```

### `src/components/course-media-tab/shot-tag-choices.css:10`

**Before**
```tsx
.shot-tag-segments button { height:36px;border-radius:9px;background:transparent;color:var(--media-v2-mute);font-size:14px;font-weight:650;padding:0 8px;white-space:normal; }
```
**After**
```tsx
.shot-tag-segments button { height:36px;border-radius:9px;background:transparent;color:var(--media-v2-mute);font-size:14px;font-weight:600;padding:0 8px;white-space:normal; }
```

### `src/components/course-media-tab/shot-tag-choices.css:20`

**Before**
```tsx
.shot-tag-primary { flex:1;min-width:0;width:auto;height:50px;border-radius:14px;background:var(--media-v2-ink);color:var(--media-v2-canvas);font-size:15px;font-weight:650;white-space:normal; }
```
**After**
```tsx
.shot-tag-primary { flex:1;min-width:0;width:auto;height:50px;border-radius:14px;background:var(--media-v2-ink);color:var(--media-v2-canvas);font-size:15px;font-weight:600;white-space:normal; }
```

### `src/components/courses/CourseMasthead.tsx:35`

**Before**
```tsx
  fontWeight: 800,
```
**After**
```tsx
  fontWeight: 700,
```

### `src/components/courses/CourseMasthead.tsx:77`

**Before**
```tsx
  fontWeight: 800,
```
**After**
```tsx
  fontWeight: 700,
```

### `src/components/courses/browse/ListScopeHeader.tsx:22`

**Before**
```tsx
  fontWeight: 800,
```
**After**
```tsx
  fontWeight: 700,
```

### `src/components/courses/browse/ListScopeHeader.tsx:31`

**Before**
```tsx
  fontWeight: 800,
```
**After**
```tsx
  fontWeight: 700,
```

### `src/components/courses/browse/PlayedTile.tsx:108`

**Before**
```tsx
        <b data-tile-title="" style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden', overflowWrap: 'anywhere', fontSize: 18, lineHeight: `${TILE_NAME_LINE}px`, fontWeight: 800, color: A.INK }}>{title}</b>
```
**After**
```tsx
        <b data-tile-title="" style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden', overflowWrap: 'anywhere', fontSize: 18, lineHeight: `${TILE_NAME_LINE}px`, fontWeight: 700, color: A.INK }}>{title}</b>
```

### `src/components/courses/browse/PlayedTile.tsx:114`

**Before**
```tsx
          <span data-best-kicker="" style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '.14em', color: A.INK, lineHeight: '10px' }}>ROUNDS LATELY</span>
```
**After**
```tsx
          <span data-best-kicker="" style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '.14em', color: A.INK, lineHeight: '10px' }}>ROUNDS LATELY</span>
```

### `src/components/courses/browse/PlayedTile.tsx:144`

**Before**
```tsx
            <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '.14em', color: A.INK, lineHeight: '10px' }}>LATEST REVIEW</span>
```
**After**
```tsx
            <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '.14em', color: A.INK, lineHeight: '10px' }}>LATEST REVIEW</span>
```

### `src/components/courses/browse/PlayedTile.tsx:176`

**Before**
```tsx
                <span style={{ transform: 'translateZ(0)', position: 'absolute', top: 8, left: 10, fontSize: 28, fontWeight: 800, letterSpacing: '-.04em', lineHeight: 1 }}>{p.holeNo}</span>
```
**After**
```tsx
                <span style={{ transform: 'translateZ(0)', position: 'absolute', top: 8, left: 10, fontSize: 28, fontWeight: 700, letterSpacing: '-.04em', lineHeight: 1 }}>{p.holeNo}</span>
```

### `src/components/courses/browse/PlayedTile.tsx:177`

**Before**
```tsx
                {tile.hardestHole === p.holeNo ? <span data-hardest="" style={{ transform: 'translateZ(0)', position: 'absolute', top: 10, right: 8, padding: '3px 6px', borderRadius: 6, background: 'rgba(10,10,12,.6)', color: A.AMBER, fontSize: 8, fontWeight: 800, letterSpacing: '.1em', lineHeight: '10px' }}>HARDEST</span> : null}
```
**After**
```tsx
                {tile.hardestHole === p.holeNo ? <span data-hardest="" style={{ transform: 'translateZ(0)', position: 'absolute', top: 10, right: 8, padding: '3px 6px', borderRadius: 6, background: 'rgba(10,10,12,.6)', color: A.AMBER, fontSize: 8, fontWeight: 700, letterSpacing: '.1em', lineHeight: '10px' }}>HARDEST</span> : null}
```

### `src/components/courses/browse/PlayedTile.tsx:185`

**Before**
```tsx
                <span style={{ ...GLASS, boxShadow: undefined, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', transform: 'translateZ(0)', position: 'absolute', top: 10, left: 10, padding: '3px 7px', borderRadius: 6, fontSize: 8, fontWeight: 800, letterSpacing: '.12em', lineHeight: '10px', color: '#FFFFFF' }}>COURSE</span>
```
**After**
```tsx
                <span style={{ ...GLASS, boxShadow: undefined, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', transform: 'translateZ(0)', position: 'absolute', top: 10, left: 10, padding: '3px 7px', borderRadius: 6, fontSize: 8, fontWeight: 700, letterSpacing: '.12em', lineHeight: '10px', color: '#FFFFFF' }}>COURSE</span>
```

### `src/components/courses/browse/RegionRails.tsx:36`

**Before**
```tsx
const nameStyle: React.CSSProperties = { display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden', fontSize: 14, fontWeight: 800, lineHeight: 1.15 };
```
**After**
```tsx
const nameStyle: React.CSSProperties = { display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden', fontSize: 14, fontWeight: 700, lineHeight: 1.15 };
```

### `src/components/courses/browse/RegionRails.tsx:56`

**Before**
```tsx
        <span data-rail-count="" style={{ ...glassTop, fontSize: 10, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: '#FFFFFF' }}>{fmtCount(group.activity)}</span>
```
**After**
```tsx
        <span data-rail-count="" style={{ ...glassTop, fontSize: 10, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: '#FFFFFF' }}>{fmtCount(group.activity)}</span>
```

### `src/components/courses/browse/RegionRails.tsx:67`

**Before**
```tsx
                Best round <b data-best-gross="" style={{ color: '#FFFFFF', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{best.gross_score}</b>
```
**After**
```tsx
                Best round <b data-best-gross="" style={{ color: '#FFFFFF', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{best.gross_score}</b>
```

### `src/components/courses/browse/latestHoles.css:11`

**Before**
```tsx
.latest-hole-label { margin-top: 6px; font-size: 8.5px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; color: var(--latest-hole-label-ink); text-shadow: var(--latest-hole-label-shadow); }
```
**After**
```tsx
.latest-hole-label { margin-top: 6px; font-size: 8.5px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--latest-hole-label-ink); text-shadow: var(--latest-hole-label-shadow); }
```

### `src/components/courses/course-detail/CategoryScores.tsx:92`

**Before**
```tsx
            <div style={{ marginTop: 3, fontSize: 8, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: A.DIM, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
```
**After**
```tsx
            <div style={{ marginTop: 3, fontSize: 8, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: A.DIM, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
```

### `src/components/courses/course-detail/ClaimCourseSheet.tsx:109`

**Before**
```tsx
      fontWeight: 650,
```
**After**
```tsx
      fontWeight: 600,
```

### `src/components/courses/course-detail/CourseWebsiteSheet.tsx:427`

**Before**
```tsx
                fontWeight: 650,
```
**After**
```tsx
                fontWeight: 600,
```

### `src/components/courses/course-detail/about/DefendsPar.tsx:162`

**Before**
```tsx
                style={{ textAlign: 'center', fontSize: 8.5, fontWeight: hi ? 800 : 700, color: hi ?? A.FAINT, ...FIGS }}
```
**After**
```tsx
                style={{ textAlign: 'center', fontSize: 8.5, fontWeight: 700, color: hi ?? A.FAINT, ...FIGS }}
```

### `src/components/courses/course-detail/about/DefendsPar.tsx:182`

**Before**
```tsx
            <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.03em', color: A.INK, ...FIGS }}>{c.v}</div>
```
**After**
```tsx
            <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.03em', color: A.INK, ...FIGS }}>{c.v}</div>
```

### `src/components/courses/course-detail/about/DefendsPar.tsx:245`

**Before**
```tsx
                  fontWeight: 800,
```
**After**
```tsx
                  fontWeight: 700,
```

### `src/components/courses/course-detail/about/DefendsPar.tsx:285`

**Before**
```tsx
                <div style={{ fontSize: 15, fontWeight: 800, color: b.key === 'par' ? A.INK : b.color, ...FIGS }}>
```
**After**
```tsx
                <div style={{ fontSize: 15, fontWeight: 700, color: b.key === 'par' ? A.INK : b.color, ...FIGS }}>
```

### `src/components/courses/course-detail/about/HeroCourseRecord.tsx:70`

**Before**
```tsx
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.13em', textTransform: 'uppercase', color: MEDAL_GOLD, lineHeight: 1.2 }}>
```
**After**
```tsx
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase', color: MEDAL_GOLD, lineHeight: 1.2 }}>
```

### `src/components/courses/course-detail/about/HeroCourseRecord.tsx:78`

**Before**
```tsx
        <span className="tabular-nums lining-nums" style={{ fontSize: 21, fontWeight: 800, color: MEDAL_GOLD, lineHeight: 1 }}>
```
**After**
```tsx
        <span className="tabular-nums lining-nums" style={{ fontSize: 21, fontWeight: 700, color: MEDAL_GOLD, lineHeight: 1 }}>
```

### `src/components/courses/course-detail/about/TheVerdict.tsx:58`

**Before**
```tsx
        <div style={{ fontSize: 62, fontWeight: 800, letterSpacing: '-0.055em', lineHeight: 0.82, color: A.INK, ...FIGS }}>
```
**After**
```tsx
        <div style={{ fontSize: 62, fontWeight: 700, letterSpacing: '-0.055em', lineHeight: 0.82, color: A.INK, ...FIGS }}>
```

### `src/components/courses/course-detail/about/WhatPeopleSay.tsx:151`

**Before**
```tsx
          <strong style={{ color: A.INK, fontSize: 48, lineHeight: 0.9, fontWeight: 800, ...FIGS }}>{yours.toFixed(1)}</strong>
```
**After**
```tsx
          <strong style={{ color: A.INK, fontSize: 48, lineHeight: 0.9, fontWeight: 700, ...FIGS }}>{yours.toFixed(1)}</strong>
```

### `src/components/courses/course-detail/about/WhatPeopleSay.tsx:179`

**Before**
```tsx
          <strong data-community-score style={{ color: SURFACE.dark.ink, fontSize: 48, lineHeight: 0.9, fontWeight: 800, ...FIGS }}>{score?.toFixed(1)}</strong>
```
**After**
```tsx
          <strong data-community-score style={{ color: SURFACE.dark.ink, fontSize: 48, lineHeight: 0.9, fontWeight: 700, ...FIGS }}>{score?.toFixed(1)}</strong>
```

### `src/components/courses/course-detail/about/WhatPeopleSay.tsx:186`

**Before**
```tsx
        {ratedViewer && community.delta != null && <div data-viewer-delta style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, padding: '5px 10px', whiteSpace: 'nowrap', flex: '0 0 auto', borderRadius: 999, border: `1px solid ${inkWithAlpha(A.AMBER, 0.35)}`, background: inkWithAlpha(A.AMBER, 0.07) }}><span style={{ color: SURFACE.dark.mute, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>You</span><b style={{ color: A.INK, fontSize: 14, ...FIGS }}>{yours?.toFixed(1)}</b><span style={{ color: A.INK, fontSize: 10, fontWeight: 800, ...FIGS }}>{community.delta > 0 ? '▲' : community.delta < 0 ? '▼' : ''} {Math.abs(community.delta).toFixed(1)}</span></div>}
```
**After**
```tsx
        {ratedViewer && community.delta != null && <div data-viewer-delta style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, padding: '5px 10px', whiteSpace: 'nowrap', flex: '0 0 auto', borderRadius: 999, border: `1px solid ${inkWithAlpha(A.AMBER, 0.35)}`, background: inkWithAlpha(A.AMBER, 0.07) }}><span style={{ color: SURFACE.dark.mute, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>You</span><b style={{ color: A.INK, fontSize: 14, ...FIGS }}>{yours?.toFixed(1)}</b><span style={{ color: A.INK, fontSize: 10, fontWeight: 700, ...FIGS }}>{community.delta > 0 ? '▲' : community.delta < 0 ? '▼' : ''} {Math.abs(community.delta).toFixed(1)}</span></div>}
```

### `src/components/courses/course-detail/about/verdictBits.tsx:25`

**Before**
```tsx
    <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em', color: A.INK, ...FIGS }}>{value}</div>
```
**After**
```tsx
    <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.03em', color: A.INK, ...FIGS }}>{value}</div>
```

### `src/components/courses/course-detail/reviews/FewReviews.tsx:69`

**Before**
```tsx
          <strong data-community-score style={{ color: SURFACE.dark.ink, fontSize: 48, lineHeight: 0.9, fontWeight: 800, ...FIGS }}>{community.score?.toFixed(1)}</strong>
```
**After**
```tsx
          <strong data-community-score style={{ color: SURFACE.dark.ink, fontSize: 48, lineHeight: 0.9, fontWeight: 700, ...FIGS }}>{community.score?.toFixed(1)}</strong>
```

### `src/components/courses/course-detail/reviews/FewReviews.tsx:75`

**Before**
```tsx
          {ratedViewer && community.delta != null && <div data-viewer-delta style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, padding: '5px 10px', whiteSpace: 'nowrap', flex: '0 0 auto', borderRadius: 999, border: `1px solid ${inkWithAlpha(A.AMBER, 0.35)}`, background: inkWithAlpha(A.AMBER, 0.07) }}><span style={{ color: SURFACE.dark.mute, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>You</span><b style={{ color: A.AMBER, fontSize: 14, ...FIGS }}>{community.viewerScore?.toFixed(1)}</b><span style={{ color: A.IMPROVED, fontSize: 10, fontWeight: 800, ...FIGS }}>{community.delta > 0 ? '▲' : community.delta < 0 ? '▼' : ''} {Math.abs(community.delta).toFixed(1)}</span></div>}
```
**After**
```tsx
          {ratedViewer && community.delta != null && <div data-viewer-delta style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, padding: '5px 10px', whiteSpace: 'nowrap', flex: '0 0 auto', borderRadius: 999, border: `1px solid ${inkWithAlpha(A.AMBER, 0.35)}`, background: inkWithAlpha(A.AMBER, 0.07) }}><span style={{ color: SURFACE.dark.mute, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>You</span><b style={{ color: A.AMBER, fontSize: 14, ...FIGS }}>{community.viewerScore?.toFixed(1)}</b><span style={{ color: A.IMPROVED, fontSize: 10, fontWeight: 700, ...FIGS }}>{community.delta > 0 ? '▲' : community.delta < 0 ? '▼' : ''} {Math.abs(community.delta).toFixed(1)}</span></div>}
```

### `src/components/courses/course-detail/reviews/FewReviews.tsx:97`

**Before**
```tsx
    {facts && known.length > 0 && <section style={section}><span style={{ display: 'inline-block', color: MEDAL_GOLD, background: inkWithAlpha(MEDAL_GOLD, 0.10), border: `1px solid ${inkWithAlpha(MEDAL_GOLD, 0.28)}`, borderRadius: 999, padding: '3px 9px', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', marginBottom: 11 }}>People you know</span>{known.map(review => renderPerson(review, true))}</section>}
```
**After**
```tsx
    {facts && known.length > 0 && <section style={section}><span style={{ display: 'inline-block', color: MEDAL_GOLD, background: inkWithAlpha(MEDAL_GOLD, 0.10), border: `1px solid ${inkWithAlpha(MEDAL_GOLD, 0.28)}`, borderRadius: 999, padding: '3px 9px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginBottom: 11 }}>People you know</span>{known.map(review => renderPerson(review, true))}</section>}
```

### `src/components/courses/course-detail/reviews/SingleReview.tsx:65`

**Before**
```tsx
      <div data-community-score style={{ fontSize: 48, fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 0.9, color: A.INK, ...FIGS }}>{Number(communityScore).toFixed(1)}</div>
```
**After**
```tsx
      <div data-community-score style={{ fontSize: 48, fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 0.9, color: A.INK, ...FIGS }}>{Number(communityScore).toFixed(1)}</div>
```

### `src/components/courses/course-detail/reviews/SingleReview.tsx:110`

**Before**
```tsx
      {month && <span data-played-season style={{ display: 'inline-block', marginTop: 9, padding: '3px 9px', borderRadius: 999, color: SC_BOGEY_DARK, background: inkWithAlpha(SC_BOGEY_DARK, 0.10), border: `1px solid ${inkWithAlpha(SC_BOGEY_DARK, 0.22)}`, fontSize: 10, fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase' }}>Played {month}</span>}
```
**After**
```tsx
      {month && <span data-played-season style={{ display: 'inline-block', marginTop: 9, padding: '3px 9px', borderRadius: 999, color: SC_BOGEY_DARK, background: inkWithAlpha(SC_BOGEY_DARK, 0.10), border: `1px solid ${inkWithAlpha(SC_BOGEY_DARK, 0.22)}`, fontSize: 10, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase' }}>Played {month}</span>}
```

### `src/components/courses/course-detail/reviews/TheScore.tsx:52`

**Before**
```tsx
  fontSize: 9.5, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', lineHeight: 1,
```
**After**
```tsx
  fontSize: 9.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', lineHeight: 1,
```

### `src/components/courses/course-detail/reviews/TheScore.tsx:55`

**Before**
```tsx
  ...FIGS, fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, marginTop: 8,
```
**After**
```tsx
  ...FIGS, fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1, marginTop: 8,
```

### `src/components/courses/course-detail/you/BoardList.tsx:59`

**Before**
```tsx
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: r.held ? A.DIM : MEDAL_GOLD }}>
```
**After**
```tsx
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: r.held ? A.DIM : MEDAL_GOLD }}>
```

### `src/components/courses/course-detail/you/UnclaimedCourseSection.tsx:58`

**Before**
```tsx
          <div className="tabular-nums" style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, color: MEDAL_GOLD, ...FIGS }}>
```
**After**
```tsx
          <div className="tabular-nums" style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1, color: MEDAL_GOLD, ...FIGS }}>
```

### `src/components/courses/course-detail/you/many/ManySections.tsx:39`

**Before**
```tsx
    <div style={{ width: 40, textAlign: 'right', fontSize: 14, fontWeight: 800, letterSpacing: '-0.02em', color: A.INK, ...FIGS }}>{value}</div>
```
**After**
```tsx
    <div style={{ width: 40, textAlign: 'right', fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em', color: A.INK, ...FIGS }}>{value}</div>
```

### `src/components/courses/course-detail/you/many/ManySections.tsx:151`

**Before**
```tsx
      <div style={{ width: 42, textAlign: 'right', fontSize: 12.5, fontWeight: 800, letterSpacing: '-0.02em', color: under ? RAMP_TOPAR.birdie : A.INK, ...FIGS }}>{signed1(v)}</div>
```
**After**
```tsx
      <div style={{ width: 42, textAlign: 'right', fontSize: 12.5, fontWeight: 700, letterSpacing: '-0.02em', color: under ? RAMP_TOPAR.birdie : A.INK, ...FIGS }}>{signed1(v)}</div>
```

### `src/components/courses/course-detail/you/many/ManySections.tsx:309`

**Before**
```tsx
          <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 0.9, color: Y.GOLD, ...FIGS }}>{done}</div>
```
**After**
```tsx
          <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 0.9, color: Y.GOLD, ...FIGS }}>{done}</div>
```

### `src/components/courses/course-detail/you/many/ManySections.tsx:326`

**Before**
```tsx
                <b style={{ display: 'block', fontSize: 14, fontWeight: 800, letterSpacing: '-0.02em', color: A.INK, ...FIGS }}>{v}</b>
```
**After**
```tsx
                <b style={{ display: 'block', fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em', color: A.INK, ...FIGS }}>{v}</b>
```

### `src/components/courses/course-detail/you/many/ManySections.tsx:361`

**Before**
```tsx
            <b style={{ display: 'block', fontSize: 16, fontWeight: 800, letterSpacing: '-0.03em', color: A.INK, ...FIGS }}>{r.value}</b>
```
**After**
```tsx
            <b style={{ display: 'block', fontSize: 16, fontWeight: 700, letterSpacing: '-0.03em', color: A.INK, ...FIGS }}>{r.value}</b>
```

### `src/components/courses/course-detail/you/many/ManySections.tsx:399`

**Before**
```tsx
          <div style={{ fontSize: 13, fontWeight: 800, color: A.INK, ...FIGS }}>{v}</div>
```
**After**
```tsx
          <div style={{ fontSize: 13, fontWeight: 700, color: A.INK, ...FIGS }}>{v}</div>
```

### `src/components/courses/course-detail/you/many/manyBits.tsx:68`

**Before**
```tsx
          <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.03em', color: f.tone ?? A.INK, ...FIGS }}>{f.value}</div>
```
**After**
```tsx
          <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.03em', color: f.tone ?? A.INK, ...FIGS }}>{f.value}</div>
```

### `src/components/courses/course-detail/you/many/manyBits.tsx:83`

**Before**
```tsx
    <div style={{ fontSize: size, fontWeight: 800, letterSpacing: '-0.045em', lineHeight: 0.9, color: A.INK, ...FIGS }}>{value}</div>
```
**After**
```tsx
    <div style={{ fontSize: size, fontWeight: 700, letterSpacing: '-0.045em', lineHeight: 0.9, color: A.INK, ...FIGS }}>{value}</div>
```

### `src/components/courses/courseListCard.css:12`

**Before**
```tsx
.course-list-name {margin:0; font-size:18px; font-weight:800; letter-spacing:-0.01em; line-height:1.1; color:var(--course-list-photo-ink); text-shadow:var(--course-list-name-shadow); white-space:nowrap; overflow:hidden; text-overflow:ellipsis}
```
**After**
```tsx
.course-list-name {margin:0; font-size:18px; font-weight:700; letter-spacing:-0.01em; line-height:1.1; color:var(--course-list-photo-ink); text-shadow:var(--course-list-name-shadow); white-space:nowrap; overflow:hidden; text-overflow:ellipsis}
```

### `src/components/courses/courseListCard.css:28`

**Before**
```tsx
.course-list-record-label {font-size:8.5px; font-weight:800; letter-spacing:0.14em; line-height:1.1; color:var(--course-list-record)}
```
**After**
```tsx
.course-list-record-label {font-size:8.5px; font-weight:700; letter-spacing:0.14em; line-height:1.1; color:var(--course-list-record)}
```

### `src/components/courses/courseListCard.css:32`

**Before**
```tsx
.course-list-gross-label {margin-top:2px; font-size:8px; font-weight:800; letter-spacing:0.14em; color:var(--course-list-dim)}
```
**After**
```tsx
.course-list-gross-label {margin-top:2px; font-size:8px; font-weight:700; letter-spacing:0.14em; color:var(--course-list-dim)}
```

### `src/components/courses/courseListView.css:6`

**Before**
```tsx
.course-list-columns {padding:0 16px 8px; font-size:9px; font-weight:800; letter-spacing:0.14em; color:var(--course-list-dim)}
```
**After**
```tsx
.course-list-columns {padding:0 16px 8px; font-size:9px; font-weight:700; letter-spacing:0.14em; color:var(--course-list-dim)}
```

### `src/components/courses/top100/t100Race.css:15`

**Before**
```tsx
.t100-captions { position: relative; height: 12px; margin-top: 7px; font-size: 9.5px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--t100-dim); }
```
**After**
```tsx
.t100-captions { position: relative; height: 12px; margin-top: 7px; font-size: 9.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--t100-dim); }
```

### `src/components/courses/top100/t100Race.css:25`

**Before**
```tsx
.t100-photo-rank { position: absolute; left: 8px; top: 6px; font-size: 10px; font-weight: 800; text-shadow: var(--t100-photo-shadow); color: var(--t100-ink); }
```
**After**
```tsx
.t100-photo-rank { position: absolute; left: 8px; top: 6px; font-size: 10px; font-weight: 700; text-shadow: var(--t100-photo-shadow); color: var(--t100-ink); }
```

### `src/components/courses/top100/t100Race.css:26`

**Before**
```tsx
.t100-photo-name { position: absolute; left: 8px; right: 8px; bottom: 7px; font-size: 10px; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; line-height: 1.15; text-align: left; white-space: normal; color: var(--t100-ink); text-shadow: var(--t100-photo-shadow); display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; }
```
**After**
```tsx
.t100-photo-name { position: absolute; left: 8px; right: 8px; bottom: 7px; font-size: 10px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; line-height: 1.15; text-align: left; white-space: normal; color: var(--t100-ink); text-shadow: var(--t100-photo-shadow); display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; }
```

### `src/components/courses/top100/t100Race.css:43`

**Before**
```tsx
.t100-see { display: flex; gap: 6px; height: auto; padding: 14px 16px 0; border-radius: 0; font-size: 11px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; color: var(--t100-mute); }
```
**After**
```tsx
.t100-see { display: flex; gap: 6px; height: auto; padding: 14px 16px 0; border-radius: 0; font-size: 11px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: var(--t100-mute); }
```

### `src/components/explore-tab-new/courseled/BoardFilterPanel.tsx:435`

**Before**
```tsx
              style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', color: A.INK, lineHeight: 1 }}
```
**After**
```tsx
              style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', color: A.INK, lineHeight: 1 }}
```

### `src/components/explore-tab-new/courseled/BoardRows.tsx:348`

**Before**
```tsx
        fontWeight: 800,
```
**After**
```tsx
        fontWeight: 700,
```

### `src/components/explore-tab-new/courseled/BoardRows.tsx:479`

**Before**
```tsx
                fontWeight: 800,
```
**After**
```tsx
                fontWeight: 700,
```

### `src/components/explore-tab-new/courseled/CompetitionBoards.tsx:57`

**Before**
```tsx
    <div style={{ display: 'flex', alignItems: 'center', lineHeight: 1.25, fontSize: 8, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: A.FAINT, ...style }}>
```
**After**
```tsx
    <div style={{ display: 'flex', alignItems: 'center', lineHeight: 1.25, fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: A.FAINT, ...style }}>
```

### `src/components/explore-tab-new/courseled/CompetitionBoards.tsx:82`

**Before**
```tsx
          <span style={{ lineHeight: 1.25, width: 22, flex: 'none', fontSize: 10, fontWeight: 800, color: isSelf ? A.AMBER : A.FAINT }}>{posText(r)}</span>
```
**After**
```tsx
          <span style={{ lineHeight: 1.25, width: 22, flex: 'none', fontSize: 10, fontWeight: 700, color: isSelf ? A.AMBER : A.FAINT }}>{posText(r)}</span>
```

### `src/components/explore-tab-new/courseled/CompetitionBoards.tsx:126`

**Before**
```tsx
            <span style={{ lineHeight: 1.25, width: 30, flex: 'none', fontSize: 10.5, fontWeight: 800, color: isSelf ? A.AMBER : A.FAINT }}>{posText(r)}</span>
```
**After**
```tsx
            <span style={{ lineHeight: 1.25, width: 30, flex: 'none', fontSize: 10.5, fontWeight: 700, color: isSelf ? A.AMBER : A.FAINT }}>{posText(r)}</span>
```

### `src/components/explore-tab-new/courseled/CompetitionMark.tsx:26`

**Before**
```tsx
      <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', lineHeight: 1 }}>{t('discover.filterBoard.competitionShort', { defaultValue: 'Comp' })}</span>
```
**After**
```tsx
      <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', lineHeight: 1 }}>{t('discover.filterBoard.competitionShort', { defaultValue: 'Comp' })}</span>
```

### `src/components/explore-tab-new/courseled/CoursesPlayedSection.tsx:320`

**Before**
```tsx
                fontWeight: 800,
```
**After**
```tsx
                fontWeight: 700,
```

### `src/components/explore-tab-new/courseled/CoursesPlayedSection.tsx:509`

**Before**
```tsx
        <h3 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 800, lineHeight: 1.25, color: A.INK }}>
```
**After**
```tsx
        <h3 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 700, lineHeight: 1.25, color: A.INK }}>
```

### `src/components/explore-tab-new/courseled/CoursesPlayedSection.tsx:855`

**Before**
```tsx
        <span className="tabular-nums" style={{ fontSize: 17, fontWeight: 800, color: A.INK, lineHeight: 1 }}>
```
**After**
```tsx
        <span className="tabular-nums" style={{ fontSize: 17, fontWeight: 700, color: A.INK, lineHeight: 1 }}>
```

### `src/components/explore-tab-new/courseled/HowTheyPlayedSection.tsx:201`

**Before**
```tsx
            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800, lineHeight: 1.25, color: A.INK }}>
```
**After**
```tsx
            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, lineHeight: 1.25, color: A.INK }}>
```

### `src/components/explore-tab-new/courseled/HowTheyPlayedSection.tsx:265`

**Before**
```tsx
            fontWeight: 800,
```
**After**
```tsx
            fontWeight: 700,
```

### `src/components/explore-tab-new/courseled/StandoutTile.tsx:352`

**Before**
```tsx
                          fontWeight: 800,
```
**After**
```tsx
                          fontWeight: 700,
```

### `src/components/explore-tab-new/courseled/StandoutTile.tsx:386`

**Before**
```tsx
                          fontWeight: 800,
```
**After**
```tsx
                          fontWeight: 700,
```

### `src/features/amateur-ranking/ranking-tab.css:10`

**Before**
```tsx
.amateur-ranking-tab .amr-hl>strong{font-size:44px;font-weight:800;line-height:.9;letter-spacing:-.02em}
```
**After**
```tsx
.amateur-ranking-tab .amr-hl>strong{font-size:44px;font-weight:700;line-height:.9;letter-spacing:-.02em}
```

### `src/features/amateur-ranking/ranking-tab.css:12`

**Before**
```tsx
.amateur-ranking-tab .amr-hl b{display:block;font-size:10px;font-weight:800;letter-spacing:.14em;color:rgba(248,250,252,.62)}
```
**After**
```tsx
.amateur-ranking-tab .amr-hl b{display:block;font-size:10px;font-weight:700;letter-spacing:.14em;color:rgba(248,250,252,.62)}
```

### `src/features/amateur-ranking/ranking-tab.css:20`

**Before**
```tsx
.amateur-ranking-tab .amr-ch .amr-cl{font-size:10px;font-weight:800;fill:rgba(248,250,252,.62)}
```
**After**
```tsx
.amateur-ranking-tab .amr-ch .amr-cl{font-size:10px;font-weight:700;fill:rgba(248,250,252,.62)}
```

### `src/features/amateur-ranking/ranking-tab.css:27`

**Before**
```tsx
.amateur-ranking-tab .amr-fin{width:40px;flex:none;font-size:13px;font-weight:800}
```
**After**
```tsx
.amateur-ranking-tab .amr-fin{width:40px;flex:none;font-size:13px;font-weight:700}
```

### `src/features/amateur-ranking/ranking-tab.css:31`

**Before**
```tsx
.amateur-ranking-tab .amr-pts{flex:none;text-align:right;font-size:13px;font-weight:800;font-variant-numeric:tabular-nums}
```
**After**
```tsx
.amateur-ranking-tab .amr-pts{flex:none;text-align:right;font-size:13px;font-weight:700;font-variant-numeric:tabular-nums}
```

### `src/features/amateur-ranking/ranking-tab.css:39`

**Before**
```tsx
.amateur-ranking-tab .amr-career b{display:block;font-size:9px;font-weight:800;letter-spacing:.14em;color:rgba(248,250,252,.42)}
```
**After**
```tsx
.amateur-ranking-tab .amr-career b{display:block;font-size:9px;font-weight:700;letter-spacing:.14em;color:rgba(248,250,252,.42)}
```

### `src/features/amateur-ranking/ranking-tab.css:49`

**Before**
```tsx
.amateur-ranking-tab.amr-sheet .pro-collection-kicker{font-size:10px;font-weight:800;letter-spacing:.14em;color:rgba(248,250,252,.62);margin-bottom:6px}
```
**After**
```tsx
.amateur-ranking-tab.amr-sheet .pro-collection-kicker{font-size:10px;font-weight:700;letter-spacing:.14em;color:rgba(248,250,252,.62);margin-bottom:6px}
```

### `src/features/amateur-ranking/ranking-tab.css:52`

**Before**
```tsx
.amateur-ranking-tab.amr-sheet .pro-collection-field label{display:block;font-size:10px;font-weight:800;letter-spacing:.1em;margin-bottom:6px;color:rgba(248,250,252,.42)}
```
**After**
```tsx
.amateur-ranking-tab.amr-sheet .pro-collection-field label{display:block;font-size:10px;font-weight:700;letter-spacing:.1em;margin-bottom:6px;color:rgba(248,250,252,.42)}
```

### `src/features/amateur-ranking/wagr-settings.css:14`

**Before**
```tsx
.wagr-kicker{font-size:9.5px;font-weight:800;letter-spacing:0.16em;color:var(--pro-profile-amber)}
```
**After**
```tsx
.wagr-kicker{font-size:9.5px;font-weight:700;letter-spacing:0.16em;color:var(--pro-profile-amber)}
```

### `src/features/courses/_shared/scorecard/scorecardParts.tsx:110`

**Before**
```tsx
      fontWeight: emphasis === 'strokes' ? 800 : undefined,
```
**After**
```tsx
      fontWeight: emphasis === 'strokes' ? 700 : undefined,
```

### `src/features/courses/components/holes/analytical/Extremes.tsx:53`

**Before**
```tsx
          style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.025em', color: A.INK, lineHeight: 1 }}
```
**After**
```tsx
          style={{ fontSize: 21, fontWeight: 700, letterSpacing: '-0.025em', color: A.INK, lineHeight: 1 }}
```

### `src/features/explore-magazine/AchievementCallout.tsx:480`

**Before**
```tsx
              style={{ fontFamily: SANS, fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', lineHeight: 1, textTransform: 'uppercase', color: A.AMBER, whiteSpace: 'nowrap', marginBottom: 5 }}
```
**After**
```tsx
              style={{ fontFamily: SANS, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', lineHeight: 1, textTransform: 'uppercase', color: A.AMBER, whiteSpace: 'nowrap', marginBottom: 5 }}
```

### `src/features/explore-magazine/AchievementCallout.tsx:514`

**Before**
```tsx
export const CAPS: React.CSSProperties = { fontFamily: ANALYTICAL_SANS, fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' };
```
**After**
```tsx
export const CAPS: React.CSSProperties = { fontFamily: ANALYTICAL_SANS, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' };
```

### `src/features/explore-magazine/ExploreCard.tsx:217`

**Before**
```tsx
            fontWeight: stacked ? 800 : 700,
```
**After**
```tsx
            fontWeight: 700,
```

### `src/features/explore-magazine/ExploreCard.tsx:821`

**Before**
```tsx
                fontFamily: SANS, fontSize: 17, fontWeight: 800, lineHeight: 1, color: tone,
```
**After**
```tsx
                fontFamily: SANS, fontSize: 17, fontWeight: 700, lineHeight: 1, color: tone,
```

### `src/features/explore-magazine/ExploreCard.tsx:1358`

**Before**
```tsx
                fontFamily: SANS, fontSize: 40, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1,
```
**After**
```tsx
                fontFamily: SANS, fontSize: 40, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1,
```

### `src/features/explore-magazine/ExploreCard.tsx:1369`

**Before**
```tsx
                marginTop: 3, fontFamily: SANS, fontSize: 8, fontWeight: 800, letterSpacing: '0.14em',
```
**After**
```tsx
                marginTop: 3, fontFamily: SANS, fontSize: 8, fontWeight: 700, letterSpacing: '0.14em',
```

### `src/features/explore-magazine/LeaderboardsSection.tsx:57`

**Before**
```tsx
              <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '0.11em', textTransform: 'uppercase', lineHeight: '11px', color: selected ? A.INK : A.MUTE }}>
```
**After**
```tsx
              <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.11em', textTransform: 'uppercase', lineHeight: '11px', color: selected ? A.INK : A.MUTE }}>
```

### `src/features/explore-magazine/LeaderboardsSection.tsx:61`

**Before**
```tsx
                <span data-board-tile-count style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.02em', color: selected ? A.INK : A.BODY }}>{count ?? '\u2014'}</span>
```
**After**
```tsx
                <span data-board-tile-count style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em', color: selected ? A.INK : A.BODY }}>{count ?? '\u2014'}</span>
```

### `src/features/explore-magazine/rareAir.ts:42`

**Before**
```tsx
    name: { fontSize: 9, fontWeight: 800, letterSpacing: '0.12em' },
```
**After**
```tsx
    name: { fontSize: 9, fontWeight: 700, letterSpacing: '0.12em' },
```

### `src/features/explore-magazine/rareAir.ts:43`

**Before**
```tsx
    pill: { fontSize: 8, fontWeight: 800, letterSpacing: '0.1em', border: 'rgba(247,147,30,0.45)', padding: '1px 5px' },
```
**After**
```tsx
    pill: { fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', border: 'rgba(247,147,30,0.45)', padding: '1px 5px' },
```

### `src/features/explore-magazine/rareAir.ts:44`

**Before**
```tsx
    count: { fontSize: 26, fontWeight: 800, letterSpacing: '-0.035em', marginTop: 8 },
```
**After**
```tsx
    count: { fontSize: 26, fontWeight: 700, letterSpacing: '-0.035em', marginTop: 8 },
```

### `src/features/explore-magazine/roundsGate.css:17`

**Before**
```tsx
.rounds-gate-ghost-name { display: block; font-size: 15px; font-weight: 650; }
```
**After**
```tsx
.rounds-gate-ghost-name { display: block; font-size: 15px; font-weight: 600; }
```

### `src/features/explore-magazine/roundsGate.css:27`

**Before**
```tsx
.rounds-gate-option-title { display: block; font-size: 15px; font-weight: 650; color: var(--rounds-gate-ink); }
```
**After**
```tsx
.rounds-gate-option-title { display: block; font-size: 15px; font-weight: 600; color: var(--rounds-gate-ink); }
```

### `src/features/explore-magazine/watch/WatchFeed.tsx:134`

**Before**
```tsx
      <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, letterSpacing: '-0.3px', color: A.INK }}>
```
**After**
```tsx
      <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, letterSpacing: '-0.3px', color: A.INK }}>
```

### `src/features/explore-magazine/watch/WatchFeed.tsx:495`

**Before**
```tsx
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 750, letterSpacing: '-0.01em', color: A.INK }}>
```
**After**
```tsx
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em', color: A.INK }}>
```

### `src/features/explore-magazine/watch/WatchLead.tsx:226`

**Before**
```tsx
        fontWeight: 800,
```
**After**
```tsx
        fontWeight: 700,
```

### `src/features/explore-magazine/watch/featured.css:3`

**Before**
```tsx
.featured-kicker { font-size:11px; font-weight:800; letter-spacing:0.2em; color:var(--featured-amber); }
```
**After**
```tsx
.featured-kicker { font-size:11px; font-weight:700; letter-spacing:0.2em; color:var(--featured-amber); }
```

### `src/features/explore-magazine/watch/featured.css:18`

**Before**
```tsx
.featured-badge { left:14px; padding:0 12px; background:var(--featured-glass); backdrop-filter:blur(16px); border:1px solid var(--featured-edge); font-size:10.5px; font-weight:800; letter-spacing:0.16em; }
```
**After**
```tsx
.featured-badge { left:14px; padding:0 12px; background:var(--featured-glass); backdrop-filter:blur(16px); border:1px solid var(--featured-edge); font-size:10.5px; font-weight:700; letter-spacing:0.16em; }
```

### `src/features/explore-magazine/watch/standout-shelf.css:19`

**Before**
```tsx
.standout-circle { font-size:9px; font-weight:800; letter-spacing:0.12em; color:var(--standout-dim); }
```
**After**
```tsx
.standout-circle { font-size:9px; font-weight:700; letter-spacing:0.12em; color:var(--standout-dim); }
```

### `src/features/explore-magazine/watch/standout-shelf.css:25`

**Before**
```tsx
.standout-figure small { display:block; font-size:8.5px; font-weight:800; letter-spacing:0.14em; color:var(--standout-dim); }
```
**After**
```tsx
.standout-figure small { display:block; font-size:8.5px; font-weight:700; letter-spacing:0.14em; color:var(--standout-dim); }
```

### `src/features/explore-magazine/watch/standout-shelf.css:26`

**Before**
```tsx
.standout-figure b { font-size:20px; font-weight:800; color:var(--standout-ink); }
```
**After**
```tsx
.standout-figure b { font-size:20px; font-weight:700; color:var(--standout-ink); }
```

### `src/features/explore-magazine/watch/standout-shelf.css:31`

**Before**
```tsx
.standout-comp { display:flex; gap:4px; align-items:center; justify-content:flex-end; font-size:9px; font-weight:800; letter-spacing:0.12em; }
```
**After**
```tsx
.standout-comp { display:flex; gap:4px; align-items:center; justify-content:flex-end; font-size:9px; font-weight:700; letter-spacing:0.12em; }
```

### `src/features/explore-magazine/watch/standout-shelf.css:32`

**Before**
```tsx
.standout-kicker { display:flex; align-items:center; gap:6px; margin-bottom:9px; font-size:9.5px; font-weight:800; letter-spacing:0.14em; text-transform:uppercase; color:var(--standout-dim); }
```
**After**
```tsx
.standout-kicker { display:flex; align-items:center; gap:6px; margin-bottom:9px; font-size:9.5px; font-weight:700; letter-spacing:0.14em; text-transform:uppercase; color:var(--standout-dim); }
```

## Eleven 650 → 600 declarations

| Location | Before | After |
|---|---:|---:|
| `src/components/course-media-tab/CourseMediaEmptyStates.tsx:115` | 650 | 600 |
| `src/components/course-media-tab/media-v2.css:46` | 650 | 600 |
| `src/components/course-media-tab/media-v2.css:50` | 650 | 600 |
| `src/components/course-media-tab/media-v3.css:17` | 650 | 600 |
| `src/components/course-media-tab/media-v3.css:26` | 650 | 600 |
| `src/components/course-media-tab/shot-tag-choices.css:10` | 650 | 600 |
| `src/components/course-media-tab/shot-tag-choices.css:20` | 650 | 600 |
| `src/components/courses/course-detail/ClaimCourseSheet.tsx:109` | 650 | 600 |
| `src/components/courses/course-detail/CourseWebsiteSheet.tsx:427` | 650 | 600 |
| `src/features/explore-magazine/roundsGate.css:17` | 650 | 600 |
| `src/features/explore-magazine/roundsGate.css:27` | 650 | 600 |

## Guard change

`src/test/weightCanonSweep.test.ts` CLEAN_SCOPES gained the six requested Courses/Explore paths (lines 16–21). The single scope-check case remains a single test; no matcher tests or allowlist entries were added. The freshly executed scanner reports zero violations in every completed scope. This is not a substitute for the timed-out Vitest assertion below.

## State-by-weight cases needing a ruling

- `src/components/courses/course-detail/about/DefendsPar.tsx:162`: highlighted hole numbers used `hi ? 800 : 700`, now plain `700`; the additional weight distinction is gone. Existing colour remains. No replacement signal invented.
- `src/features/explore-magazine/ExploreCard.tsx:217`: stacked versus non-stacked used `stacked ? 800 : 700`, now plain `700`; the density-dependent weight distinction is gone. No replacement signal invented.
- `src/features/courses/_shared/scorecard/scorecardParts.tsx:110`: strokes emphasis changed `800 : undefined` to `700 : undefined`; the conditional emphasis remains, so this is not a collapsed distinction.

Other `stateByWeight` flags in changes.json arise from unrelated colour, visibility, delta or text ternaries on the same line (PlayedTile hardest visibility, DefendsPar colour, review score/delta, BoardList held colour, ManySections under-par colour, CompetitionBoards self colour and Leaderboards selected colour). Their weights were unconditional; those state signals remain.

## Three authorised test updates

No test deleted, renamed, or rewritten; three expectations and the expressly authorised explanatory comment changed in `6b68bfe45d`. No further test changes in this close-out.

| Test location / context | Old assertion | New assertion | Why |
|---|---|---|---|
| `src/test/courseHeroesMatch.test.tsx:51`, “opts into26px zero-tracking title and unruled9px children” | `expect(title.style.fontWeight).toBe('800')` | `expect(title.style.fontWeight).toBe('700')` | CourseMasthead title moved to 700. |
| `src/test/exploreHeroCard.test.tsx:170`, Explore card shapes | `expect(unit?.style.fontWeight).toBe('800')` | `expect(unit?.style.fontWeight).toBe('700')` | Unit label moved to 700. |
| `src/test/exploreNetChips.test.tsx:234`, achievement tag and label copy parameterised cases | `expect(tagNode.style.fontWeight).toBe('800')` | `expect(tagNode.style.fontWeight).toBe('700')` | NEW / MOVED UP / RARE tags moved to 700; existing case count unchanged. |

The authorised comment now reads: `// RARE matches the NEW treatment at 700: same amber, size, weight, spacing, slot.` Auth-sanctioned and outside-scope assertions, and existing absence-of-800 assertions, remain unchanged.

## Figure widths and captures

The saved fixture evidence contains 414 paired numeric-leaf observations across 19 surfaces × 2 widths (390 / 320). `figure-widths.json` records each rendered text width, column width, height, computed weight and overflow before and after. These observations are not mapped exhaustively to every changed source declaration; no stronger coverage claim is made.

**36 of the 38 before/after capture pairs are pixel-identical. The sandbox lacks SF Pro’s full weight range, so pixel-identical captures do not establish physical-iPhone weight fidelity or prove an absence of real-device shifts.**

The picker pair is not pixel-identical: selected hole “11” changes from measured 400 to 700, with text width 14.546875→14.8125px at both viewport widths (+0.265625px). Its column remains 53.328125px at 390 and 41.671875px at 320; no column overflow or numeric text-height change was recorded. The saved pre-change picker evidence therefore has a weight-resolution limitation; it must not be described as an accurate 800→700 pixel comparison.

All other recorded text widths and all recorded column widths/heights are unchanged. No page overflow or runtime error is recorded in the saved fixture data; rail scrolling remains intentional. Nonnumeric line wrapping and physical-phone rendering were not independently measured.

| Capture | Numeric observations | Max text-width delta (px) | Max column delta (px) | Pixel-identical |
|---|---:|---:|---:|---|
| `courses-390` | 10 | 0.0 | 0.0 | Yes |
| `list-390` | 8 | 0.0 | 0.0 | Yes |
| `about-390` | 33 | 0.0 | 0.0 | Yes |
| `score-390` | 3 | 0.0 | 0.0 | Yes |
| `single-390` | 8 | 0.0 | 0.0 | Yes |
| `few-390` | 20 | 0.0 | 0 | Yes |
| `you-390` | 26 | 0.0 | 0 | Yes |
| `picker-390` | 18 | 0.265625 | 0.0 | No |
| `standout-390` | 3 | 0.0 | 0.0 | Yes |
| `rare-390` | 9 | 0.0 | 0 | Yes |
| `race-390` | 12 | 0.0 | 0.0 | Yes |
| `ranking-390` | 14 | 0.0 | 0.0 | Yes |
| `wagr-390` | 2 | 0.0 | 0.0 | Yes |
| `boards-390` | 25 | 0.0 | 0.0 | Yes |
| `achievement-390` | 2 | 0.0 | 0.0 | Yes |
| `explorecard-390` | 1 | 0.0 | 0.0 | Yes |
| `watchshelf-390` | 4 | 0.0 | 0.0 | Yes |
| `watchlead-390` | 3 | 0.0 | 0.0 | Yes |
| `featured-390` | 6 | 0.0 | 0.0 | Yes |
| `courses-320` | 10 | 0.0 | 0.0 | Yes |
| `list-320` | 8 | 0.0 | 0.0 | Yes |
| `about-320` | 33 | 0.0 | 0.0 | Yes |
| `score-320` | 3 | 0.0 | 0.0 | Yes |
| `single-320` | 8 | 0.0 | 0.0 | Yes |
| `few-320` | 20 | 0.0 | 0 | Yes |
| `you-320` | 26 | 0.0 | 0 | Yes |
| `picker-320` | 18 | 0.265625 | 0.0 | No |
| `standout-320` | 3 | 0.0 | 0.0 | Yes |
| `rare-320` | 9 | 0.0 | 0 | Yes |
| `race-320` | 12 | 0.0 | 0.0 | Yes |
| `ranking-320` | 14 | 0.0 | 0.0 | Yes |
| `wagr-320` | 2 | 0.0 | 0.0 | Yes |
| `boards-320` | 25 | 0.0 | 0.0 | Yes |
| `achievement-320` | 2 | 0.0 | 0 | Yes |
| `explorecard-320` | 1 | 0.0 | 0.0 | Yes |
| `watchshelf-320` | 4 | 0.0 | 0.0 | Yes |
| `watchlead-320` | 3 | 0.0 | 0.0 | Yes |
| `featured-320` | 6 | 0.0 | 0.0 | Yes |

### Captures list

All are fixture-only captures, with the saved harness under `harness/`; no live signed-in or physical-device verification is claimed.

- **What’s been played rails and PlayedTile:** `captures/before/courses-390.png`, `captures/before/courses-320.png`, `captures/after/courses-390.png`, `captures/after/courses-320.png`.
- **Course list card:** `captures/before/list-390.png`, `captures/before/list-320.png`, `captures/after/list-390.png`, `captures/after/list-320.png`.
- **About: DefendsPar, verdict and course record:** `captures/before/about-390.png`, `captures/before/about-320.png`, `captures/after/about-390.png`, `captures/after/about-320.png`.
- **Reviews: TheScore:** `captures/before/score-390.png`, `captures/before/score-320.png`, `captures/after/score-390.png`, `captures/after/score-320.png`.
- **Reviews: SingleReview:** `captures/before/single-390.png`, `captures/before/single-320.png`, `captures/after/single-390.png`, `captures/after/single-320.png`.
- **Reviews: FewReviews:** `captures/before/few-390.png`, `captures/before/few-320.png`, `captures/after/few-390.png`, `captures/after/few-320.png`.
- **You: ManySections and BoardList:** `captures/before/you-390.png`, `captures/before/you-320.png`, `captures/after/you-390.png`, `captures/after/you-320.png`.
- **Hole photo tag button and picker:** `captures/before/picker-390.png`, `captures/before/picker-320.png`, `captures/after/picker-390.png`, `captures/after/picker-320.png`.
- **Standout tile:** `captures/before/standout-390.png`, `captures/before/standout-320.png`, `captures/after/standout-390.png`, `captures/after/standout-320.png`.
- **Rare air:** `captures/before/rare-390.png`, `captures/before/rare-320.png`, `captures/after/rare-390.png`, `captures/after/rare-320.png`.
- **Top 100 race:** `captures/before/race-390.png`, `captures/before/race-320.png`, `captures/after/race-390.png`, `captures/after/race-320.png`.
- **Amateur ranking tab:** `captures/before/ranking-390.png`, `captures/before/ranking-320.png`, `captures/after/ranking-390.png`, `captures/after/ranking-320.png`.
- **WAGR settings:** `captures/before/wagr-390.png`, `captures/before/wagr-320.png`, `captures/after/wagr-390.png`, `captures/after/wagr-320.png`.
- **CompetitionBoards / BoardRows / Leaderboards:** `captures/before/boards-390.png`, `captures/before/boards-320.png`, `captures/after/boards-390.png`, `captures/after/boards-320.png`.
- **Achievement callout:** `captures/before/achievement-390.png`, `captures/before/achievement-320.png`, `captures/after/achievement-390.png`, `captures/after/achievement-320.png`.
- **ExploreCard:** `captures/before/explorecard-390.png`, `captures/before/explorecard-320.png`, `captures/after/explorecard-390.png`, `captures/after/explorecard-320.png`.
- **Watch standout shelf:** `captures/before/watchshelf-390.png`, `captures/before/watchshelf-320.png`, `captures/after/watchshelf-390.png`, `captures/after/watchshelf-320.png`.
- **Watch lead:** `captures/before/watchlead-390.png`, `captures/before/watchlead-320.png`, `captures/after/watchlead-390.png`, `captures/after/watchlead-320.png`.
- **Featured:** `captures/before/featured-390.png`, `captures/before/featured-320.png`, `captures/after/featured-390.png`, `captures/after/featured-320.png`.

## Sequential shard logs and suite reconciliation

Commands: `./node_modules/.bin/vitest run --shard=1/4`, then `2/4`, `3/4`, and `4/4`, each as its own command. Fresh logs below were generated during this close-out, not recovered historical logs.

| Shard | Files | Tests | Full output |
|---|---|---|---|
| 1 | 220 passed (220) | 2447 passed (2447) | `logs/shard-1.log` |
| 2 | 220 passed (220) | 2474 passed (2474) | `logs/shard-2.log` |
| 3 | 220 passed (220) | 2457 passed (2457) | `logs/shard-3.log` |
| 4 | 1 failed | 218 passed (219) | 1 failed | 2585 passed (2586) | `logs/shard-4.log` |

**Baseline / accepted prior run:** 9,964 tests across 879 files; 9,964 passed. **Fresh close-out run:** 9,963 passed / 1 failed, 9,964 total across 879 files. **Inventory delta: 0 tests / 0 files.** Adding paths to the existing single scope check adds no test case; the three authorised expectation changes retain case names and counts. No tests added, deleted, renamed or rewritten.

### Unexpected failure — stop

File/line: `src/test/weightCanonSweep.test.ts:114:3`
```text
FAIL  src/test/weightCanonSweep.test.ts > Weight canon in completed app-wide scopes > every clean scope uses only 400, 500, 600 and 700 in all five forms
Error: Test timed out in 15000ms.
If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".
```

No rerun, timeout edit, test repair, or application repair followed. The pf3a-only timeout retry allowance does not apply to this guard. Full runner output is retained in shard-4.log.

## Corrected remaining census

Ran the guard’s exported `scan` and original `walk` over all production `src` TS/TSX/CSS (tests excluded by that walker). No second recognition matcher was written. The exact guard source was transpiled in a temporary loader without registering Vitest tests; only the numeric classification predicate and census inclusion of the single sanctioned selector were parameterised. The on-disk guard is unchanged. Reproduction loader retained as `harness/final-census.cjs.txt`.

**Actual: 199 above 700 including the one sanctioned “stay in play.” declaration, leaving 198 unsanctioned to fix.** The requested 198 including sanctioned / 197 to fix is not reproduced by the source.

Reconciliation: 91 TS/TSX + **108 CSS** = 199. The submitted 107-CSS list counts the sanctioned `.auth-hero-brand h1` at `src/pages/auth/components/auth-hero.css:20` (800), but omits a separate unsanctioned `.auth-hero-panel h2` at line 40 (800). With the guard’s normal allowlist enabled, the above-700 scan is 198; including the sanctioned declaration makes it 199. Neither auth declaration was changed.

| Area | Above 700 |
|---|---:|
| `src/components/business` | 32 |
| `src/components/feed` | 2 |
| `src/components/invite` | 2 |
| `src/components/likes` | 1 |
| `src/components/shared` | 1 |
| `src/components/ui` | 1 |
| `src/features/admin` | 51 |
| `src/features/business` | 13 |
| `src/features/business-create` | 7 |
| `src/features/chrome-v2` | 5 |
| `src/features/coach` | 1 |
| `src/features/creator` | 1 |
| `src/features/find-people` | 1 |
| `src/features/guest` | 1 |
| `src/features/member-badge` | 1 |
| `src/features/post-v2` | 10 |
| `src/features/pro-verification` | 11 |
| `src/features/video-details` | 7 |
| `src/index.css` | 25 |
| `src/pages/auth` | 2 |
| `src/styles/hybrid-hero.css` | 6 |
| `src/styles/post-flow.css` | 10 |
| `src/styles/welcome.css` | 8 |
| **Total (includes sanctioned)** | **199** |

All six brief scopes are clean. `final-census.json` replaces the previous TS/TSX-only 91 result and includes every occurrence, the sanction, scope results, extension counts, and reconciliation. CSS hit lines use the guard’s block-start reporting; auth declaration lines above were checked directly.

### Off-step weights — separate census

**12 occurrences, all 650**, outside the completed scopes; unchanged. These are separate from above-700 totals.

| Guard-reported location | Weight |
|---|---:|
| `src/features/chrome-v2/IndexGlance.tsx:199 (fontWeight literal/conditional/variable)` | 650 |
| `src/features/chrome-v2/account-glance.css:23 (CSS font-weight)` | 650 |
| `src/features/chrome-v2/account-glance.css:31 (CSS font-weight)` | 650 |
| `src/features/composer-flow/review-course-search.css:42 (CSS font-weight)` | 650 |
| `src/features/post-v2/components/golf/composerGolf.css:19 (CSS font-weight)` | 650 |
| `src/features/post-v2/components/video/videoCreator.css:50 (CSS font-weight)` | 650 |
| `src/features/review-v2/components/SubmitBar.tsx:89 (fontWeight literal/conditional/variable)` | 650 |
| `src/features/review-v2/components/reviewReceipt.css:12 (CSS font-weight)` | 650 |
| `src/features/review-v2/components/reviewReceipt.css:24 (CSS font-weight)` | 650 |
| `src/features/review-v2/components/reviewReceipt.css:29 (CSS font-weight)` | 650 |
| `src/features/review-v2/components/reviewReceipt.css:42 (CSS font-weight)` | 650 |
| `src/features/review-v2/components/reviewReceipt.css:45 (CSS font-weight)` | 650 |

## Remaining blockers

- Unexpected guard timeout requires a ruling before any further test retry or change.
- The corrected all-CSS census is 199 including sanctioned, not 198; the separate auth panel heading is explicitly preserved.
- Pixel-identical sandbox captures do not establish SF Pro weight fidelity, and the saved measurements do not establish exhaustive per-declaration coverage.
