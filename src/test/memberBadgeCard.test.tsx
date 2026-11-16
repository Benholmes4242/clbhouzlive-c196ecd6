import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const h = vi.hoisted(() => ({
  pros: new Map<string, Record<string, unknown>>(),
  rpc: {} as Record<string, unknown>,
  tables: {} as Record<string, { data?: unknown; count?: number | null }>,
  track: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => {
  const builder = (table: string) => {
    const result = () => ({ data: h.tables[table]?.data ?? null, count: h.tables[table]?.count ?? null, error: null });
    const b: Record<string, unknown> = {};
    for (const m of ['select', 'eq', 'gte', 'lte', 'lt', 'order']) b[m] = () => b;
    b.maybeSingle = () => Promise.resolve(result());
    b.then = (ok: (v: unknown) => unknown) => Promise.resolve(result()).then(ok);
    return b;
  };
  return { supabase: { rpc: (name: string) => Promise.resolve({ data: h.rpc[name] ?? null, error: null }), from: builder } };
});
vi.mock('@/features/pro-verification/useProMembers', () => ({
  useProMembers: (ids: readonly (string | null | undefined)[]) => ({ members: new Map(ids.filter(Boolean).map(id => [id, h.pros.get(id as string)]).filter(([, v]) => v) as [string, unknown][]), isLoading: false }),
}));
vi.mock('@/features/pro-verification/proMembersCache', () => ({ cachedProMember: (id: string) => h.pros.get(id) ?? null }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: h.track } }));

import { ProLabel } from '@/features/pro-verification/ProLabel';
import { amateurFacts, amateurYearMove, badgeProfileButton, BADGE_MOVE_GREEN, BADGE_MOVE_RED, tourFacts } from '@/features/member-badge/memberBadgeRules';
import { anchoredGlancePosition } from '@/features/chrome-v2/GlanceShell';

const teaching = { user_id: 'jay', pro_kind: 'teaching_pro', pro_tour: null, pro_tour_code: null, pro_club: 'Sundridge Park Golf Club', pro_player_id: null };
const tour = { user_id: 'mason', pro_kind: 'tour_pro', pro_tour: 'Alps Tour', pro_tour_code: null, pro_club: null, pro_player_id: null };

function mount(node: React.ReactNode, path = '/explore') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}><Routes><Route path="*" element={node} /></Routes></MemoryRouter></QueryClientProvider>);
}
const card = () => document.querySelector('[data-member-badge-card]') as HTMLElement | null;

beforeEach(() => {
  vi.clearAllMocks();
  h.pros = new Map([['jay', teaching], ['mason', tour]]);
  h.rpc = {};
  h.tables = {};
});
afterEach(cleanup);

describe('member badge card variants', () => {
  it('teaching pro: title, name · club, body, no facts', () => {
    mount(<ProLabel userId="jay" name="Jay Kelly" />);
    fireEvent.click(screen.getByRole('button', { name: 'PRO, what this means' }));
    expect(card()?.querySelector('.mbc-title')?.textContent).toBe('Teaching professional');
    expect(card()?.querySelector('.mbc-who')?.textContent).toBe('Jay Kelly · Sundridge Park Golf Club');
    expect(card()?.querySelector('.mbc-body')?.textContent).toBe("A qualified golf coach, checked by clbhouz before the badge goes on. Teaching pros don't carry a handicap, so they don't appear on member leaderboards.");
    expect(card()?.querySelector('[data-mbc-facts]')).toBeNull();
    expect(h.track).toHaveBeenCalledWith('member_badge_opened', { kind: 'teaching_pro', surface: 'unknown' });
  });
  it('teaching pro with no club shows the name alone', () => {
    h.pros.set('jay', { ...teaching, pro_club: null });
    mount(<ProLabel userId="jay" name="Jay Kelly" />);
    fireEvent.click(screen.getByRole('button', { name: 'PRO, what this means' }));
    expect(card()?.querySelector('.mbc-who')?.textContent).toBe('Jay Kelly');
  });
  it('tour pro: title, name · tour, body and figures when results are visible', async () => {
    h.rpc = { pro_results_visible: true, get_pro_world_rank: { rank: 1284 } };
    h.tables = { pro_events: { count: 14 } };
    mount(<ProLabel userId="mason" name="Mason Essam" />);
    fireEvent.click(screen.getByRole('button', { name: 'PRO, what this means' }));
    expect(card()?.querySelector('.mbc-title')?.textContent).toBe('Tour professional');
    expect(card()?.querySelector('.mbc-who')?.textContent).toBe('Mason Essam · Alps Tour');
    expect(card()?.querySelector('.mbc-body')?.textContent).toBe('A professional who plays for prize money on a tour, checked by clbhouz. Their results come straight from the Official World Golf Ranking.');
    await waitFor(() => expect(card()?.querySelectorAll('.mbc-fact b')).toHaveLength(2));
    expect([...card()!.querySelectorAll('.mbc-fact b')].map(b => b.textContent)).toEqual(['#1,284', '14']);
  });
  it('tour pro figures hide when the results switch is off', async () => {
    h.rpc = { pro_results_visible: false, get_pro_world_rank: { rank: 1284 } };
    h.tables = { pro_events: { count: 14 } };
    mount(<ProLabel userId="mason" name="Mason Essam" />);
    fireEvent.click(screen.getByRole('button', { name: 'PRO, what this means' }));
    await new Promise(r => setTimeout(r, 20));
    expect(card()?.querySelector('[data-mbc-facts]')).toBeNull();
    expect(card()?.querySelector('.mbc-title')?.textContent).toBe('Tour professional');
  });
  it('amateur: title, name only, body, rank and green improvement', async () => {
    const year = new Date().getFullYear();
    h.rpc = { amateur_results_visible: true };
    h.tables = { amateur_rank_summary: { data: { rank: 412 } }, amateur_rank_history: { data: [{ id: 1, week: year * 100 + 2, rank: 450 }] } };
    mount(<ProLabel kind="am" userId="ellie" name="golfingwithellie" />);
    fireEvent.click(screen.getByRole('button', { name: 'AM, what this means' }));
    expect(card()?.querySelector('.mbc-title')?.textContent).toBe('Elite amateur');
    expect(card()?.querySelector('.mbc-who')?.textContent).toBe('golfingwithellie');
    expect(card()?.querySelector('.mbc-body')?.textContent).toBe('Ranked on the World Amateur Golf Ranking, the official list for the top amateurs in the game. Their ranking and results come straight from WAGR.');
    await waitFor(() => expect(card()?.querySelectorAll('.mbc-fact b')).toHaveLength(2));
    const move = card()!.querySelectorAll('.mbc-fact b')[1] as HTMLElement;
    expect(move.textContent).toBe('▲ 38');
    expect(move.style.color).toBe('rgb(52, 215, 127)');
    expect(card()?.querySelector('[data-mbc-profile]')?.textContent).toBe('Open their profile ›');
  });
});

describe('member badge figure rules', () => {
  it('null figures are dropped', () => {
    expect(tourFacts(null, 3).map(f => f.label)).toEqual(['Events this year']);
    expect(tourFacts(5, null).map(f => f.label)).toEqual(['World ranking']);
    expect(amateurFacts(null, null)).toEqual([]);
  });
  it('movement: improvement green with ▲, fall red with ▼, none dropped', () => {
    expect(amateurFacts(10, 38)[1]).toEqual({ value: '▲ 38', label: 'This year', color: BADGE_MOVE_GREEN });
    expect(amateurFacts(10, -7)[1]).toEqual({ value: '▼ 7', label: 'This year', color: BADGE_MOVE_RED });
    expect(BADGE_MOVE_GREEN).toBe('#34D77F');
    expect(BADGE_MOVE_RED).toBe('#E24B3F');
    expect(amateurFacts(10, 0)).toHaveLength(1);
  });
  it('movement uses the earliest rank this calendar year minus today', () => {
    expect(amateurYearMove([{ week: 202552, rank: 900 }, { week: 202610, rank: 430 }, { week: 202603, rank: 450 }], 412, 2026)).toBe(38);
    expect(amateurYearMove([{ week: 202552, rank: 900 }], 412, 2026)).toBeNull();
  });
  it('button copy uses a first name, or their', () => {
    expect(badgeProfileButton('Jay Kelly')).toBe("Open Jay's profile");
    expect(badgeProfileButton('')).toBe('Open their profile');
  });
});

describe('member badge interaction', () => {
  it('a badge inside a tile opens the card without firing the tile', () => {
    const tile = vi.fn();
    mount(<div role="link" tabIndex={0} onClick={tile} onKeyDown={tile}><span>Jay Kelly</span><ProLabel userId="jay" name="Jay Kelly" /></div>);
    fireEvent.click(screen.getByRole('button', { name: 'PRO, what this means' }));
    expect(card()).not.toBeNull();
    expect(tile).not.toHaveBeenCalled();
  });
  it.each(['Enter', ' '])('%j opens the card', (key) => {
    const tile = vi.fn();
    mount(<div onKeyDown={tile}><ProLabel userId="jay" name="Jay Kelly" /></div>);
    fireEvent.keyDown(screen.getByRole('button', { name: 'PRO, what this means' }), { key });
    expect(card()).not.toBeNull();
    expect(tile).not.toHaveBeenCalled();
  });
  it('the badge is a span role=button, never a <button>, and shows the ring while open', () => {
    mount(<ProLabel userId="jay" name="Jay Kelly" />);
    const badge = screen.getByRole('button', { name: 'PRO, what this means' });
    expect(badge.tagName).toBe('SPAN');
    expect(badge.getAttribute('tabindex')).toBe('0');
    fireEvent.click(badge);
    expect(badge).toHaveAttribute('data-open');
    const css = readFileSync('src/features/member-badge/member-badge.css', 'utf8');
    expect(css).toMatch(/\.pro-label\[data-open\]\s*\{\s*box-shadow:0 0 0 3px rgba\(255,255,255,0\.18\);/);
  });
  it('the hit area is at least 44 × 44px via a centred ::after', () => {
    const css = readFileSync('src/features/member-badge/member-badge.css', 'utf8');
    const after = css.match(/\.pro-label\[data-tappable\]::after\s*\{[^}]*\}/)?.[0] ?? '';
    for (const d of ['position:absolute', 'width:max(100%, 44px)', 'height:max(100%, 44px)', 'translate(-50%, -50%)']) expect(after).toContain(d);
  });
  it('without a member id (account island, settings) the badge is static', () => {
    mount(<ProLabel size="large" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
  it('the profile button is hidden on the member\'s own profile and opens it elsewhere', () => {
    const view = mount(<ProLabel userId="jay" name="Jay Kelly" />, '/profile/jay');
    fireEvent.click(screen.getByRole('button', { name: 'PRO, what this means' }));
    expect(card()?.querySelector('[data-mbc-profile]')).toBeNull();
    view.unmount();
    mount(<ProLabel userId="jay" name="Jay Kelly" hideProfileButton />);
    fireEvent.click(screen.getByRole('button', { name: 'PRO, what this means' }));
    expect(card()?.querySelector('[data-mbc-profile]')).toBeNull();
    cleanup();
    mount(<ProLabel userId="jay" name="Jay Kelly" />);
    fireEvent.click(screen.getByRole('button', { name: 'PRO, what this means' }));
    const cta = card()?.querySelector('[data-mbc-profile]') as HTMLElement;
    expect(cta.textContent).toBe("Open Jay's profile ›");
    fireEvent.click(cta);
    expect(h.track).toHaveBeenCalledWith('member_badge_profile_opened', expect.objectContaining({ kind: 'teaching_pro' }));
  });
  it('anchored placement sits 10px below, or flips above when it would cross the nav', () => {
    expect(anchoredGlancePosition({ top: 100, bottom: 112 }, 300, 800, 716)).toEqual({ top: 122 });
    expect(anchoredGlancePosition({ top: 600, bottom: 612 }, 300, 800, 716)).toEqual({ bottom: 210 });
  });
});

describe('BRIEF_BADGE_TAP_ISOLATION', () => {
  const touchSequence = (el: Element) => {
    fireEvent.pointerDown(el); fireEvent.touchStart(el); fireEvent.mouseDown(el);
    fireEvent.pointerUp(el); fireEvent.touchEnd(el); fireEvent.mouseUp(el); fireEvent.click(el);
  };
  const backdrop = () => document.querySelector('[data-testid="index-glance-backdrop"]') as HTMLElement;
  const tiles = {
    click: (fn: () => void) => <button type="button" data-tile onClick={fn}><span>Jay Kelly</span><ProLabel userId="jay" name="Jay Kelly" /></button>,
    pointerup: (fn: () => void) => <div role="button" tabIndex={0} data-tile onPointerUp={fn} onTouchEnd={fn}><span>Jay Kelly</span><ProLabel userId="jay" name="Jay Kelly" /></div>,
  };
  it.each(Object.keys(tiles) as Array<keyof typeof tiles>)('a %s tile: the full touch sequence on the badge opens the card only', (kind) => {
    const open = vi.fn();
    mount(tiles[kind](open));
    touchSequence(screen.getByRole('button', { name: 'PRO, what this means' }));
    expect(card()).not.toBeNull();
    expect(open).not.toHaveBeenCalled();
  });
  it.each(Object.keys(tiles) as Array<keyof typeof tiles>)('a %s tile: the full sequence on the backdrop closes the card only', (kind) => {
    const open = vi.fn();
    mount(tiles[kind](open));
    fireEvent.click(screen.getByRole('button', { name: 'PRO, what this means' }));
    const layer = backdrop();
    touchSequence(layer);
    expect(card()).toBeNull();
    expect(open).not.toHaveBeenCalled();
  });
  it('the backdrop closes on click, not on pointerdown or touchstart', () => {
    mount(tiles.click(vi.fn()));
    fireEvent.click(screen.getByRole('button', { name: 'PRO, what this means' }));
    fireEvent.pointerDown(backdrop()); fireEvent.touchStart(backdrop());
    expect(card()).not.toBeNull();
    fireEvent.click(backdrop());
    expect(card()).toBeNull();
  });
  it('Escape closes the card, fires nothing beneath and returns focus without scrolling', () => {
    const open = vi.fn();
    mount(<div onKeyDown={open} onClick={open}><ProLabel userId="jay" name="Jay Kelly" /></div>);
    const badge = screen.getByRole('button', { name: 'PRO, what this means' });
    fireEvent.click(badge);
    const focus = vi.spyOn(badge, 'focus');
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(card()).toBeNull();
    expect(open).not.toHaveBeenCalled();
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(h.track).toHaveBeenCalledTimes(1);
  });
});
