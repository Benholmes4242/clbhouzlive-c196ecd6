import React from 'react';
import { readFileSync } from 'node:fs';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { MediaRedirect } from '@/features/amateur/MediaRedirect';
import { mapWatchFilter } from '@/features/explore-magazine/watch/watchFilters';

const source = (path: string) => readFileSync(path, 'utf8');
const app = source('src/App.tsx');
function Location() { const loc = useLocation(); return <output data-testid="location">{loc.pathname + loc.search}</output>; }
afterEach(cleanup);
describe('CM1 legacy destinations', () => {
  it.each([
    ['/media', 'community'], ['/media?kind=clips', 'quick'],
    ['/media?kind=longer', 'long'], ['/media?kind=community', 'community'],
    ['/media?kind=unknown', 'community'], ['/explore/moments', 'community'],
    ['/explore/reviews', 'community'],
  ])('%s lands on the %s Watch address', (entry, chip) => {
    const shim = '/amateur?view=watch&watch=community';
    expect(app).toContain('<Route path="/media" element={<MediaRedirect />} />');
    if (entry.startsWith('/explore/')) expect(app).toContain(`<Route path="${entry}" element={<Shim to="${shim}" />} />`);
    render(<MemoryRouter initialEntries={[entry]}><Routes>
      <Route path="/media" element={<MediaRedirect />} />
      <Route path="/explore/moments" element={<Navigate to={shim} replace />} />
      <Route path="/explore/reviews" element={<Navigate to={shim} replace />} />
      <Route path="/amateur" element={<Location />} />
    </Routes></MemoryRouter>);
    expect(screen.getByTestId('location').textContent).toBe(`/amateur?view=watch&watch=${chip}`);
  });
  it.each([['quick', 'quick'], ['long', 'long'], ['community', 'community'], ['unknown', 'all']])('maps watch=%s to %s at the Explore entry', (value, expected) => {
    const magazine = source('src/features/explore-magazine/ExploreMagazine.tsx');
    expect(magazine).toContain("useState<WatchFilter>(() => mapWatchFilter(searchParams.get('watch')))");
    expect(mapWatchFilter(new URLSearchParams(`watch=${value}`).get('watch'))).toBe(expected);
    expect(magazine).toContain('key={watchEntry}');
  });
});
describe('CM1 Community CSS contract', () => {
  const css = source('src/features/explore-magazine/watch/explore-top.css');
  const rule = (selector: string) => css.split(`${selector} {`)[1]?.split('}')[0] ?? '';
  it('uses 16px row and 10px column gaps', () => { expect(rule('.explore-community-grid')).toContain('gap:16px 10px'); });
  it.each(['.explore-community-frame', '.explore-community-square'])('%s uses 12px corners', selector => { expect(rule(selector)).toContain('border-radius:12px'); });
  it('shows the rating chip while retaining other overlay hides', () => {
    expect(css).not.toContain('.explore-community-frame > button .review-tile-chip');
    for (const selector of ['.explore-community-frame > button span[aria-hidden]', '.explore-community-frame > button .standout-figure-chip', '.explore-community-frame > button [style*="bottom:"]']) expect(rule(selector)).toContain('display:none !important');
  });
  it('uses 1.3 name line height', () => { expect(rule('.explore-community-name')).toContain('line-height:1.3'); });
  it('wraps course names without clipping', () => {
    const course = rule('.explore-community-course');
    expect(course).toContain('line-height:1.3'); expect(course).toContain('overflow-wrap:anywhere');
    for (const removed of ['white-space:nowrap', 'overflow:hidden', 'text-overflow:ellipsis']) expect(course).not.toContain(removed);
  });
});