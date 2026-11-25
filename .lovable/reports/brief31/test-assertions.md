# Brief 31 authorised existing-test replacements
Eight renamed/replaced cases; the existing five-case and seven-case file totals are unchanged. No test file or case was deleted. Every unaffected RegionRankLine/ownerScoreLabel assertion stays unchanged.

## src/test/topTenTileWidth.test.tsx
**Old test:** tiles 2 and 3 sit in an equal minmax grid that text cannot widen
**New test:** tiles 2 and 3 share the three-column 2px block without widening tracks
**Why:** Brief 31 replaces the retired two-tile/list and score-pill layout with the signed-off three-column photograph block.
### Old assertions (complete case)
```tsx
  it('tiles 2 and 3 sit in an equal minmax grid that text cannot widen', () => {
    renderRail();
    const tile2 = screen.getByText('Muirfield').closest('button')!;
    const tile3 = screen.getByText('Sunningdale').closest('button')!;
    const grid = tile2.parentElement!;
    expect(grid.style.gridTemplateColumns).toBe('repeat(2, minmax(0, 1fr))');
    expect(grid).toContainElement(tile3);
    expect(tile2.style.minWidth).toBe('0');
    expect(tile3.style.minWidth).toBe('0');
  });
```
### New assertions (complete case)
```tsx
  it('tiles 2 and 3 share the three-column 2px block without widening tracks', () => {
    renderRail();
    const tile2 = screen.getByText('Muirfield').closest('button')!;
    const tile3 = screen.getByText('Sunningdale').closest('button')!;
    const grid = tile2.parentElement!;
    expect(getComputedStyle(grid).gridTemplateColumns.replace(/\s/g,'')).toBe('repeat(3,minmax(0,1fr))');
    expect(getComputedStyle(grid).gap).toBe('2px');
    expect(grid).toContainElement(tile3);
    expect(getComputedStyle(tile2).minWidth).toBe('0');
    expect(getComputedStyle(tile3).minWidth).toBe('0');
  });
```

## src/test/topTenOwnerLabelRender.test.tsx
**Old test:** both row score columns centre non-wrapping figures and labels with a 42px minimum
**New test:** the block uses three equal columns and 2px gutters
**Why:** Brief 31 replaces the retired two-tile/list and score-pill layout with the signed-off three-column photograph block.
### Old assertions (complete case)
```tsx
  it('both row score columns centre non-wrapping figures and labels with a 42px minimum', () => {
    renderRail({ isOwnProfile: false, ownerName: 'Thomas' });
    const row = document.querySelector('[data-top-ten-course-id="c4"]');
    expect(row).toBeInstanceOf(HTMLButtonElement);
    if (!(row instanceof HTMLButtonElement)) throw new Error('Expected the position-four row');
    const columns = Array.from(row.children).slice(-2);
    expect(columns).toHaveLength(2);
    for (const column of columns) {
      expect(column).toHaveStyle({ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '42px', flexShrink: '0' });
      expect((column as HTMLElement).style.width).toBe('');
      expect(column.children).toHaveLength(2);
      for (const child of Array.from(column.children)) {
        expect(child).toHaveStyle({ whiteSpace: 'nowrap' });
      }
    }
  });
```
### New assertions (complete case)
```tsx
  it('the block uses three equal columns and 2px gutters', () => {
    const {container}=renderRail({isOwnProfile:false,ownerName:'Thomas'});
    const grid=container.querySelector('[data-ten-block]');if(!grid)throw new Error('Missing block');
    expect(getComputedStyle(grid).gridTemplateColumns.replace(/\s/g,'')).toBe('repeat(3,minmax(0,1fr))');
    expect(getComputedStyle(grid).gap).toBe('2px');
  });
```

## src/test/topTenOwnerLabelRender.test.tsx
**Old test:** a visitor sees the owner\'s first name on every score label
**New test:** number one spans the full grid at 178px
**Why:** Brief 31 replaces the retired two-tile/list and score-pill layout with the signed-off three-column photograph block.
### Old assertions (complete case)
```tsx
  it('a visitor sees the owner\'s first name on every score label', () => {
    renderRail({ isOwnProfile: false, ownerName: 'Thomas' });
    expect(labelCount('Thomas')).toBe(5);
    expect(labelCount('Them')).toBe(0);
    expect(labelCount('You')).toBe(0);
  });
```
### New assertions (complete case)
```tsx
  it('number one spans the full grid at 178px', () => {
    const {container}=renderRail({isOwnProfile:false,ownerName:'Thomas'});
    const one=container.querySelector('[data-ten-position="1"]');if(!one)throw new Error('Missing number one');
    expect(getComputedStyle(one)).toMatchObject({gridColumn:'1/-1',height:'178px'});
  });
```

## src/test/topTenOwnerLabelRender.test.tsx
**Old test:** the name sits in the pill on the photograph tiles and under the score in the rows
**New test:** positions two to ten are square with rank at the top left
**Why:** Brief 31 replaces the retired two-tile/list and score-pill layout with the signed-off three-column photograph block.
### Old assertions (complete case)
```tsx
  it('the name sits in the pill on the photograph tiles and under the score in the rows', () => {
    renderRail({ isOwnProfile: false, ownerName: 'Thomas' });
    const tile1 = document.querySelector('[data-top-ten-course-id="c1"]')!;
    const row4 = document.querySelector('[data-top-ten-course-id="c4"]')!;
    expect(tile1.textContent).toContain('Thomas');
    expect(row4.textContent).toContain('Thomas');
    expect(row4.textContent).toContain('Golfers');
  });
```
### New assertions (complete case)
```tsx
  it('positions two to ten are square with rank at the top left', () => {
    const {container}=renderRail({isOwnProfile:false,ownerName:'Thomas'});
    for(const tile of container.querySelectorAll('[data-ten-position]:not([data-ten-position="1"])')){
      expect(getComputedStyle(tile).aspectRatio).toBe('1');
      const rank=tile.querySelector('.ten-rank');if(!rank)throw new Error('Missing rank');
      expect(getComputedStyle(rank)).toMatchObject({position:'absolute',left:'9px',top:'7px'});
    }
  });
```

## src/test/topTenOwnerLabelRender.test.tsx
**Old test:** with no owner name the label falls back to Them
**New test:** member ratings are plain text at the top right
**Why:** Brief 31 replaces the retired two-tile/list and score-pill layout with the signed-off three-column photograph block.
### Old assertions (complete case)
```tsx
  it('with no owner name the label falls back to Them', () => {
    renderRail({ isOwnProfile: false, ownerName: null });
    expect(labelCount('Them')).toBe(5);
    expect(labelCount('Thomas')).toBe(0);
  });
```
### New assertions (complete case)
```tsx
  it('member ratings are plain text at the top right', () => {
    const {container}=renderRail({isOwnProfile:false,ownerName:null});
    const score=container.querySelector('[data-ten-position="2"] [data-ten-corner-score]');if(!score)throw new Error('Missing score');
    expect(score.tagName).toBe('SPAN');expect(score).toHaveTextContent('9.0');
    expect(getComputedStyle(score)).toMatchObject({position:'absolute',right:'9px',top:'8px'});
    expect(score.classList.contains('ten-pill')).toBe(false);
  });
```

## src/test/topTenOwnerLabelRender.test.tsx
**Old test:** a name longer than nine characters reaches the pill clipped
**New test:** a null member rating leaves its corner empty without a dash
**Why:** Brief 31 replaces the retired two-tile/list and score-pill layout with the signed-off three-column photograph block.
### Old assertions (complete case)
```tsx
  it('a name longer than nine characters reaches the pill clipped', () => {
    renderRail({ isOwnProfile: false, ownerName: 'golfingwithellie' });
    expect(labelCount('golfingw\u2026')).toBe(5);
    expect(labelCount('golfingwithellie')).toBe(0);
  });
```
### New assertions (complete case)
```tsx
  it('a null member rating leaves its corner empty without a dash', () => {
    const old=h.courses[1].rating;h.courses[1].rating=null as unknown as number;
    try { const {container}=renderRail({isOwnProfile:false,ownerName:'golfingwithellie'});
      const tile=container.querySelector('[data-ten-position="2"]');
      expect(tile?.querySelector('[data-ten-corner-score]')).toBeNull();expect(tile?.textContent).not.toContain('–');
    } finally { h.courses[1].rating=old; }
  });
```

## src/test/topTenOwnerLabelRender.test.tsx
**Old test:** your own profile still reads You
**New test:** resting owner tiles carry no score pills, badges or score labels
**Why:** Brief 31 replaces the retired two-tile/list and score-pill layout with the signed-off three-column photograph block.
### Old assertions (complete case)
```tsx
  it('your own profile still reads You', () => {
    renderRail({ isOwnProfile: true, ownerName: 'Thomas' });
    expect(labelCount('You')).toBe(5);
    expect(labelCount('Thomas')).toBe(0);
    expect(labelCount('Them')).toBe(0);
  });
});

describe('FIX_PROFILE_FORM_RAIL_AND_TOP10_GAP Top 10 spacing', () => {
```
### New assertions (complete case)
```tsx
  it('resting owner tiles carry no score pills, badges or score labels', () => {
    const {container}=renderRail({isOwnProfile:true,ownerName:'Thomas'});
    expect(container.querySelector('.ten-tile .ten-pill')).toBeNull();expect(container.querySelector('.ten-tile .pro-label')).toBeNull();
    expect(container.querySelector('.ten-tile .ten-label')).toBeNull();expect(container.querySelector('.ten-tile [data-badge]')).toBeNull();
    expect(container.querySelectorAll('[data-ten-position]')).toHaveLength(10);
  });
```

## src/test/topTenOwnerLabelRender.test.tsx
**Old test:** the #1 button is block and the 2/3 grid sits 6px below with a 6px gap
**New test:** all tile names stay on one line with ellipsis inside the shared block
**Why:** Brief 31 replaces the retired two-tile/list and score-pill layout with the signed-off three-column photograph block.
### Old assertions (complete case)
```tsx
  it('the #1 button is block and the 2/3 grid sits 6px below with a 6px gap', () => {
    renderRail({ isOwnProfile: true });
    const one = document.querySelector('[data-top-ten-course-id="c1"]') as HTMLElement;
    expect(one.style.display).toBe('block');
    expect(one.style.width).toBe('100%');
    const grid = (document.querySelector('[data-top-ten-course-id="c2"]') as HTMLElement).parentElement as HTMLElement;
    expect(grid.style.gap).toBe('6px');
    expect(grid.style.marginTop).toBe('6px');
  });
});
```
### New assertions (complete case)
```tsx
  it('all tile names stay on one line with ellipsis inside the shared block', () => {
    const {container}=renderRail({isOwnProfile:true});
    const names=container.querySelectorAll('.ten-name');expect(names).toHaveLength(5);
    for(const name of names)expect(getComputedStyle(name)).toMatchObject({whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'});
  });
});
```

## Other existing test edits
- `src/test/profileRailFollowup.test.tsx`: added a server-block hook mock for the same deep-link test; every existing assertion is unchanged.
- `src/features/activity-v2/utils/__tests__/notifRoute.parity.test.ts`: added one `top_ten_update` parity vector and one explicit profile-route assertion; no existing assertion was edited. The file increased by two cases (90 → 92).