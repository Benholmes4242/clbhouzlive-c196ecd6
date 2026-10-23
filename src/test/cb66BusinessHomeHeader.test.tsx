import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { BusinessMembership } from '@/hooks/useMyBusinesses';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

const state = {
  businesses: [] as BusinessMembership[] | undefined,
  isLoading: false,
  error: null as unknown,
  refetch: vi.fn(),
  actor: { type: 'personal', id: 'me', name: 'Me' } as { type: string; id: string; name: string },
  verification: {} as Record<string, unknown>,
  vLoading: false,
  claim: {} as Record<string, unknown>,
};

vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'u1' }, loading: false }) }));
vi.mock('@/hooks/useMyBusinesses', () => ({
  useMyBusinesses: () => ({ data: state.businesses, isLoading: state.isLoading, error: state.error, refetch: state.refetch }),
}));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: state.actor }) }));
vi.mock('@/hooks/useBottomNavVisibility', () => ({ useHideBottomNav: () => {} }));
vi.mock('@/hooks/useBusinessVerificationRequest', async () => {
  const actual = await vi.importActual<typeof import('@/hooks/useBusinessVerificationRequest')>('@/hooks/useBusinessVerificationRequest');
  return { ...actual, useBusinessVerificationRequest: (id: string) => ({ data: state.verification[id] ?? null, isLoading: state.vLoading }) };
});
vi.mock('@/hooks/useBusinessCourseClaim', () => ({
  useBusinessCourseClaim: (id: string) => ({ data: state.claim[id] ?? null, isLoading: false }),
}));
vi.mock('@/components/business/BusinessCommandCard', () => ({
  BusinessCommandCard: ({ membership }: { membership: BusinessMembership }) => <div data-body-for={membership.business.id} />,
}));
vi.mock('@/components/business/home/BusinessWeekCard', () => ({ BusinessWeekCard: () => null })); // Header tests render the page without a QueryClient; the card has its own tests: cb67BusinessWeek.test.tsx and cb67BusinessWeekPlacement.test.tsx.
vi.mock('@/components/business/ClaimYourCourseSheet', () => ({
  ClaimYourCourseSheet: ({ open }: { open: boolean }) => (open ? <div data-claim-sheet="" /> : null),
}));
vi.mock('@/components/business/DeleteBusinessDialog', () => ({ DeleteBusinessDialog: () => <div data-delete-dialog="" /> }));
vi.mock('@/components/business/BusinessEmptyState', () => ({ BusinessEmptyState: () => <div data-empty-state="" /> }));
vi.mock('@/components/manage/ManagePageShell', () => ({
  ManagePageShell: ({ title, children }: { title: string; children: React.ReactNode }) => <div><h1>{title}</h1>{children}</div>,
}));

import MyBusinessesPage, { selectionStorageKey } from '@/pages/MyBusinessesPage';
import { usePostStudioStore } from '@/stores/usePostStudioStore';
import { shortBusinessName } from '@/components/business/home/BusinessHomeHeader';

const biz = (id: string, name: string, role: BusinessMembership['role'], extra: Partial<BusinessMembership['business']> = {}): BusinessMembership => ({
  id: `m-${id}`,
  role,
  business: {
    id, name, slug: null, category: 'Club Fitter', location: null, city: 'Leeds', region: null, country: 'England',
    logo_url: null, is_verified: false, is_deleted: false, club_id: null, ...extra,
  },
  clubCourses: [],
});

const page = () => render(<MemoryRouter><MyBusinessesPage /></MemoryRouter>);
const q = (sel: string) => document.querySelector(sel);
const qa = (sel: string) => Array.from(document.querySelectorAll(sel));

beforeEach(() => {
  cleanup();
  window.localStorage.clear();
  state.businesses = [];
  state.isLoading = false;
  state.error = null;
  state.refetch = vi.fn();
  state.actor = { type: 'personal', id: 'me', name: 'Me' };
  state.verification = {};
  state.vLoading = false;
  state.claim = {};
});

describe('CB66 role matrix', () => {
  const cases: Array<[BusinessMembership['role'], boolean, boolean, string[]]> = [
    ['owner', true, true, ['share', 'delete']],
    ['admin', true, true, ['share']],
    ['editor', true, false, []],
    ['analyst', false, false, []],
  ];
  for (const [role, post, rows, menu] of cases) {
    it(`${role}: post ${post}, status rows ${rows}, menu [${menu.join(',')}]`, async () => {
      state.businesses = [biz('b1', 'Fairway Fitting Co.', role)];
      page();
      expect(!!q('[data-cta="post"]')).toBe(post);
      expect(!!q('[data-cta="view"]')).toBe(true);
      expect(qa('[data-status-row]').length > 0).toBe(rows);
      const trigger = q('[data-header-menu]') as HTMLElement | null;
      expect(!!trigger).toBe(menu.length > 0);
      if (trigger) {
        fireEvent.keyDown(trigger, { key: 'Enter' });
        const items = (await screen.findAllByRole('menuitem')).map((el) => el.getAttribute('data-menu-item'));
        expect(items).toEqual(menu);
      }
    });
  }

  it('analyst gets View profile alone', () => {
    state.businesses = [biz('b1', 'Fairway Fitting Co.', 'analyst')];
    page();
    expect(qa('[data-cta]').map((el) => el.getAttribute('data-cta'))).toEqual(['view']);
  });
});

describe('CB66 verification row', () => {
  const cases: Array<[string, Record<string, unknown> | null, boolean, string | null, string | null]> = [
    ['none', null, false, 'Not verified yet', 'Get verified'],
    ['pending', { status: 'pending', requires_domain_check: false, domain_confirmed: false }, false, 'Verification pending', null],
    ['domain', { status: 'pending', requires_domain_check: true, domain_confirmed: false }, false, 'Verify your domain', 'Verify'],
    ['needs_more_info', { status: 'needs_more_info', requires_domain_check: false }, false, 'We need a little more', 'Respond'],
    ['rejected', { status: 'rejected', requires_domain_check: false }, false, 'Verification not approved', 'Reapply'],
    ['verified', null, true, null, null],
  ];
  for (const [kind, request, verified, title, action] of cases) {
    it(`${kind}`, () => {
      state.businesses = [biz('b1', 'Fairway Fitting Co.', 'owner', { is_verified: verified })];
      state.verification = { b1: request };
      page();
      const rows = qa('[data-status-row]');
      if (!title) { expect(rows).toHaveLength(0); expect(q('[data-verified-badge]')).not.toBeNull(); return; }
      expect(rows).toHaveLength(1);
      expect(rows[0].getAttribute('data-status-row')).toBe(kind);
      expect(rows[0].querySelector('b')?.textContent).toBe(title);
      expect(rows[0].querySelector('[data-status-action]')?.textContent ?? null).toBe(action);
      expect(q('[data-verified-badge]')).toBeNull();
    });
  }

  it('holds rows until the per-business reads settle', () => {
    state.businesses = [biz('b1', 'Fairway', 'owner')];
    state.vLoading = true;
    page();
    expect(qa('[data-status-row]')).toHaveLength(0);
    expect(q('[data-business-header]')).not.toBeNull();
  });
});

describe('CB66 course row', () => {
  const club = (extra: Partial<BusinessMembership['business']> = {}) => biz('c1', 'Hartwell Heath', 'owner', { category: 'Golf Club', is_verified: true, ...extra });

  it('claim available opens the claim sheet', () => {
    state.businesses = [club()];
    page();
    const row = q('[data-status-row="claim"]') as HTMLElement;
    expect(row.querySelector('[data-status-action]')?.textContent).toBe('Claim');
    fireEvent.click(row.querySelector('[data-status-action]') as HTMLElement);
    expect(q('[data-claim-sheet]')).not.toBeNull();
  });
  it('a rejected claim counts as available', () => {
    state.businesses = [club()];
    state.claim = { c1: { status: 'rejected' } };
    page();
    expect(q('[data-status-row="claim"]')).not.toBeNull();
  });
  for (const status of ['pending', 'needs_more_info']) {
    it(`claim ${status} shows the with-our-team row without a button`, () => {
      state.businesses = [club()];
      state.claim = { c1: { status, courseName: 'Hartwell Heath' } };
      page();
      const row = q('[data-status-row="claim_pending"]') as HTMLElement;
      expect(row.querySelector('[data-status-action]')).toBeNull();
    });
  }
  it('linked club or non-club shows no course row', () => {
    state.businesses = [club({ club_id: 'k1' }), biz('b2', 'Fitter', 'owner', { is_verified: true })];
    page();
    expect(q('[data-status-row="claim"]')).toBeNull();
  });
  it('verification row precedes the course row', () => {
    state.businesses = [club({ is_verified: false })];
    page();
    expect(qa('[data-status-row]').map((el) => el.getAttribute('data-status-row'))).toEqual(['none', 'claim']);
  });
});

describe('CB66 switcher selection', () => {
  const three = () => [biz('a', 'Alpha', 'owner'), biz('b', 'Bravo', 'owner'), biz('c', 'Charlie', 'owner')];
  const chips = () => qa('[data-chip]').map((el) => el.getAttribute('data-chip'));
  const selected = () => q('[data-chip][aria-pressed="true"]')?.getAttribute('data-chip');

  it('falls back to the first A-Z', () => {
    state.businesses = three();
    page();
    expect(selected()).toBe('a');
    expect(chips()).toEqual(['a', 'b', 'c']);
  });
  it('falls back to the active actor business', () => {
    state.businesses = three();
    state.actor = { type: 'business', id: 'c', name: 'Charlie' };
    page();
    expect(selected()).toBe('c');
    expect(chips()).toEqual(['c', 'a', 'b']);
  });
  it('persists a tap and restores it, without reshuffling on tap', () => {
    state.businesses = three();
    page();
    fireEvent.click(q('[data-chip="b"]') as HTMLElement);
    expect(selected()).toBe('b');
    expect(chips()).toEqual(['a', 'b', 'c']);
    expect(q('[data-body-for="b"]')).not.toBeNull();
    expect(window.localStorage.getItem(selectionStorageKey('u1'))).toBe('b');
    cleanup();
    state.actor = { type: 'business', id: 'c', name: 'Charlie' };
    page();
    expect(selected()).toBe('b');
    expect(chips()).toEqual(['b', 'a', 'c']);
  });
  it('ignores a stored id that is no longer a membership', () => {
    window.localStorage.setItem(selectionStorageKey('u1'), 'gone');
    state.businesses = three();
    page();
    expect(selected()).toBe('a');
  });
  it('title reads singular for one business', () => {
    state.businesses = [biz('a', 'Alpha', 'owner')];
    page();
    expect(screen.getByRole('heading').textContent).toBe('Your business');
    expect(q('[data-chip-add]')).not.toBeNull();
  });
});

describe('CB66 post and states', () => {
  it('Post opens the studio as the business actor', () => {
    const spy = vi.spyOn(usePostStudioStore.getState(), 'openPostStudio');
    state.businesses = [biz('b1', 'Fairway Fitting Co.', 'editor')];
    page();
    fireEvent.click(q('[data-cta="post"]') as HTMLElement);
    expect(spy).toHaveBeenCalledWith({ actorType: 'business', actorId: 'b1' });
    spy.mockRestore();
  });
  it('short name rule (CB66.1)', () => {
    expect(shortBusinessName('clbhouz')).toBe('clbhouz');
    expect(shortBusinessName('Hartwell Heath')).toBe('Hartwell Heath');
    expect(shortBusinessName('North Green Academy')).toBe('North Green');
    expect(shortBusinessName('Fairway Fitting Co.')).toBe('Fairway');
    expect(shortBusinessName('Sunningdale Golf Club')).toBe('Sunningdale');
    expect(shortBusinessName('The Royal & Ancient Golf Club')).toBe('The Royal');
    expect(shortBusinessName('Llanfairpwllgwyngyll Golf Club')).toBeNull();
  });
  it('button reads bare "Post" when even the first word is over 14 characters', () => {
    state.businesses = [biz('b1', 'Llanfairpwllgwyngyll Golf Club', 'owner')];
    page();
    expect((q('[data-cta="post"]') as HTMLElement).textContent).toBe('Post');
  });
  it('loading is never structurally taller than the analyst header', () => {
    state.isLoading = true;
    page();
    const sk = q('[data-business-header-skeleton]') as HTMLElement;
    expect(sk).not.toBeNull();
    // Analyst header: chip row, identity row, one 44px button, no status rows.
    expect(sk.querySelectorAll('[style*="height: 44px"]')).toHaveLength(1);
    expect(sk.querySelectorAll('[style*="height: 36px"]')).toHaveLength(2);
    expect(q('[data-status-row]')).toBeNull();
    expect(q('[data-body-for]')).toBeNull();
  });
  it('error replaces the page and retries', () => {
    state.error = new Error('x');
    page();
    expect(q('[data-business-error]')).not.toBeNull();
    expect(q('[data-business-header]')).toBeNull();
    fireEvent.click(screen.getByRole('button'));
    expect(state.refetch).toHaveBeenCalledTimes(1);
  });
  it('zero businesses renders BusinessEmptyState', () => {
    state.businesses = [];
    page();
    expect(q('[data-empty-state]')).not.toBeNull();
    expect(q('[data-switcher]')).toBeNull();
  });
});
