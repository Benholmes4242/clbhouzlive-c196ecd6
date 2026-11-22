/** FEED MEDIA CHROME — one glass, one hole chip with tap-to-expand, the bottom
 * media row, hairline-only faces, the merged tag list and its batched read,
 * MentionText deep links, the shared region formatter and the score tile. */
import React from 'react';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';

const h = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn(), faces: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: h.rpc, from: h.from } }));
vi.mock('@/lib/members/readMemberFaces', () => ({ readMemberFaces: h.faces }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

import { CHIP_GLASS } from '@/lib/tokens/glass';
import { FeedHoleChip, HoleChip } from '@/components/feed/PostGolfContext';
import { PlayedWithChip, PlayedWithPanel, SlideTagChip } from '@/components/feed/PostGolfTags';
import { mergeTagged } from '@/lib/mentions/taggedEntities';
import { fetchMentionEntities } from '@/hooks/feed/mentionEntities';
import { formatRegionLine } from '@/lib/courses/regionLine';
import { ReviewScoreRow } from '@/components/shared/ReviewScoreRow';
import { MentionText } from '@/components/mentions/MentionText';

const U1 = '11111111-1111-1111-1111-111111111111';
const U2 = '22222222-2222-2222-2222-222222222222';
const B1 = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const AUTHOR = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

afterEach(() => { cleanup(); vi.clearAllMocks(); });

const withClient = (ui: React.ReactNode) => <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { if (name !== 'test') walk(p, out); }
    else if (/\.(tsx?|css)$/.test(name) && !/\.test\./.test(name)) out.push(p);
  }
  return out;
}

describe('one glass and one hole chip', () => {
  it('the chip material is the signed-off glass', () => {
    expect(CHIP_GLASS).toEqual({ background: 'rgba(14,14,16,0.55)', border: '1px solid rgba(255,255,255,0.14)', backdropFilter: 'blur(18px) saturate(150%)', WebkitBackdropFilter: 'blur(18px) saturate(150%)' });
  });
  it('only PostGolfContext draws a hole chip, and a slide hole tag never draws a second one', () => {
    const owners = walk('src').filter((p) => readFileSync(p, 'utf8').includes('data-testid="post-hole-chip"'));
    expect(owners).toEqual([join('src', 'components', 'feed', 'PostGolfContext.tsx')]);
    const { container } = render(<SlideTagChip tag={{ hole: 18, par: 4 }} />);
    expect(container.firstChild).toBeNull();
  });
  it('the chip, pill and mute all use the shared glass', () => {
    const { getByTestId } = render(<>
      <HoleChip holeNo={3} hole={{ hole_no: 3, par: 4, yards: 412, si: null } as never} />
      <PlayedWithChip people={[{ userId: U1, name: 'Thomas' }]} expanded={false} onToggle={() => {}} />
    </>);
    for (const el of [getByTestId('post-hole-chip'), getByTestId('played-with-chip')]) {
      expect(el.style.background).toBe('rgba(14, 14, 16, 0.55)');
      expect(el.style.border).toBe('1px solid rgba(255,255,255,0.14)');
    }
    expect(readFileSync('src/audio/MuteButton.tsx', 'utf8')).toContain("size === 'chip' ? { ...CHIP_GLASS");
  });
  it('the hole chip is 28 high, radius 9, 10.5px at weight 700', () => {
    const { getByTestId } = render(<HoleChip holeNo={3} hole={{ hole_no: 3, par: 4, yards: 412, si: null } as never} />);
    const chip = getByTestId('post-hole-chip');
    expect([chip.style.height, chip.style.borderRadius, chip.style.fontSize, chip.style.fontWeight]).toEqual(['28px', '9px', '10.5px', '700']);
    expect(chip.textContent).toBe('3RD· PAR 4 · 412 YDS');
  });
});

describe('tap to expand', () => {
  const analysis = { available: true, total_rounds: 40, holes: [{ hole_no: 3, par: 4, yards: 412, stroke_index: 4, rounds: 40, avg_to_par: 0.71, avg_gross: 4.7, dist: {} }] };
  function mount(resetKey = 0) {
    h.rpc.mockResolvedValue({ data: analysis, error: null });
    const outer = vi.fn();
    const ui = (k: number) => withClient(<div onClick={outer} style={{ position: 'relative' }}><FeedHoleChip holeNo={3} hole={{ hole_no: 3, par: 4, yards: 412, si: null } as never} courseId="c1" resetKey={k} /></div>);
    const view = render(ui(resetKey));
    return { ...view, outer, rerenderKey: (k: number) => view.rerender(ui(k)) };
  }
  it('reads nothing until tapped, then expands to the hole card with its facts', async () => {
    const v = mount();
    expect(h.rpc).not.toHaveBeenCalled();
    fireEvent.click(v.getByTestId('post-hole-chip'));
    const card = await v.findByTestId('post-hole-card');
    await waitFor(() => expect(card.querySelector('[data-hole-card-stat="si"]')?.textContent).toBe('4Stroke index'));
    expect(card.querySelector('[data-hole-card-stat="field"]')?.textContent).toBe('+0.7Field loses');
    expect(card.textContent).toContain('Par 4 · 412 yards');
    expect(card.style.left).toBe('12px'); expect(card.style.right).toBe('12px'); expect(card.style.top).toBe('12px'); expect(card.style.borderRadius).toBe('18px');
    expect(h.rpc).toHaveBeenCalledTimes(1);
  });
  it('collapses on a second tap and on slide change; neither tap reaches the card', async () => {
    const v = mount();
    fireEvent.click(v.getByTestId('post-hole-chip'));
    fireEvent.click(await v.findByTestId('post-hole-card'));
    expect(v.queryByTestId('post-hole-card')).toBeNull();
    fireEvent.click(v.getByTestId('post-hole-chip'));
    await v.findByTestId('post-hole-card');
    v.rerenderKey(1);
    expect(v.queryByTestId('post-hole-card')).toBeNull();
    expect(v.getByTestId('post-hole-chip')).toBeTruthy();
    expect(v.outer).not.toHaveBeenCalled();
  });
  it('without scored analysis the card shows only what exists', async () => {
    h.rpc.mockResolvedValue({ data: { available: true, total_rounds: 0, holes: [] }, error: null });
    const v = render(withClient(<FeedHoleChip holeNo={18} courseId="c1" />));
    expect(v.getByTestId('post-hole-chip').textContent).toBe('18TH');
    fireEvent.click(v.getByTestId('post-hole-chip'));
    const card = await v.findByTestId('post-hole-card');
    await waitFor(() => expect(h.rpc).toHaveBeenCalled());
    expect(card.querySelector('[data-hole-card-stat]')).toBeNull();
    expect(card.querySelector('[data-hole-card-divider]')).toBeNull();
  });
});

describe('bottom of the media', () => {
  const css = readFileSync('src/components/feed/played-with.css', 'utf8');
  it('pill bottom-left at 12, centred on the 36px mute row at 15 beside a video, leaving the mute room', () => {
    expect(css).toContain('[data-pw-offset="media"]{bottom:12px}');
    expect(css).toContain('[data-pw-offset="media-video"]{bottom:15px}');
    expect(css).toContain('[data-pw-offset="review-video"]{bottom:15px}');
    expect(css).toContain('[data-pw-offset="review-video"]{max-width:calc(100% - 74px)}');
    const { getByTestId } = render(<PlayedWithChip people={[{ userId: U1, name: 'Thomas' }]} expanded={false} onToggle={() => {}} />);
    expect(getByTestId('played-with-chip').style.left).toBe('12px');
  });
  it('mute bottom-right (36px circle at 12px inside its 44px hit area); dots at one fixed height, 58px', () => {
    const video = readFileSync('src/components/feed/InlineVideo.tsx', 'utf8');
    expect(video).toContain("data-inline-video-mute style={{ position: 'absolute', right: 8, bottom: 8, zIndex: 30 }}");
    expect(readFileSync('src/audio/MuteButton.tsx', 'utf8')).toContain("size === 'chip' ? 36");
    const carousel = readFileSync('src/components/feed/MediaCarousel.tsx', 'utf8');
    expect(carousel).toContain('bottom: 58,');
    expect(carousel).not.toContain('--review-glass-h');
  });
  it('the pill text is 13px/700 white and ellipsises', () => {
    const { getByTestId } = render(<PlayedWithChip people={[{ userId: U1, name: 'Thomas' }, { userId: U2, name: 'Danny' }]} expanded={false} onToggle={() => {}} />);
    const chip = getByTestId('played-with-chip');
    expect([chip.style.height, chip.style.borderRadius, chip.style.padding, chip.style.gap, chip.style.fontSize, chip.style.fontWeight]).toEqual(['30px', '999px', '0px 12px 0px 4px', '8px', '13px', '700']);
    const text = chip.lastElementChild as HTMLElement;
    expect(text.textContent).toBe('with Thomas and Danny');
    expect(readFileSync('src/components/feed/PostGolfTags.tsx', 'utf8')).toContain("<span style={{ overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{text}</span>");
  });
});

describe('faces', () => {
  it('carry only the canonical hairline, no boxShadow ring, overlapping by 6px', () => {
    const people = [{ userId: U1, name: 'A' }, { userId: U2, name: 'B' }, { userId: B1, name: 'C', kind: 'business' as const }];
    const { container } = render(<PlayedWithChip people={people} expanded={false} onToggle={() => {}} />);
    const faces = [...container.querySelectorAll<HTMLElement>('[data-played-with-face]')];
    expect(faces).toHaveLength(3);
    for (const f of faces) expect(f.style.boxShadow).toBe('');
    expect(faces.map((f) => f.style.marginLeft)).toEqual(['0px', '-6px', '-6px']);
    expect(readFileSync('src/components/feed/PostGolfTags.tsx', 'utf8')).not.toContain('boxShadow: `0 0 0 1.5px');
  });
});

describe('everyone tagged', () => {
  const pw = [{ userId: U1, name: 'Thomas' }];
  const text = `golf day with @[Danny](u:${U2}) and @[Mashie](b:${B1}) and @[Thomas](u:${U1}) and @[Me](u:${AUTHOR})`;
  it('played-with first, then mentions in text order, de-duplicated, author excluded', () => {
    const out = mergeTagged(pw, text, [AUTHOR]);
    expect(out.map((p) => [p.kind, p.userId])).toEqual([['user', U1], ['user', U2], ['business', B1]]);
  });
  it('a mention-only post still has a list, with markup names when the entity is unread', () => {
    const out = mergeTagged(null, `@[Mashie](b:${B1})`, [AUTHOR]);
    expect(out).toEqual([{ userId: B1, kind: 'business', name: 'Mashie', username: null, avatarUrl: null }]);
  });
  it('read entities supply names and faces', () => {
    const out = mergeTagged(null, `@[old](u:${U2})`, [AUTHOR], new Map([[`user:${U2}`, { name: 'Danny H', avatarUrl: 'x.jpg', username: 'dh' }]]));
    expect(out[0]).toMatchObject({ name: 'Danny H', avatarUrl: 'x.jpg', username: 'dh' });
  });
  it('the panel lists businesses too and opens each by kind', () => {
    const open = vi.fn();
    const { container } = render(<PlayedWithPanel people={mergeTagged(pw, text, [AUTHOR])} onClose={() => {}} onOpenProfile={open} />);
    const rows = [...container.querySelectorAll<HTMLElement>('[data-played-with-row]')];
    expect(rows.map((r) => r.getAttribute('data-tag-kind'))).toEqual(['user', 'user', 'business']);
    fireEvent.click(rows[2]); expect(open).toHaveBeenCalledWith(B1, 'business');
  });
  it('reviews get the merged pill on the card path (no isReview exclusion)', () => {
    const src = readFileSync('src/components/feed/FeedCard.tsx', 'utf8');
    expect(src).not.toContain("!post.isReview && playedWith?.length");
    expect(src).toContain('playedWith={withPeople ?? undefined}');
  });
  it('the mention read is ONE batch per page: one member read, one business read', async () => {
    h.faces.mockResolvedValue(new Map([[U2, { id: U2, displayName: 'Danny', username: 'd', photoUrl: null }]]));
    const inFn = vi.fn().mockResolvedValue({ data: [{ id: B1, name: 'Mashie', logo_url: 'l.png' }] });
    h.from.mockImplementation(() => ({ select: () => ({ in: inFn }) }));
    const map = await fetchMentionEntities({ users: [U1, U2], businesses: [B1] });
    expect(h.faces).toHaveBeenCalledTimes(1); expect(h.faces).toHaveBeenCalledWith([U1, U2]);
    expect(h.from).toHaveBeenCalledTimes(1); expect(h.from).toHaveBeenCalledWith('business_accounts');
    expect(map.get(`business:${B1}`)).toEqual({ name: 'Mashie', avatarUrl: 'l.png' });
    const tags = readFileSync('src/hooks/feed/usePostGolfTags.ts', 'utf8');
    expect(tags).toContain('fetchMentionEntities(mentionKeys)');
  });
});

describe('mentions are deep links', () => {
  it('every feed caption/review-text renderer and the review sheet render through MentionText', () => {
    for (const f of ['src/components/feed/FeedCard.tsx', 'src/components/feed/ReviewPostCard.tsx', 'src/components/posts/ReviewBottomSheet.tsx']) {
      expect(readFileSync(f, 'utf8')).toMatch(/<MentionText[\s\S]*?text=/);
    }
  });
  it('tapping a mention opens that profile without opening the card', () => {
    const card = vi.fn();
    let path = '';
    function Where() { path = useLocation().pathname; return null; }
    const { getByText } = render(<MemoryRouter><div onClick={card}><MentionText text={`hi @[Danny](u:${U2}) at @[Mashie](b:${B1})`} /></div><Routes><Route path="*" element={<Where />} /></Routes></MemoryRouter>);
    fireEvent.click(getByText('Danny')); expect(path).toBe(`/profile/${U2}`);
    fireEvent.click(getByText('Mashie')); expect(path).toBe(`/business/${B1}`);
    expect(card).not.toHaveBeenCalled();
  });
});

describe('region line', () => {
  it('region (or sub-country) then country, de-duplicated', () => {
    expect(formatRegionLine({ region: 'Surrey', subCountry: 'England', country: 'Britain & Ireland' })).toBe('Surrey, Britain & Ireland');
    expect(formatRegionLine({ region: '', subCountry: 'Girona', country: 'Spain' })).toBe('Girona, Spain');
    expect(formatRegionLine({ region: 'Spain', country: 'spain' })).toBe('Spain');
    expect(formatRegionLine({ country: 'Spain' })).toBe('Spain');
    expect(formatRegionLine({})).toBe('');
  });
  it('both cards use the shared formatter', () => {
    expect(readFileSync('src/components/feed/FeedCard.tsx', 'utf8')).toContain('formatRegionLine(');
    expect(readFileSync('src/components/feed/ReviewPostCard.tsx', 'utf8')).toContain('formatRegionLine(');
    expect(readFileSync('src/components/feed/ReviewPostCard.tsx', 'utf8')).not.toContain('data-review-glass-region');
  });
});

describe('score tile', () => {
  it('glass tile, overall lead left-aligned, divider, four cells spaced between', () => {
    const { container } = render(<ReviewScoreRow variant="tile" overall={8.7} breakdown={{ design: 8.7, condition: 8.8, clubhouse: 8.7, facilities: 7 }} />);
    const tile = container.querySelector<HTMLElement>('[data-score-tile]')!;
    expect([tile.style.borderRadius, tile.style.justifyContent, tile.style.background]).toEqual(['18px', 'space-between', 'rgba(14, 14, 16, 0.55)']);
    const kids = [...tile.children] as HTMLElement[];
    expect(kids.map((k) => k.getAttribute('data-score-cell') ?? (k.hasAttribute('data-score-tile-divider') ? 'divider' : '?'))).toEqual(['overall', 'divider', 'design', 'condition', 'clubhouse', 'facilities']);
    expect(kids[0].style.textAlign).toBe('left');
    expect(kids[1].style.width).toBe('1px');
    for (const f of tile.querySelectorAll<HTMLElement>('[data-score-figure], [data-score-label]')) expect(f.style.fontWeight).toBe('700');
  });
  it('sizes: 34/19 figures, 8px labels, 12px 16px padding; 30/17, 7px and 12px below 340px', () => {
    const css = readFileSync('src/components/feed/feed-media-chrome.css', 'utf8');
    for (const rule of ['[data-score-tile]{padding:12px 16px}', '[data-score-tile-lead] [data-score-figure]{font-size:34px}', '[data-score-tile-cell] [data-score-figure]{font-size:19px}', '[data-score-tile] [data-score-label]{font-size:8px;letter-spacing:.1em}', '[data-score-tile]{padding:12px}', '[data-score-tile-lead] [data-score-figure]{font-size:30px}', '[data-score-tile-cell] [data-score-figure]{font-size:17px}', '[data-score-tile] [data-score-label]{font-size:7px;letter-spacing:.06em}']) expect(css).toContain(rule);
    expect(css).toContain('@media (max-width:339.98px)');
  });
});
