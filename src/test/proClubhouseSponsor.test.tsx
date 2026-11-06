import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProProfileBuildOne, type ProProfileProps } from '@/features/pro-profile/ProProfileBuildOne';
import { ProClubhouseSection } from '@/features/pro-profile/ProClubhouseSection';
import { ProOnlyYouSection } from '@/features/pro-profile/ProOnlyYouSection';
import { ProSponsorSheet, type SponsorIdentity, type SponsorSeason } from '@/features/pro-profile/ProSponsorSheet';
import { bagLine, clubhouseCopy, parseProClubhouse, parseProReach, sponsorSourceLine, trackingFromLine } from '@/features/pro-profile/proClubhouseRules';
import type { ProEvent } from '@/features/pro-profile/proProfileRules';
import type { BagItem, Partner, CareerMoment } from '@/features/pro-profile/proCollectionRules';

const s = vi.hoisted(() => ({
  clubhouse: null as any,
  clubhouseReady: true,
  reach: null as any,
  reachReady: true,
  events: [] as any[],
  eventsReady: true,
  rank: null as any,
  rankReady: true,
  bag: [] as any[],
  bagReady: true,
  partners: [] as any[],
  partnersReady: true,
  career: [] as any[],
  careerReady: true,
  guest: false,
  track: vi.fn(async () => {}),
  qr: vi.fn(async (text: string) => `data:image/png;base64,qr(${text})`),
  canvas: vi.fn(async (_el?: unknown, _opts?: unknown) => ({ toBlob: (cb: (b: Blob | null) => void) => cb(new Blob(['png'], { type: 'image/png' })) })),
}));

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/features/pro-profile/useProClubhouse', () => ({
  useProClubhouse: () => ({ data: s.clubhouse, isSuccess: s.clubhouseReady, isError: false }),
  useProReach: () => ({ data: s.reach, isSuccess: s.reachReady, isError: false }),
}));
vi.mock('@/features/pro-profile/useProProfile', () => ({
  useProEvents: () => ({ data: s.events, isSuccess: s.eventsReady, isError: false }),
  useProWorldRank: () => ({ data: s.rank, isSuccess: s.rankReady, isError: false }),
  useProWatch: () => ({ data: { watching: false, count: 0 }, isSuccess: true, isError: false }),
}));
vi.mock('@/features/pro-profile/useProCollections', () => ({
  useProBag: () => ({ data: s.bag, isSuccess: s.bagReady, isError: false }),
  useProPartners: () => ({ data: s.partners, isSuccess: s.partnersReady, isError: false }),
  useProCareer: () => ({ data: s.career, isSuccess: s.careerReady, isError: false }),
  useProBusinesses: () => ({ data: [], isSuccess: true, isError: false }),
  useProBusinessSearch: () => ({ data: [], isSuccess: true, isError: false }),
  useCollectionWrite: () => async () => true,
}));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: s.track, trackOnHide: vi.fn() } }));
vi.mock('qrcode', () => ({ default: { toDataURL: s.qr } }));
vi.mock('html2canvas', () => ({ default: s.canvas }));
vi.mock('@/components/profile/hooks/useProfileClubs', () => ({ useProfileClubs: () => ({ homeClub: { name: 'Dartford Golf Club' } }) }));
vi.mock('@/hooks/useUserTopTenCourses', () => ({ useUserTopTenCourses: () => ({ topTen: [] }) }));
vi.mock('@/features/tourhub/player-v2/data/usePlayerData', () => ({ usePlayerSeasonResults: () => ({ data: [], isSuccess: true, isError: false }) }));
vi.mock('@/features/pro-profile/LinkedProSections', () => ({
  useLinkedProLive: () => ({ data: null, isSuccess: true, isError: false }),
  useLinkedProStats: () => ({ data: { player: null, rows: [] }, isSuccess: true, isError: false }),
  LinkedLiveCard: () => <div data-testid="linked-live" />,
  HowProPlays: () => <div data-testid="linked-stats" />,
}));
vi.mock('@/features/guest/useGuestActionGate', () => ({ useGuestActionGate: () => () => s.guest }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => ({ insert: vi.fn(async () => ({ error: null })) }), rpc: vi.fn(async () => ({ data: true, error: null })) } }));

const face = (id: string, name: string) => ({ id, name, username: id, avatar: null });
const clubhouse = (over: Partial<Record<string, unknown>> = {}) => ({
  followers: 3, club: 'Dartford Golf Club', club_followers: 2, watchers: 12, mutual_count: 0,
  mutuals: [], recent: [face('ra', 'Rae Adler'), face('jb', 'Joss Blue'), face('pk', 'Paz Kahn')], ...over,
});
const reach = (over: Partial<Record<string, unknown>> = {}) => ({ views_30: 1240, new_followers_30: 3, questions_30: 9, tracking_since: '2025-01-01', ...over });
const bagItem = (slot: string, brand: string, sort = 0): BagItem => ({ id: `${brand}-${slot}`, user_id: 'pro', slot, brand, model: null, detail: null, business_id: null, sort, created_at: '2026-01-01', updated_at: '2026-01-01' } as BagItem);
const partner = (name: string, sort = 0): Partner => ({ id: name, user_id: 'pro', name, business_id: null, sort, created_at: '2026-01-01', updated_at: '2026-01-01' } as Partner);
const moment = (text: string, year: number, is_win = false): CareerMoment => ({ id: text, user_id: 'pro', year, text, is_win, created_at: '2026-01-01', updated_at: '2026-01-01' } as CareerMoment);
const owgrEvent = (id: string, name: string, finish: string, over: Partial<ProEvent> = {}): ProEvent => ({
  id, user_id: 'pro', source: 'owgr', event_name: name, tour_name: 'Alps Tour', start_date: '2026-10-01', end_date: '2026-10-04',
  country: 'France', venue: null, finish, to_par: null, total_strokes: 219, scheduled_rounds: 3, tee_time: null, tee_hole: null,
  owgr_event_id: '1', owgr_points: null, owgr_rank_before: null, owgr_rank_after: null, owgr_year: 2026, owgr_week: 40,
  created_at: '', updated_at: '', rounds: [], ...over,
});

const identity: SponsorIdentity = { name: 'Mason Essam', first: 'Mason', last: 'Essam', username: 'masonessam', avatar: null, cover: null, tour: 'Alps Tour', homeClub: 'Dartford Golf Club' };
const season: SponsorSeason = {
  year: 2026, events: 20, cuts: 15, top10s: 5, best: '2', scoring: '70.0',
  results: [
    owgrEvent('e1', 'Hulencourt Alps Tour Grand Final', 'T31'),
    owgrEvent('e2', 'Memorial Giorgio Bordoni', 'MC'),
    owgrEvent('e3', 'Hauts de France-Pas de Calais Open', 'MC'),
    owgrEvent('e4', 'Longwy Alps Open', 'T26'),
    owgrEvent('e5', 'Open de Roissy PGA France', '2'),
  ],
};

const mount = (node: React.ReactNode) => render(
  <MemoryRouter><QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{node}</QueryClientProvider></MemoryRouter>,
);

beforeEach(() => {
  s.clubhouse = clubhouse(); s.clubhouseReady = true;
  s.reach = reach(); s.reachReady = true;
  s.events = []; s.eventsReady = true;
  s.rank = null; s.rankReady = true;
  s.bag = []; s.bagReady = true;
  s.partners = []; s.partnersReady = true;
  s.career = []; s.careerReady = true;
  s.guest = false;
  s.track.mockClear(); s.qr.mockClear(); s.canvas.mockClear();
  localStorage.clear();
  // jsdom lacks object URLs; the sheet's CORS photo pipeline and download use them.
  (URL as any).createObjectURL = vi.fn(() => 'blob:mock');
  (URL as any).revokeObjectURL = vi.fn();
});
afterEach(cleanup);

describe('view tracking', () => {
  const props: ProProfileProps = {
    pro: { user_id: 'pro', pro_kind: 'tour_pro', pro_tour: 'Alps Tour', pro_tour_code: 'alps', pro_club: null, pro_player_id: null },
    name: 'Mason Essam', owner: false, viewerId: 'viewer', username: 'masonessam', followers: 3, followersReady: true,
    onFollowers: vi.fn(), onAvatar: vi.fn(), onEdit: vi.fn(), onShare: vi.fn(), onFollow: vi.fn(), following: false,
    followBusy: false, onMessage: vi.fn(), messageBusy: false, menu: <span>Menu</span>,
  };
  it('fires once per mount for a visitor, with a null source', () => {
    const view = mount(<ProProfileBuildOne {...props} />);
    expect(s.track).toHaveBeenCalledTimes(1);
    expect(s.track).toHaveBeenCalledWith('pro_profile_viewed', { pro_id: 'pro', source: null });
    view.rerender(<MemoryRouter><QueryClientProvider client={new QueryClient()}><ProProfileBuildOne {...props} /></QueryClientProvider></MemoryRouter>);
    expect(s.track).toHaveBeenCalledTimes(1);
  });
  it('fires for a guest viewer too', () => {
    s.guest = true;
    mount(<ProProfileBuildOne {...props} viewerId={undefined} />);
    expect(s.track).toHaveBeenCalledWith('pro_profile_viewed', { pro_id: 'pro', source: null });
  });
  it('never fires for the owner', () => {
    mount(<ProProfileBuildOne {...props} owner viewerId="pro" />);
    expect(s.track).not.toHaveBeenCalled();
  });
});

describe('clubhouse copy rules', () => {
  it('mutual_count 3+ names the first and counts the rest', () => {
    const copy = clubhouseCopy(clubhouse({ mutual_count: 4, mutuals: [face('sa', 'Sam Carter'), face('jk', 'Jess King'), face('ps', 'Pat Shore')] }) as any, false, 'Mason');
    expect(copy.bold).toBe('Sam and 3 others you follow');
    expect(copy.plain).toBe(' follow Mason. 2 of his followers are from Dartford Golf Club.');
  });
  it('mutual_count 2 names both', () => {
    const copy = clubhouseCopy(clubhouse({ mutual_count: 2, mutuals: [face('sa', 'Sam Carter'), face('jk', 'Jess King')] }) as any, false, 'Mason');
    expect(copy.bold).toBe('Sam and Jess');
    expect(copy.plain).toContain(', who you follow, follow Mason.');
  });
  it('mutual_count 1 uses the singular verb', () => {
    const copy = clubhouseCopy(clubhouse({ mutual_count: 1, mutuals: [face('sa', 'Sam Carter')] }) as any, false, 'Mason');
    expect(copy.bold).toBe('Sam');
    expect(copy.plain).toContain(', who you follow, follows Mason.');
  });
  it('mutual_count 0 falls back to the follower count, singular and plural', () => {
    expect(clubhouseCopy(clubhouse({ followers: 41 }) as any, false, 'Mason').bold).toBe('41 members follow Mason');
    expect(clubhouseCopy(clubhouse({ followers: 1 }) as any, false, 'Mason').bold).toBe('1 member follows Mason');
  });
  it('the club sentence singularises and disappears at zero', () => {
    expect(clubhouseCopy(clubhouse({ club_followers: 1 }) as any, false, 'Mason').plain).toContain(' 1 of his followers is from Dartford Golf Club.');
    expect(clubhouseCopy(clubhouse({ club_followers: 0 }) as any, false, 'Mason').plain).not.toContain('Dartford');
  });
  it('own copy joins club and watchers parts, with singulars', () => {
    const copy = clubhouseCopy(clubhouse() as any, true, 'Mason');
    expect(copy.bold).toBe('3 members follow you');
    expect(copy.plain).toBe(', 2 of them from Dartford Golf Club. 12 members get your scores each day.');
    const one = clubhouseCopy(clubhouse({ followers: 1, club_followers: 0, watchers: 1 }) as any, true, 'Mason');
    expect(one.bold).toBe('1 member follows you');
    expect(one.plain).toBe('. 1 member gets your scores each day.');
  });
  it('own zero-followers line invites the share', () => {
    const copy = clubhouseCopy(clubhouse({ followers: 0 }) as any, true, 'Mason');
    expect(copy.bold).toBe('No followers yet.');
    expect(copy.plain).toBe(" Share your profile and they'll show here.");
  });
});

describe('clubhouse section', () => {
  it('visitor faces come from mutuals, falling back to recent', () => {
    const { unmount } = mount(<ProClubhouseSection userId="pro" owner={false} first="Mason" />);
    expect(screen.getByRole('button', { name: 'Rae Adler' })).toBeInTheDocument();
    unmount();
    s.clubhouse = clubhouse({ mutual_count: 1, mutuals: [face('sa', 'Sam Carter')] });
    mount(<ProClubhouseSection userId="pro" owner={false} first="Mason" />);
    expect(screen.getByRole('button', { name: 'Sam Carter' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Rae Adler' })).toBeNull();
  });
  it('own view always shows recent faces', () => {
    s.clubhouse = clubhouse({ mutual_count: 1, mutuals: [face('sa', 'Sam Carter')] });
    mount(<ProClubhouseSection userId="pro" owner first="Mason" />);
    expect(screen.getByRole('button', { name: 'Rae Adler' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sam Carter' })).toBeNull();
  });
  it('is hidden from visitors at 0 followers but shows the owner line', () => {
    s.clubhouse = clubhouse({ followers: 0 });
    const { unmount } = mount(<ProClubhouseSection userId="pro" owner={false} first="Mason" />);
    expect(screen.queryByText('IN THE CLUBHOUSE')).toBeNull();
    unmount();
    mount(<ProClubhouseSection userId="pro" owner first="Mason" />);
    expect(screen.getByText('No followers yet.')).toBeInTheDocument();
  });
  it('tapping a face opens that member profile', () => {
    const Probe = () => { const l = useLocation(); return <span data-testid="loc">{l.pathname}</span>; };
    render(<MemoryRouter><QueryClientProvider client={new QueryClient()}><ProClubhouseSection userId="pro" owner={false} first="Mason" /><Probe /></QueryClientProvider></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Rae Adler' }));
    expect(screen.getByTestId('loc')).toHaveTextContent('/profile/ra');
  });
  it('nothing renders until the read settles or after a null payload', () => {
    s.clubhouseReady = false;
    const { unmount } = mount(<ProClubhouseSection userId="pro" owner={false} first="Mason" />);
    expect(screen.queryByText('IN THE CLUBHOUSE')).toBeNull();
    unmount();
    s.clubhouseReady = true; s.clubhouse = null;
    mount(<ProClubhouseSection userId="pro" owner={false} first="Mason" />);
    expect(screen.queryByText('IN THE CLUBHOUSE')).toBeNull();
  });
});

describe('only you see this', () => {
  const section = (owner: boolean) => <ProOnlyYouSection userId="pro" owner={owner} identity={identity} season={season} followers={3} />;
  it('is owner-only', () => {
    mount(section(false));
    expect(screen.queryByText('ONLY YOU SEE THIS')).toBeNull();
  });
  it('shows the amber header and the three tiles with the green +n rule', () => {
    mount(section(true));
    const heading = screen.getByText('ONLY YOU SEE THIS');
    expect(heading).toHaveClass('pro-only-you');
    expect(screen.getByText('1,240')).toBeInTheDocument();
    expect(screen.getByText('+3')).toHaveClass('pro-kit-gain');
    expect(screen.getByText('9')).toBeInTheDocument();
  });
  it('zero new followers reads 0 without the green', () => {
    s.reach = reach({ new_followers_30: 0 });
    mount(section(true));
    const tile = screen.getByText('FOLLOWERS').parentElement!;
    expect(within(tile).getByText('0')).not.toHaveClass('pro-kit-gain');
  });
  it('adds the counted-from line while tracking is younger than 30 days', () => {
    s.reach = reach({ tracking_since: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) });
    mount(section(true));
    expect(screen.getByText(/Views are counted from /)).toBeInTheDocument();
  });
  it('the button opens the sponsor sheet', () => {
    mount(section(true));
    fireEvent.click(screen.getByRole('button', { name: 'Make my sponsor sheet' }));
    expect(screen.getByText('Your sponsor sheet')).toBeInTheDocument();
  });
  it('a failed reach read renders nothing', () => {
    s.reachReady = false;
    mount(section(true));
    expect(screen.queryByText('ONLY YOU SEE THIS')).toBeNull();
  });
});

describe('sponsor sheet', () => {
  const sheet = (over: Partial<Parameters<typeof ProSponsorSheet>[0]> = {}) => (
    <ProSponsorSheet open onClose={vi.fn()} proId="pro" identity={identity} season={season} followers={3} {...over} />
  );
  const dialog = () => screen.getByRole('dialog');
  // The card renders twice: the scaled preview and the off-screen capture
  // node. Block assertions scope to the preview.
  const preview = () => within(dialog().querySelector('.pro-ss-fit') as HTMLElement);

  it('every chip toggles its block straight away', () => {
    mount(sheet());
    const dlg = dialog();
    expect(preview().getByText('2026 SEASON')).toBeInTheDocument();
    fireEvent.click(within(dlg).getByRole('checkbox', { name: 'Season' }));
    expect(preview().queryByText('2026 SEASON')).toBeNull();
    fireEvent.click(within(dlg).getByRole('checkbox', { name: 'Season' }));
    expect(preview().getByText('2026 SEASON')).toBeInTheDocument();
  });
  it('chips for empty blocks are left out', () => {
    mount(sheet());
    const dlg = dialog();
    expect(within(dlg).queryByRole('checkbox', { name: 'Partners' })).toBeNull();
    expect(within(dlg).queryByRole('checkbox', { name: 'In the bag' })).toBeNull();
    expect(within(dlg).getByRole('checkbox', { name: 'Season' })).toBeInTheDocument();
  });
  it('the stored choice is restored', () => {
    localStorage.setItem('pro-sponsor-sheet-blocks', JSON.stringify({ season: false }));
    mount(sheet());
    const dlg = dialog();
    expect(within(dlg).getByRole('checkbox', { name: 'Season' })).toHaveAttribute('aria-checked', 'false');
    expect(preview().queryByText('2026 SEASON')).toBeNull();
    expect(within(dlg).getByRole('checkbox', { name: 'Results' })).toHaveAttribute('aria-checked', 'true');
  });
  it('rank, movement and career best render with the muted-worse rule', () => {
    s.rank = { rank: 1436, ranking_date: '2026-11-02', prior_rank: 1440, season_start_rank: 1879, best_rank: 1354, source: 'owgr' };
    mount(sheet());
    const dlg = dialog();
    expect(within(dlg).getAllByText('#1,436').length).toBeGreaterThan(0);
    expect(within(dlg).getAllByText('▲ 443')[0]).toHaveClass('pro-ss-up');
    expect(within(dlg).getAllByText('Career best #1,354').length).toBeGreaterThan(0);
  });
  it('worse movement is muted, never red', () => {
    s.rank = { rank: 1900, ranking_date: '2026-11-02', prior_rank: 1440, season_start_rank: 1879, best_rank: 1354, source: 'owgr' };
    mount(sheet());
    const em = within(dialog()).getAllByText(/▼ 21 this season/)[0];
    expect(em).toHaveClass('pro-ss-mute');
  });
  it('no rank falls back to best finish; no rank and no events omits the rank row', () => {
    mount(sheet());
    expect(preview().getByText('BEST FINISH 2026')).toBeInTheDocument();
    cleanup();
    mount(sheet({ season: { ...season, best: null, events: 0, results: [] } }));
    const dlg = preview();
    expect(dlg.queryByText('WORLD RANKING')).toBeNull();
    expect(dlg.queryByText(/BEST FINISH/)).toBeNull();
  });
  it('the season tiles match the Season section figures', () => {
    mount(sheet());
    const dlg = dialog().querySelector('.pro-ss-fit') as HTMLElement;
    const stats = dlg.querySelectorAll('.pro-ss-stats > div');
    const text = [...stats].map((d) => d.textContent);
    expect(text).toEqual(['20EVENTS', '15CUTS', '5TOP 10S', '2ndBEST', '70.0SCORING']);
  });
  it('latest results shows four with dimmed MC and the career first four with gold for wins', () => {
    s.career = [moment('Career-high world ranking, #1,354', 2026), moment('2nd, Open de Roissy PGA France', 2026), moment('2nd, Alps Andalucia-Roquetas de Mar', 2026), moment('Kent Amateur champion', 2022, true), moment('Turned professional', 2021)];
    mount(sheet());
    const dlg = dialog().querySelector('.pro-ss-fit') as HTMLElement;
    const res = dlg.querySelector('.pro-ss-res')!;
    expect(res.querySelectorAll(':scope > div:not(.pro-ss-h)')).toHaveLength(4);
    expect(within(res as HTMLElement).getByText('Hulencourt Alps Tour Grand Final')).toBeInTheDocument();
    expect(within(res as HTMLElement).queryByText('Open de Roissy PGA France')).toBeNull();
    const car = dlg.querySelector('.pro-ss-car')!;
    expect(car.querySelectorAll(':scope > div:not(.pro-ss-h)')).toHaveLength(4);
    expect(within(car as HTMLElement).getByText('Kent Amateur champion').closest('div')).toHaveClass('pro-ss-win');
    expect(within(car as HTMLElement).queryByText('Turned professional')).toBeNull();
  });
  it('the bag groups by brand in bag order and partners join with middots', () => {
    s.bag = [bagItem('driver', 'Fairway Labs'), bagItem('fairway', 'Fairway Labs'), bagItem('irons', 'Ridgeback'), bagItem('wedges', 'Ridgeback'), bagItem('putter', 'Halden'), bagItem('ball', 'Linkball')];
    s.partners = [partner('Fairway Labs'), partner('Dartford Golf Club', 1), partner('Kent Autos', 2)];
    mount(sheet());
    const dlg = dialog();
    expect(within(dlg).getAllByText('Fairway Labs driver and fairway · Ridgeback irons and wedges · Halden putter · Linkball ball').length).toBeGreaterThan(0);
    expect(within(dlg).getAllByText('Fairway Labs · Dartford Golf Club · Kent Autos').length).toBeGreaterThan(0);
  });
  it('the QR encodes the profile URL', async () => {
    mount(sheet());
    await waitFor(() => expect(s.qr).toHaveBeenCalledWith('https://clbhouz.co.uk/profile/masonessam', expect.objectContaining({ margin: 2 })));
  });
  it('the source line credits the ranking when present, otherwise the made-on line', () => {
    s.rank = { rank: 1436, ranking_date: '2026-11-02', prior_rank: null, season_start_rank: null, best_rank: null, source: 'owgr' };
    const { unmount } = mount(sheet());
    expect(within(dialog()).getAllByText(/World ranking and results: Official World Golf Ranking, 2 Nov 2026\./).length).toBeGreaterThan(0);
    unmount();
    s.rank = null;
    mount(sheet());
    expect(within(dialog()).getAllByText(/Made on clbhouz, /).length).toBeGreaterThan(0);
  });
  it('save captures the 360px node at scale 3 and downloads the named file', async () => {
    const clicks: string[] = [];
    const realCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string, ...rest: any[]) => {
      const el = realCreate(tag, ...rest);
      if (tag === 'a') el.click = () => clicks.push((el as HTMLAnchorElement).download);
      return el;
    });
    mount(sheet());
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Save image' }));
    await waitFor(() => expect(clicks).toContain('mason-essam-sponsor-sheet.png'));
    const [node, opts] = s.canvas.mock.calls[0];
    expect((node as HTMLElement).querySelector('[data-sponsor-card]')).toHaveStyle({ width: '360px' });
    expect(opts).toEqual({ backgroundColor: '#0A0A0C', scale: 3, useCORS: true, logging: false });
    vi.restoreAllMocks();
  });
  it('share falls back to save when files cannot be shared', async () => {
    const clicks: string[] = [];
    const realCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string, ...rest: any[]) => {
      const el = realCreate(tag, ...rest);
      if (tag === 'a') el.click = () => clicks.push((el as HTMLAnchorElement).download);
      return el;
    });
    mount(sheet());
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Share' }));
    await waitFor(() => expect(clicks).toContain('mason-essam-sponsor-sheet.png'));
    expect(s.canvas).toHaveBeenCalled();
    vi.restoreAllMocks();
  });
  it('the fixed card is 360px and the preview scale never exceeds 1', () => {
    mount(sheet());
    const dlg = dialog();
    const card = dlg.querySelector('[data-sponsor-card]') as HTMLElement;
    expect(card.style.width).toBe('360px');
    const scaled = card.parentElement!;
    const match = /scale\(([\d.]+)\)/.exec(scaled.style.transform);
    expect(match).not.toBeNull();
    expect(Number(match![1])).toBeLessThanOrEqual(1);
  });
});

describe('pure helpers', () => {
  it('bagLine joins two slots with and, three with a comma list', () => {
    expect(bagLine([bagItem('driver', 'A'), bagItem('fairway', 'A')])).toBe('A driver and fairway');
    expect(bagLine([bagItem('driver', 'A'), bagItem('fairway', 'A'), bagItem('hybrid', 'A')])).toBe('A driver, fairway and hybrid');
    expect(bagLine([])).toBe('');
  });
  it('parsers fail closed on bad payloads', () => {
    expect(parseProClubhouse(null)).toBeNull();
    expect(parseProClubhouse({})).toBeNull();
    expect(parseProReach({})).toBeNull();
    expect(parseProReach(reach())).toMatchObject({ views_30: 1240 });
  });
  it('trackingFromLine hides at 30 days and dates a null start from today', () => {
    const today = new Date('2026-11-06T12:00:00Z');
    expect(trackingFromLine('2026-10-01', today)).toBeNull();
    expect(trackingFromLine('2026-11-01', today)).toBe('Views are counted from 1 Nov.');
    expect(trackingFromLine(null, today)).toBe('Views are counted from 6 Nov.');
  });
  it('sponsorSourceLine formats both variants', () => {
    const today = new Date('2026-11-06T12:00:00Z');
    expect(sponsorSourceLine({ rank: 1, ranking_date: '2026-11-02', prior_rank: null, season_start_rank: null, best_rank: null, source: 'owgr' }, today))
      .toBe('World ranking and results: Official World Golf Ranking, 2 Nov 2026. Everything else: clbhouz, 6 Nov 2026.');
    expect(sponsorSourceLine(null, today)).toBe('Made on clbhouz, 6 Nov 2026.');
  });
});
