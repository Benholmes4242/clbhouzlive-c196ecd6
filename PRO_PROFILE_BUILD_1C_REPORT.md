# Pro profile build 1c — implemented; verification stopped

## Delivered
OWGR result rows display total strokes only at14px/800. Result sheets display FINISH/STROKES/WORLD RANK and round strokes at20px/800, with the plain OWGR footnote followed by the retained points sentence. All course-par controls, maths, attribution, saves and admin lookup are removed. Explicit event projection does not fetch dormant par fields. Pro-added/covered-tour signed to-par stays unchanged. Build1b hero/avatar/social/ordinal/month/SCORING/rank rules retained. No SQL/migrations/types/database/sync/native/feed_config changes.

Deleted production file: src/features/pro-profile/ProParSheet.tsx. Other changed production files: ProSeasonSection.tsx, ProEventSheets.tsx, ProProfileBuildOne.tsx, proProfileRules.ts, pro-profile.css, useProProfile.ts, src/pages/ProfilePageV2.tsx. Local read-ownership rule is in useProProfile's header; cross-area AGENTS.md unchanged.

## Test accounting
Prior expected inventory7,198/632 (previous full run stopped, not verified green). This build deletes18 par cases, adds8 cases, rewrites/renames1 mixed par/rank case without changing its count. Expected full inventory7,188/632, net−10 tests, no file-count change. src/test/proProfileBuildOneB.test.tsx changes49→39. All other test files untouched.

Added8: OWGR row ignores dormant course par and stored to-par; no par controls for visitor/owner/admin (3); Mason Hulencourt/Bordoni strokes and rounds (2); nonOWGR pro/tour keeps signed to-par and red under par (2).

## Exact commands and results
- `bunx vitest run src/test/proProfileBuildOneB.test.tsx src/test/proProfileBuildOne.test.tsx src/test/proProfileBuildOneRules.test.ts src/test/proProfileSeason.test.tsx --maxWorkers=2`:87/87 passed,4 files; `/tmp/pro-build1c/focused.log`.
- `bunx vitest run --maxWorkers=2 --shard=1/4`:1,870 passed,158 files; `/tmp/pro-build1c/shard1.log`.
- `bunx vitest run --maxWorkers=2 --shard=2/4`:1,717 passed,158 files; `/tmp/pro-build1c/shard2.log`.
- `bunx vitest run --maxWorkers=2 --shard=3/4`:1,832 passed+5 failed=1,837 executed,158 files; `/tmp/pro-build1c/shard3.log` retains complete output.
- Shard4 not run: required stop. Executed subtotal5,424/474:5,419 passed+5 failed. No full-suite pass claim.
- Preview newest build entry2026-11-06T00:20:12Z: `build OK`; no manual build/typecheck.

## Unexpected failures — stopped, untouched
`src/test/ac2ActivityFold.test.tsx:216:19` (“opens in place in score order with the not-ready round last, changes the day label and never marks read”) and `:253:19` (“keeps the fold open across a refetch of the same section”).
Both: `TestingLibraryElementError: Unable to find an element with the text: Today · 4 golfers posted rounds. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.`
These also occurred in build1b, but only FS_NOTCH is authorized to continue, so no repair/rerun/shard4.

## Three known failures, separate
- src/test/fsNotch1.test.tsx:37:45: `AssertionError: expected '' to be '0px' // Object.is equality`.
- src/lib/media/__tests__/fullscreenBand.test.ts:65:18: expected width251.33333333333334; received251.33333333333331.
- src/lib/media/__tests__/fullscreenBand.test.ts:75:22: `AssertionError: expected 98.83333333333331 to be +0 // Object.is equality`.

## Verification limits
The brief names build1c-pro-strokes-signed-off.html, but it was not attached or present in the upload mount; implemented the explicit removal rules while preserving1b's other presentation. 320px three-view browser checks not run after the stop. Live authenticated checks unavailable for external unmanaged Supabase; no credentials requested or sessions minted. Focused tests use fixtures, not hosted data.

## Deleted tests, exact former assertions
All in src/test/proProfileBuildOneB.test.tsx. Each deletion is authorized by build1c's retirement of course-par behavior; no new assertion replaces a deleted case.

```tsx
it('Hulencourt total is plus3 at72',()=>expect(eventToPar(event({course_par:72}))).toBe(3));
```

```tsx
it.each([[0,-1],[1,3],[2,1]])('Hulencourt round %s',(i,score)=>{const e=event({course_par:72});expect(roundToPar(e,e.rounds[i])).toBe(score);});
```

```tsx
it('no par never assumes72',()=>expect(eventToPar(event({total_strokes:140}))).toBeNull());
```

```tsx
it('member score remains to-par despite par',()=>expect(eventToPar(event({source:'pro',to_par:-2,course_par:72}))).toBe(-2));
```

```tsx
it('counts only owgr stroke rounds',()=>{const e=event({course_par:72});e.rounds.push({...e.rounds[0],source:'pro',strokes:70});expect(eventToPar(e)).toBe(3);});
```

```tsx
it('missing-par qualification excludes nonOWGR and absent gross',()=>expect([event(),event({source:'pro'}),event({total_strokes:null}),event({course_par:72})].filter(needsPar)).toHaveLength(1));
```

```tsx
it('player attribution',()=>expect(parFootnote(event({course_par:72,course_par_set_by:'pro'}),'Mason')).toContain('Par 72, added by Mason.'));
```

```tsx
it('other setter attribution',()=>expect(parFootnote(event({course_par:72,course_par_set_by:'admin'}),'Mason')).toBe('Strokes as published by the Official World Golf Ranking. Par 72.'));
```

```tsx
it('no-par attribution',()=>expect(parFootnote(event(),'Mason')).toContain("which doesn't publish par."));
```

```tsx
it.each([59,76,72.5])('rejects invalid par %s',async n=>{await expect(saveCoursePar('11624',n)).rejects.toThrow();expect(s.rpc).not.toHaveBeenCalled();});
```

```tsx
it('row stacks score plus gross',()=>{mount(<ProSeasonSection events={[event({course_par:72})]} first="Mason" year={2026} userId="pro" owner={false} linked={false}/>);const row=screen.getByRole('button',{name:/T31 Hulencourt/});expect(within(row).getByText('+3')).toBeInTheDocument();expect(within(row).getByText('219')).toBeInTheDocument();});
```

```tsx
it('owner and admin have missing-par controls',()=>{mount(<ProSeasonSection events={[event(),event({id:'set',course_par:72})]} first="Mason" year={2026} userId="pro" owner={false} canEditPar linked={false}/>);expect(screen.getByText('1 results show strokes only.')).toBeInTheDocument();expect(screen.getAllByRole('button',{name:'Add par'})).toHaveLength(2);});
```

```tsx
it('par card hides at zero',()=>{mount(<ProSeasonSection events={[event({course_par:72})]} first="Mason" year={2026} userId="pro" owner canEditPar linked={false}/>);expect(screen.queryByText('Add the course par')).toBeNull();});
```

```tsx
it('Save is explicit then invalidates events',async()=>{const v=mount(<ProParSheet events={[event()]} close={vi.fn()}/>);const invalidate=vi.spyOn(v.cache,'invalidateQueries');expect(s.rpc).not.toHaveBeenCalled();fireEvent.click(screen.getByRole('button',{name:/Increase par/}));expect(s.rpc).not.toHaveBeenCalled();fireEvent.click(screen.getByRole('button',{name:'Save'}));await waitFor(()=>expect(s.rpc).toHaveBeenCalledWith('set_pro_event_par',{p_event_id:'11624',p_par:73}));await waitFor(()=>expect(invalidate).toHaveBeenCalledWith({queryKey:['pro-profile','events','pro']}));});
```

Parameterized deletions expand Hulencourt round %s into rounds0/1/2 and rejects invalid par %s into59/76/72.5:14 declarations,18 executed cases.

## Rewritten/renamed test
The mixed result-par/rank case retains its world-rank checks while replacing par display with stroke display, as the brief requires.
**Old:**
```tsx
 it('result par tiles and formatted rank',()=>{mount(<ResultDetail event={event({course_par:72})} first="Mason" close={vi.fn()}/>);expect(screen.getByText('219 STROKES')).toBeInTheDocument();expect(screen.getByText('1,426')).toBeInTheDocument();expect(screen.getByText('▲ 14')).toHaveClass('pro-profile-up');expect(screen.getByText('−1')).toHaveClass('pro-profile-under');});
```
**New:**
```tsx
 it('result strokes tiles and formatted rank',()=>{mount(<ResultDetail event={event()} close={vi.fn()}/>);expect(screen.getByText('STROKES')).toBeInTheDocument();expect(screen.getByText('219')).toBeInTheDocument();expect(screen.getByText('1,426')).toBeInTheDocument();expect(screen.getByText('▲ 14')).toHaveClass('pro-profile-up');expect(screen.getByText('71')).not.toHaveClass('pro-profile-under');});
```
