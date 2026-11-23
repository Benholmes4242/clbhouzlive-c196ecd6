# Canonical heading series — Brief 5

## Result

Weight implementation and suite verification complete; requested visual verification is **partial**, not closed. Changed exactly 103 above-700 declarations on 103 source lines in 33 production files. Size, tracking, line-height, colour, copy and geometry are unchanged. No SQL, migration, edge-function, feed_config or round_pool_cap changes. The separate brand/font-hygiene request has not been started and has no deployment or test results yet.

## Initial census

The guard’s exported `scan` and original walker found exactly the expected 103: components/business 32, features/business 13, features/business-create 7, features/admin 51. All are genuine weight declarations. Scoped off-step findings: zero. Intermediate 600–700 changes: none. All scoped changes are 800 → 700; no Tailwind heavy class, string-valued weight, font shorthand or >800 occurrence was found in this family. Scanner recognition and the sole auth allowlist are unchanged.

## State-by-weight distinctions needing Ben’s ruling

- `src/features/admin/components/content/StorySection.tsx:54`: primary action used `fontWeight: primary ? 800 : 700`; now plain `fontWeight: 700`. Primary/secondary emphasis by weight is lost; the existing background/border/colour distinctions remain unchanged. No replacement invented.
- `src/features/admin/components/health/healthUi.tsx:44`: primary `PillButton` used 800, secondary branch at line 45 used 700. Primary branch now 700, so this weight distinction is lost. Branches retain their existing border/background/colour logic; no replacement invented.
- No conditional with both original branches above 700 was present. Other changed badges (early data, Staff, You, hidden mention) retain their original visibility gates; they had no selected/unselected weight branches to collapse.

## Every production change

Locations are actual source declaration lines; the CSS census itself reports the preceding block-start line. Full before/after lines follow, so unchanged same-line details are visible.

### `src/components/business/BusinessEmptyState.tsx:68`

Before:
```text
const kicker: React.CSSProperties = { fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: MUTE };
```
After:
```text
const kicker: React.CSSProperties = { fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: MUTE };
```

### `src/components/business/BusinessEmptyState.tsx:69`

Before:
```text
const rightLabel: React.CSSProperties = { fontSize: 10.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: DIM, whiteSpace: 'nowrap' };
```
After:
```text
const rightLabel: React.CSSProperties = { fontSize: 10.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: DIM, whiteSpace: 'nowrap' };
```

### `src/components/business/BusinessFollowersCard.tsx:80`

Before:
```text
        <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.mute }}>
```
After:
```text
        <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.mute }}>
```

### `src/components/business/BusinessFollowersCard.tsx:84`

Before:
```text
          <span data-followers-count style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.dim, whiteSpace: 'nowrap' }}>
```
After:
```text
          <span data-followers-count style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.dim, whiteSpace: 'nowrap' }}>
```

### `src/components/business/BusinessFollowersCard.tsx:102`

Before:
```text
                    <span data-band-you style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.dim, marginLeft: 5 }}>
```
After:
```text
                    <span data-band-you style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.dim, marginLeft: 5 }}>
```

### `src/components/business/BusinessNearbyCourses.tsx:82`

Before:
```text
              fontSize: 9.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.ink, verticalAlign: 'middle' }}>
```
After:
```text
              fontSize: 9.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.ink, verticalAlign: 'middle' }}>
```

### `src/components/business/BusinessNearbyCourses.tsx:127`

Before:
```text
        <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.mute }}>
```
After:
```text
        <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.mute }}>
```

### `src/components/business/BusinessNearbyCourses.tsx:130`

Before:
```text
        <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.dim }}>
```
After:
```text
        <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.dim }}>
```

### `src/components/business/ClubFromTheClub.tsx:54`

Before:
```text
        <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(248,250,252,0.62)', ...(title !== undefined ? { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 } : {}) }} data-club-feed-title={title !== undefined ? "" : undefined}>{heading}</span>
```
After:
```text
        <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(248,250,252,0.62)', ...(title !== undefined ? { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 } : {}) }} data-club-feed-title={title !== undefined ? "" : undefined}>{heading}</span>
```

### `src/components/business/ClubFromTheClub.tsx:56`

Before:
```text
          <span data-club-feed-count style={{ ...(title !== undefined ? { flex: 'none', marginLeft: 12 } : {}), fontSize: 10.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(248,250,252,0.42)' }}>
```
After:
```text
          <span data-club-feed-count style={{ ...(title !== undefined ? { flex: 'none', marginLeft: 12 } : {}), fontSize: 10.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(248,250,252,0.42)' }}>
```

### `src/components/business/ClubHowItPlays.tsx:99`

Before:
```text
              <span data-club-plays-early style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
```
After:
```text
              <span data-club-plays-early style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
```

### `src/components/business/ClubHowItPlays.tsx:149`

Before:
```text
        <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.mute }}>How it plays</div>
```
After:
```text
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.mute }}>How it plays</div>
```

### `src/components/business/ClubHowItPlays.tsx:151`

Before:
```text
          <div data-club-plays-total style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.dim, whiteSpace: 'nowrap' }}>
```
After:
```text
          <div data-club-plays-total style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.dim, whiteSpace: 'nowrap' }}>
```

### `src/components/business/ClubWhatGolfersSay.tsx:136`

Before:
```text
        <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.mute, marginBottom: 10 }}>
```
After:
```text
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.mute, marginBottom: 10 }}>
```

### `src/components/business/ClubWhatGolfersSay.tsx:161`

Before:
```text
        <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.mute }}>What golfers say</div>
```
After:
```text
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.mute }}>What golfers say</div>
```

### `src/components/business/ClubWhatGolfersSay.tsx:162`

Before:
```text
        <div data-club-say-count style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.dim, whiteSpace: 'nowrap' }}>
```
After:
```text
        <div data-club-say-count style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.dim, whiteSpace: 'nowrap' }}>
```

### `src/components/business/businessMentions.css:2`

Before:
```text
.business-mentions-head h2 { margin:0; font-size:10.5px; font-weight:800; letter-spacing:.16em; text-transform:uppercase; color:var(--business-mention-mute); }
```
After:
```text
.business-mentions-head h2 { margin:0; font-size:10.5px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; color:var(--business-mention-mute); }
```

### `src/components/business/businessMentions.css:3`

Before:
```text
.business-mentions-count { font-size:10.5px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; color:var(--business-mention-dim); white-space:nowrap; }
```
After:
```text
.business-mentions-count { font-size:10.5px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:var(--business-mention-dim); white-space:nowrap; }
```

### `src/components/business/businessMentions.css:19`

Before:
```text
.business-mention-hidden { position:absolute; top:10px; left:36px; padding:2px 7px; border-radius:999px; background:var(--business-mention-menu); color:var(--business-mention-photo-ink); font-size:9.5px; font-weight:800; letter-spacing:.1em; text-transform:uppercase; pointer-events:none; }
```
After:
```text
.business-mention-hidden { position:absolute; top:10px; left:36px; padding:2px 7px; border-radius:999px; background:var(--business-mention-menu); color:var(--business-mention-photo-ink); font-size:9.5px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; pointer-events:none; }
```

### `src/components/business/editor/business-edit.css:64`

Before:
```text
.be2-fld>span{display:block;font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--ep-dim)}
```
After:
```text
.be2-fld>span{display:block;font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--ep-dim)}
```

### `src/components/business/editor/business-where-contact.css:8`

Before:
```text
.be3-fld>span,.be3-field-label{display:block;font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--ep-dim)}
```
After:
```text
.be3-fld>span,.be3-field-label{display:block;font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--ep-dim)}
```

### `src/components/business/hero/ClubProfileHero.tsx:188`

Before:
```text
            <span style={{ display: 'block', marginTop: 4, fontSize: placement === 'beside' ? 9.5 : 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: DIM }}>{c.label}</span>
```
After:
```text
            <span style={{ display: 'block', marginTop: 4, fontSize: placement === 'beside' ? 9.5 : 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: DIM }}>{c.label}</span>
```

### `src/components/business/hero/ClubProfileHero.tsx:265`

Before:
```text
              <h1 ref={p.nameRef} style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: 0, lineHeight: 1.1, color: INK, display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden' }}>
```
After:
```text
              <h1 ref={p.nameRef} style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: 0, lineHeight: 1.1, color: INK, display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden' }}>
```

### `src/components/business/hero/ClubProfileHero.tsx:314`

Before:
```text
                <span data-soon-tag="" style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: DIM, border: GLASS_BORDER, borderRadius: 999, padding: '2px 7px' }}>
```
After:
```text
                <span data-soon-tag="" style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: DIM, border: GLASS_BORDER, borderRadius: 999, padding: '2px 7px' }}>
```

### `src/components/business/hero/ClubProfileHero.tsx:327`

Before:
```text
                    <span data-soon-tag="" style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: DIM, border: GLASS_BORDER, borderRadius: 999, padding: '2px 7px' }}>
```
After:
```text
                    <span data-soon-tag="" style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: DIM, border: GLASS_BORDER, borderRadius: 999, padding: '2px 7px' }}>
```

### `src/components/business/home/BusinessDoNextCard.tsx:73`

Before:
```text
      <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: H.mute }}>
```
After:
```text
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: H.mute }}>
```

### `src/components/business/home/BusinessDoNextCard.tsx:91`

Before:
```text
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: H.mute,
```
After:
```text
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: H.mute,
```

### `src/components/business/home/BusinessHomeHeader.tsx:101`

Before:
```text
        fontSize, fontWeight: 800, color: '#fff',
```
After:
```text
        fontSize, fontWeight: 700, color: '#fff',
```

### `src/components/business/home/BusinessHomeHeader.tsx:270`

Before:
```text
            <div className="flex items-center" style={{ gap: 7, fontSize: 22, fontWeight: 800, letterSpacing: '-0.025em', color: H.ink, lineHeight: 1.2 }}>
```
After:
```text
            <div className="flex items-center" style={{ gap: 7, fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em', color: H.ink, lineHeight: 1.2 }}>
```

### `src/components/business/home/BusinessWeekCard.tsx:75`

Before:
```text
  display: 'flex', justifyContent: 'space-between', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em',
```
After:
```text
  display: 'flex', justifyContent: 'space-between', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em',
```

### `src/components/business/home/BusinessWeekCard.tsx:83`

Before:
```text
  marginTop: 4, fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, color: W.ink, fontVariantNumeric: 'tabular-nums',
```
After:
```text
  marginTop: 4, fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1, color: W.ink, fontVariantNumeric: 'tabular-nums',
```

### `src/components/business/insights/InsightsFunnel.tsx:170`

Before:
```text
          fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: FUNNEL_MUTE,
```
After:
```text
          fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: FUNNEL_MUTE,
```

### `src/features/admin/AdminShell.tsx:292`

Before:
```text
      background: 'rgba(61,220,145,0.12)', color: t.okText, fontSize: 12, fontWeight: 800, cursor: 'pointer',
```
After:
```text
      background: 'rgba(61,220,145,0.12)', color: t.okText, fontSize: 12, fontWeight: 700, cursor: 'pointer',
```

### `src/features/admin/components/analytics/BehaviourLens.tsx:53`

Before:
```text
            <span style={{ fontSize: 12.5, fontWeight: 800, textAlign: 'right' }}>{pct(r.ret)}</span>
```
After:
```text
            <span style={{ fontSize: 12.5, fontWeight: 700, textAlign: 'right' }}>{pct(r.ret)}</span>
```

### `src/features/admin/components/analytics/BehaviourLens.tsx:54`

Before:
```text
            <span style={{ fontSize: 11, fontWeight: 800, textAlign: 'right', color: tone === 'good' ? t.okText : tone === 'bad' ? t.dangerText : t.inkMuted }}>
```
After:
```text
            <span style={{ fontSize: 11, fontWeight: 700, textAlign: 'right', color: tone === 'good' ? t.okText : tone === 'bad' ? t.dangerText : t.inkMuted }}>
```

### `src/features/admin/components/analytics/BehaviourLens.tsx:115`

Before:
```text
              <span style={{ fontSize: 12, fontWeight: 800, textAlign: 'right' }}>{pct(f.pct)}</span>
```
After:
```text
              <span style={{ fontSize: 12, fontWeight: 700, textAlign: 'right' }}>{pct(f.pct)}</span>
```

### `src/features/admin/components/analytics/BehaviourLens.tsx:148`

Before:
```text
                <span style={{ fontWeight: 800 }}>{pct(r.pct)}</span>
```
After:
```text
                <span style={{ fontWeight: 700 }}>{pct(r.pct)}</span>
```

### `src/features/admin/components/analytics/HealthLens.tsx:59`

Before:
```text
        <span style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>{num(wg.this_week)}</span>
```
After:
```text
        <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>{num(wg.this_week)}</span>
```

### `src/features/admin/components/analytics/HealthLens.tsx:60`

Before:
```text
        {chip && <span style={{ fontSize: 12, fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: chip.bg, color: chip.fg }}>{chip.text}</span>}
```
After:
```text
        {chip && <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: chip.bg, color: chip.fg }}>{chip.text}</span>}
```

### `src/features/admin/components/analytics/HealthLens.tsx:97`

Before:
```text
        <span style={{ fontSize: 16, fontWeight: 800, color: colour }}>{pct(value)}</span>
```
After:
```text
        <span style={{ fontSize: 16, fontWeight: 700, color: colour }}>{pct(value)}</span>
```

### `src/features/admin/components/analytics/HealthLens.tsx:120`

Before:
```text
          <span style={{ display: 'block', marginTop: 2, fontSize: 16, fontWeight: 800 }}>
```
After:
```text
          <span style={{ display: 'block', marginTop: 2, fontSize: 16, fontWeight: 700 }}>
```

### `src/features/admin/components/analytics/HealthLens.tsx:155`

Before:
```text
                  height: 24, borderRadius: 4, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', placeItems: 'center', fontSize: 10.5, fontWeight: 800,
```
After:
```text
                  height: 24, borderRadius: 4, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', placeItems: 'center', fontSize: 10.5, fontWeight: 700,
```

### `src/features/admin/components/analytics/JourneysLens.tsx:71`

Before:
```text
                <span style={{ fontSize: 16, fontWeight: 800 }}>{num(st.n)}</span>
```
After:
```text
                <span style={{ fontSize: 16, fontWeight: 700 }}>{num(st.n)}</span>
```

### `src/features/admin/components/analytics/LiveLens.tsx:29`

Before:
```text
        <span style={{ fontSize: 56, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>{num(d.now)}</span>
```
After:
```text
        <span style={{ fontSize: 56, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>{num(d.now)}</span>
```

### `src/features/admin/components/analytics/LiveLens.tsx:77`

Before:
```text
              <span style={{ width: 34, height: 34, borderRadius: 17, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', placeItems: 'center', fontSize: 11, fontWeight: 800, color: t.canvas, background: bg }}>{initials(p)}</span>
```
After:
```text
              <span style={{ width: 34, height: 34, borderRadius: 17, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', placeItems: 'center', fontSize: 11, fontWeight: 700, color: t.canvas, background: bg }}>{initials(p)}</span>
```

### `src/features/admin/components/analytics/LiveLens.tsx:82`

Before:
```text
                {p.is_staff && <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: t.inkFaint, padding: '2px 6px', borderRadius: 999, background: 'rgba(255,255,255,0.06)' }}>Staff</span>}
```
After:
```text
                {p.is_staff && <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: t.inkFaint, padding: '2px 6px', borderRadius: 999, background: 'rgba(255,255,255,0.06)' }}>Staff</span>}
```

### `src/features/admin/components/analytics/LiveLens.tsx:87`

Before:
```text
              <span style={{ display: 'block', fontSize: 13, fontWeight: 800 }}>{onFor(p.on_secs)}</span>
```
After:
```text
              <span style={{ display: 'block', fontSize: 13, fontWeight: 700 }}>{onFor(p.on_secs)}</span>
```

### `src/features/admin/components/analytics/LiveLens.tsx:132`

Before:
```text
            <span style={{ fontSize: 13, fontWeight: 800 }}>{num(r.n)}</span>
```
After:
```text
            <span style={{ fontSize: 13, fontWeight: 700 }}>{num(r.n)}</span>
```

### `src/features/admin/components/analytics/ScreensLens.tsx:68`

Before:
```text
              <span style={{ fontSize: 13, fontWeight: 800 }}>{dur(r.secs)}</span>
```
After:
```text
              <span style={{ fontSize: 13, fontWeight: 700 }}>{dur(r.secs)}</span>
```

### `src/features/admin/components/analytics/analyticsUi.tsx:48`

Before:
```text
      <div style={{ marginTop: 2, fontSize: size, fontWeight: 800, color: valueColor }}>{value}</div>
```
After:
```text
      <div style={{ marginTop: 2, fontSize: size, fontWeight: 700, color: valueColor }}>{value}</div>
```

### `src/features/admin/components/content/StorySection.tsx:54`

Before:
```text
    color: primary ? t.canvas : t.ink, fontSize: 12.5, fontWeight: primary ? 800 : 700, cursor: 'pointer',
```
After:
```text
    color: primary ? t.canvas : t.ink, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
```

### `src/features/admin/components/content/StorySection.tsx:92`

Before:
```text
              fontSize: 9.5, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 7px', borderRadius: 999,
```
After:
```text
              fontSize: 9.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 7px', borderRadius: 999,
```

### `src/features/admin/components/content/StorySection.tsx:98`

Before:
```text
          {story?.kicker && <div style={{ marginTop: 10, fontSize: 9.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.inkFaint }}>{story.kicker}</div>}
```
After:
```text
          {story?.kicker && <div style={{ marginTop: 10, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.inkFaint }}>{story.kicker}</div>}
```

### `src/features/admin/components/content/StorySection.tsx:99`

Before:
```text
          <h1 style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1.25, color: t.ink }}>{story?.headline ?? ''}</h1>
```
After:
```text
          <h1 style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.25, color: t.ink }}>{story?.headline ?? ''}</h1>
```

### `src/features/admin/components/content/StorySection.tsx:153`

Before:
```text
                  <span style={{ fontSize: 12, fontWeight: 800, textAlign: 'right', color: t.ink }}>{s.opens}</span>
```
After:
```text
                  <span style={{ fontSize: 12, fontWeight: 700, textAlign: 'right', color: t.ink }}>{s.opens}</span>
```

### `src/features/admin/components/content/deskTokens.ts:28`

Before:
```text
export const FIG: React.CSSProperties = { marginTop: 2, fontSize: 20, fontWeight: 800, color: t.ink };
```
After:
```text
export const FIG: React.CSSProperties = { marginTop: 2, fontSize: 20, fontWeight: 700, color: t.ink };
```

### `src/features/admin/components/health/AppLens.tsx:28`

Before:
```text
        <span style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, color }}>{cf ? cf.text : '-'}</span>
```
After:
```text
        <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1, color }}>{cf ? cf.text : '-'}</span>
```

### `src/features/admin/components/health/AppLens.tsx:53`

Before:
```text
          <div style={{ marginTop: 8, fontSize: 28, fontWeight: 800, lineHeight: 1 }}>-</div>
```
After:
```text
          <div style={{ marginTop: 8, fontSize: 28, fontWeight: 700, lineHeight: 1 }}>-</div>
```

### `src/features/admin/components/health/AppLens.tsx:59`

Before:
```text
            <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>{Math.round(pctOf(b.current))}%</span>
```
After:
```text
            <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>{Math.round(pctOf(b.current))}%</span>
```

### `src/features/admin/components/health/AppLens.tsx:85`

Before:
```text
            {(m.errors ?? 0) > 0 && <span style={{ fontSize: 12, fontWeight: 800, color: H.amber }}>{plural(m.errors!, 'error')}</span>}
```
After:
```text
            {(m.errors ?? 0) > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: H.amber }}>{plural(m.errors!, 'error')}</span>}
```

### `src/features/admin/components/health/AppLens.tsx:133`

Before:
```text
              <span style={{ fontSize: 12, fontWeight: 800 }}>{num(e.n)}</span>
```
After:
```text
              <span style={{ fontSize: 12, fontWeight: 700 }}>{num(e.n)}</span>
```

### `src/features/admin/components/health/AppLens.tsx:161`

Before:
```text
        <span style={{ fontSize: 13, fontWeight: 800, color: !q ? t.ink : q.errored_24h > 0 ? H.dangerText : H.okText }}>{q ? `${num(q.errored_24h)} failed` : '-'}</span>
```
After:
```text
        <span style={{ fontSize: 13, fontWeight: 700, color: !q ? t.ink : q.errored_24h > 0 ? H.dangerText : H.okText }}>{q ? `${num(q.errored_24h)} failed` : '-'}</span>
```

### `src/features/admin/components/health/AppLens.tsx:170`

Before:
```text
          <span style={{ marginLeft: 6, fontSize: 13, fontWeight: 800 }}>{latest.length ? `${okN}/${latest.length}` : '-'}</span>
```
After:
```text
          <span style={{ marginLeft: 6, fontSize: 13, fontWeight: 700 }}>{latest.length ? `${okN}/${latest.length}` : '-'}</span>
```

### `src/features/admin/components/health/AppLens.tsx:201`

Before:
```text
        fontSize: 12, fontWeight: 800, fontFamily: 'inherit', cursor: cool ? 'default' : 'pointer', opacity: cool ? 0.6 : 1,
```
After:
```text
        fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: cool ? 'default' : 'pointer', opacity: cool ? 0.6 : 1,
```

### `src/features/admin/components/health/GolfDataLens.tsx:54`

Before:
```text
                <span style={{ fontSize: 16, fontWeight: 800 }}>{num(r.n)}</span>
```
After:
```text
                <span style={{ fontSize: 16, fontWeight: 700 }}>{num(r.n)}</span>
```

### `src/features/admin/components/health/GolfDataLens.tsx:73`

Before:
```text
        <div style={{ marginTop: 2, fontSize: 18, fontWeight: 800, color: kind === 'fresh' ? H.okText : hot ? H.amber : t.ink }}>{num(v)}</div>
```
After:
```text
        <div style={{ marginTop: 2, fontSize: 18, fontWeight: 700, color: kind === 'fresh' ? H.okText : hot ? H.amber : t.ink }}>{num(v)}</div>
```

### `src/features/admin/components/health/GolfDataLens.tsx:82`

Before:
```text
        <span style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>{num(c.connected)}</span>
```
After:
```text
        <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>{num(c.connected)}</span>
```

### `src/features/admin/components/health/GolfDataLens.tsx:106`

Before:
```text
                <span style={{ fontSize: 12, fontWeight: 800 }}>{m.last_synced_at ? `${ageOf(m.last_synced_at)} ago` : 'never'}</span>
```
After:
```text
                <span style={{ fontSize: 12, fontWeight: 700 }}>{m.last_synced_at ? `${ageOf(m.last_synced_at)} ago` : 'never'}</span>
```

### `src/features/admin/components/health/GolfDataLens.tsx:125`

Before:
```text
          <span style={{ fontSize: 14, fontWeight: 800, color: p == null ? t.ink : good ? H.okText : H.amber }}>{p == null ? '-' : `${p}%`}</span>
```
After:
```text
          <span style={{ fontSize: 14, fontWeight: 700, color: p == null ? t.ink : good ? H.okText : H.amber }}>{p == null ? '-' : `${p}%`}</span>
```

### `src/features/admin/components/health/JobsLens.tsx:97`

Before:
```text
        {problem && <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: PROBLEM_LABEL[problem].color }}>{PROBLEM_LABEL[problem].text}</span>}
```
After:
```text
        {problem && <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: PROBLEM_LABEL[problem].color }}>{PROBLEM_LABEL[problem].text}</span>}
```

### `src/features/admin/components/health/JobsLens.tsx:248`

Before:
```text
            <span style={{ width: 28, height: 28, borderRadius: 14, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', placeItems: 'center', fontSize: 11, fontWeight: 800, color: t.canvas, background: ic.bg }}>{ic.letter}</span>
```
After:
```text
            <span style={{ width: 28, height: 28, borderRadius: 14, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', placeItems: 'center', fontSize: 11, fontWeight: 700, color: t.canvas, background: ic.bg }}>{ic.letter}</span>
```

### `src/features/admin/components/health/StatusLens.tsx:42`

Before:
```text
      <div style={{ marginTop: 8, fontSize: 20, fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
```
After:
```text
      <div style={{ marginTop: 8, fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
```

### `src/features/admin/components/health/StatusLens.tsx:57`

Before:
```text
            height: 34, padding: '0 14px', borderRadius: 999, background: p.btn, color: t.canvas, fontSize: 12, fontWeight: 800,
```
After:
```text
            height: 34, padding: '0 14px', borderRadius: 999, background: p.btn, color: t.canvas, fontSize: 12, fontWeight: 700,
```

### `src/features/admin/components/health/StatusLens.tsx:87`

Before:
```text
              <span style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>{hoursMins(p.median_hrs)}</span>
```
After:
```text
              <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>{hoursMins(p.median_hrs)}</span>
```

### `src/features/admin/components/health/StatusLens.tsx:89`

Before:
```text
                <span style={{ fontSize: 12, fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: over ? H.warnChip : H.okChip, color: over ? H.amber : H.okText }}>
```
After:
```text
                <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: over ? H.warnChip : H.okChip, color: over ? H.amber : H.okText }}>
```

### `src/features/admin/components/health/StatusLens.tsx:196`

Before:
```text
              <span style={{ fontSize: 13, fontWeight: 800, color: tone.value }}>{r.value}</span>
```
After:
```text
              <span style={{ fontSize: 13, fontWeight: 700, color: tone.value }}>{r.value}</span>
```

### `src/features/admin/components/health/healthUi.tsx:44`

Before:
```text
        ? { border: 0, background: t.ink, color: t.canvas, fontWeight: 800 }
```
After:
```text
        ? { border: 0, background: t.ink, color: t.canvas, fontWeight: 700 }
```

### `src/features/admin/components/memberRadar.css:144`

Before:
```text
  font-weight: 800;
```
After:
```text
  font-weight: 700;
```

### `src/features/admin/components/memberRadar.css:166`

Before:
```text
  font-weight: 800;
```
After:
```text
  font-weight: 700;
```

### `src/features/admin/components/memberRadar.css:247`

Before:
```text
  font-weight: 800;
```
After:
```text
  font-weight: 700;
```

### `src/features/admin/components/memberRadar.css:372`

Before:
```text
  font-weight: 800;
```
After:
```text
  font-weight: 700;
```

### `src/features/admin/components/memberRadar.css:447`

Before:
```text
  font-weight: 800;
```
After:
```text
  font-weight: 700;
```

### `src/features/admin/components/memberRadar.css:492`

Before:
```text
  font-weight: 800;
```
After:
```text
  font-weight: 700;
```

### `src/features/business-create/business-create.css:8`

Before:
```text
.bizc-kicker{font-size:10.5px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--bizc-mute)}
```
After:
```text
.bizc-kicker{font-size:10.5px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--bizc-mute)}
```

### `src/features/business-create/business-create.css:11`

Before:
```text
.bizc-group{font-size:10px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--bizc-dim);margin:20px 0 8px}
```
After:
```text
.bizc-group{font-size:10px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--bizc-dim);margin:20px 0 8px}
```

### `src/features/business-create/business-create.css:24`

Before:
```text
.bizc-field-label{display:block;font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--bizc-dim)}
```
After:
```text
.bizc-field-label{display:block;font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--bizc-dim)}
```

### `src/features/business-create/business-create.css:50`

Before:
```text
.bizc-facts i{display:block;font-style:normal;font-size:9.5px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--bizc-dim);margin-top:5px}
```
After:
```text
.bizc-facts i{display:block;font-style:normal;font-size:9.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--bizc-dim);margin-top:5px}
```

### `src/features/business-create/business-create.css:57`

Before:
```text
.bizc-crest{width:44px;height:44px;border-radius:12px;background:#1E1E23;color:var(--bizc-mute);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px;flex:none;overflow:hidden}
```
After:
```text
.bizc-crest{width:44px;height:44px;border-radius:12px;background:#1E1E23;color:var(--bizc-mute);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;flex:none;overflow:hidden}
```

### `src/features/business-create/business-create.css:80`

Before:
```text
.bizc-areakick{font-size:10px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--bizc-mute)}
```
After:
```text
.bizc-areakick{font-size:10px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--bizc-mute)}
```

### `src/features/business-create/business-create.css:93`

Before:
```text
.bizc-row-label{width:70px;flex:none;font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--bizc-dim)}
```
After:
```text
.bizc-row-label{width:70px;flex:none;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--bizc-dim)}
```

### `src/features/business/clubAnalytics/courseLead.css:3`

Before:
```text
.club-course-lead-early { display: inline-flex; align-items: center; height: 24px; padding: 0 10px; border-radius: 12px; border: 1px solid var(--team-selected-border); font-size: 10.5px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: var(--team-ink); margin-bottom: 10px; }
```
After:
```text
.club-course-lead-early { display: inline-flex; align-items: center; height: 24px; padding: 0 10px; border-radius: 12px; border: 1px solid var(--team-selected-border); font-size: 10.5px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: var(--team-ink); margin-bottom: 10px; }
```

### `src/features/business/clubAnalytics/sections.tsx:144`

Before:
```text
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: HIP.MUTE }}>
```
After:
```text
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: HIP.MUTE }}>
```

### `src/features/business/clubAnalytics/sections.tsx:154`

Before:
```text
            <h4 style={{ margin: '14px 0 0', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: HIP.DIM }}>{rows.length === 1 ? `Plays ${direction} than its card` : `Play ${direction} than their card`}</h4>
```
After:
```text
            <h4 style={{ margin: '14px 0 0', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: HIP.DIM }}>{rows.length === 1 ? `Plays ${direction} than its card` : `Play ${direction} than their card`}</h4>
```

### `src/features/business/clubAnalytics/sections.tsx:207`

Before:
```text
      <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: HIP.MUTE }}>The sample</div>
```
After:
```text
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: HIP.MUTE }}>The sample</div>
```

### `src/features/business/clubAnalytics/sections.tsx:212`

Before:
```text
            <div style={{ marginTop: 2, fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: HIP.DIM }}>{c.label}</div>
```
After:
```text
            <div style={{ marginTop: 2, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: HIP.DIM }}>{c.label}</div>
```

### `src/features/business/clubAnalytics/sections.tsx:298`

Before:
```text
  const kicker: React.CSSProperties = { fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: HIP.MUTE };
```
After:
```text
  const kicker: React.CSSProperties = { fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: HIP.MUTE };
```

### `src/features/business/clubAnalytics/sections.tsx:299`

Before:
```text
  const heading: React.CSSProperties = { fontSize: 9.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: HIP.DIM, whiteSpace: 'nowrap', fontFamily: 'Geist, sans-serif' };
```
After:
```text
  const heading: React.CSSProperties = { fontSize: 9.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: HIP.DIM, whiteSpace: 'nowrap', fontFamily: 'Geist, sans-serif' };
```

### `src/features/business/clubAnalytics/sections.tsx:427`

Before:
```text
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: HIP.MUTE }}>
```
After:
```text
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: HIP.MUTE }}>
```

### `src/features/business/clubAnalytics/sections.tsx:483`

Before:
```text
const S7_KICKER: React.CSSProperties = { fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: HIP.MUTE };
```
After:
```text
const S7_KICKER: React.CSSProperties = { fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: HIP.MUTE };
```

### `src/features/business/clubAnalytics/sections.tsx:550`

Before:
```text
const TEE_HEAD7: React.CSSProperties = { fontSize: 9.5, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: HIP.DIM };
```
After:
```text
const TEE_HEAD7: React.CSSProperties = { fontSize: 9.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: HIP.DIM };
```

### `src/features/business/clubAnalytics/sections.tsx:671`

Before:
```text
  const kicker: React.CSSProperties = { fontSize: 10.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: HIP.MUTE };
```
After:
```text
  const kicker: React.CSSProperties = { fontSize: 10.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: HIP.MUTE };
```

### `src/features/business/clubAnalytics/teeSheet.css:2`

Before:
```text
.tee-sheet-kicker { font-size:10.5px; font-weight:800; letter-spacing:.16em; color:var(--tee-sheet-muted); }
```
After:
```text
.tee-sheet-kicker { font-size:10.5px; font-weight:700; letter-spacing:.16em; color:var(--tee-sheet-muted); }
```

### `src/features/business/clubAnalytics/teeSheet.css:6`

Before:
```text
.tee-sheet-subheading { margin:16px 0 0; font-size:10.5px; font-weight:800; letter-spacing:.14em; color:var(--tee-sheet-dim); }
```
After:
```text
.tee-sheet-subheading { margin:16px 0 0; font-size:10.5px; font-weight:700; letter-spacing:.14em; color:var(--tee-sheet-dim); }
```

## Tests and inventory

Only `src/test/weightCanonSweep.test.ts` changed: added these four CLEAN_SCOPES entries. The existing 60,000ms per-scope `it.each` registers four additional cases:

- `src/components/business uses only 400, 500, 600 and 700 in all five forms`
- `src/features/business uses only 400, 500, 600 and 700 in all five forms`
- `src/features/business-create uses only 400, 500, 600 and 700 in all five forms`
- `src/features/admin uses only 400, 500, 600 and 700 in all five forms`

Each retains the assertion `expect(walk(scope).flatMap(violations)).toEqual([])`. No existing test was deleted, renamed, rewritten or had its assertion changed. Matcher fixtures and allowlist are byte-identical.

A fresh search of src/**/*.test.* found no old weight expectation belonging to a changed component. Candidate hits were comments in allHeroesMatch/alsoWeekSpacing, founded-year 1800 validation in bc4BusinessCreate/be2BusinessPreview, tee-yardage 6500 in cb97TeesRecords, window height 800 in ch1ChampionsTidy, round counts in championsState2/courseLead, and unrelated Tour/pro/featured tests. Guard’s intentional failing matcher fixtures remain unchanged. No ambiguous subject weight expectation required an edit.

Command `./node_modules/.bin/vitest run src/test/weightCanonSweep.test.ts`: 46/46, one file. Full-suite baseline accepted from Brief 4: 9,977/9,977 across 879 files. After: **9,981/9,981 across 879 files**. Delta +4 cases, solely the four named clean-scope cases; zero file delta.

All shards ran sequentially, each as a separate command; no shard retry was needed:

| Command | Passed / executed | Files | Full output |
|---|---:|---:|---|
| `./node_modules/.bin/vitest run --shard=1/4` | 2,447 / 2,447 | 220 | logs/shard-1.log |
| `./node_modules/.bin/vitest run --shard=2/4` | 2,474 / 2,474 | 220 | logs/shard-2.log |
| `./node_modules/.bin/vitest run --shard=3/4` | 2,457 / 2,457 | 220 | logs/shard-3.log |
| `./node_modules/.bin/vitest run --shard=4/4` | 2,603 / 2,603 | 219 | logs/shard-4.log |
| **Total** | **9,981 / 9,981** | **879** | |

Preview’s latest observed build entry: `build OK` (2026-11-23T08:16:33Z). Temporary capture pages and source mirrors were removed. A measurement-script syntax error was corrected before shard 2; it was an apparatus error, not a test/app failure, and no test was retried or changed.

## Figures and captures — partial coverage

`figure-widths.json` holds 626 paired text/figure samples with DOM Range glyph widths/heights, element column widths, computed weight/family, and before/after overflow flags at 390 and 320. It is not a complete source-declaration-to-render mapping and must not be read as measuring every changed figure or fixed-width column.

34 before/after pairs (68 PNGs) cover actual isolated components with fixed fixture inputs; neither signed-in admin navigation nor live business data was exercised. The harness uses real presentation components and cache-seeded or prop-provided sample data, not reconstructed pictures. No page-level overflow occurred in those fixtures. 320px examples retain wrapping in the followers heading and Health connection/re-auth labels; nothing was changed to suppress those existing wraps.

**All 34 pairs are pixel-identical.** Every measured glyph and column width/height was identical. The sandbox does not provide SF Pro’s native 800/700 weight fidelity, so this is not evidence of no shift on iOS. No physical iPhone measurement was made. The original Geist declarations remain as explicitly ruled for this weight-only brief.

Before and after PNGs under captures/{before,after}/, each at 390 and 320:

- empty: BusinessEmptyState, including its built-in sample insights.
- week: BusinessWeekView, KPI figures and spark rows.
- followers: BusinessFollowersCard.
- insights: InsightsFunnel.
- sample, holes, plays, tees, teeSheet, cardAgainst: actual club analytics sections. Tees is the empty branch and teeSheet is the insufficient-coverage branch; this does **not** verify ready tee rows, full year bars or course-lead early state.
- behaviour: Admin analytics Features/Rhythm/AfterRound/TimeShare.
- analyticsHealth: Admin analytics weekly golfers, KPI strip, handicap, cohorts and growth.
- analyticsLive: Admin analytics Now/WhoIsIn/Last30/Busy.
- journeys, screens: Admin analytics JourneysLens and ScreensLens.
- healthApp: Health App CrashFree/Builds/Errors/CheckTracking.
- healthGolf: Health GolfDataLens and its fix-tool buttons.

### Still-unverified requested visual coverage

No claim of complete capture coverage: Manage business profiles/HomeHeader/DoNext, nearby courses, mentions (including hidden badge), editor edit and where/contact, business-create, business profile hero, From the club and What golfers say, ready tees/tee-sheet/course-lead, Command centre dashboard/AdminShell pill, Health Status and Jobs, member radar, and Content StorySection remain uncaptured. Those also leave per-declaration fixed-column/figure coverage incomplete. Admin analytics five lenses and Health App/Golf are captured, but not all their application chrome or every conditional branch. These are verification gaps, not new layout changes or test failures.

## Remaining app-wide census

Fresh scan over all src, including CSS, with the same exported scanner and walker. Above-700 total **96 including the single sanctioned .auth-hero-brand h1; 95 to fix**. Exactly 199 − 103 = 96. Scoped violations all zero; off-step findings app-wide **12**, none in this brief’s four scopes. No outside-scope finding fixed. `final-census.json` contains every location; `harness/census.cjs.txt` records how the existing scan was executed and partitioned. CSS line numbers use guard block-start locations.

| Area | Above 700 |
|---|---:|
| `src/components/feed` | 2 |
| `src/components/invite` | 2 |
| `src/components/likes` | 1 |
| `src/components/shared` | 1 |
| `src/components/ui` | 1 |
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

Off-step locations (all 650, retained outside scope):

- `src/features/chrome-v2/IndexGlance.tsx:199 (fontWeight literal/conditional/variable)`
- `src/features/chrome-v2/account-glance.css:23 (CSS font-weight)`
- `src/features/chrome-v2/account-glance.css:31 (CSS font-weight)`
- `src/features/composer-flow/review-course-search.css:42 (CSS font-weight)`
- `src/features/post-v2/components/golf/composerGolf.css:19 (CSS font-weight)`
- `src/features/post-v2/components/video/videoCreator.css:50 (CSS font-weight)`
- `src/features/review-v2/components/SubmitBar.tsx:89 (fontWeight literal/conditional/variable)`
- `src/features/review-v2/components/reviewReceipt.css:12 (CSS font-weight)`
- `src/features/review-v2/components/reviewReceipt.css:24 (CSS font-weight)`
- `src/features/review-v2/components/reviewReceipt.css:29 (CSS font-weight)`
- `src/features/review-v2/components/reviewReceipt.css:42 (CSS font-weight)`
- `src/features/review-v2/components/reviewReceipt.css:45 (CSS font-weight)`
