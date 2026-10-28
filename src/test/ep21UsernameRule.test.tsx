/** EP2.1 — one username length rule; old links on the social lists. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const h = vi.hoisted(() => ({
  profiles: {} as Record<string, { id: string; username: string; display_name: string }>,
  previous: {} as Record<string, string>,
}));
vi.mock('@/hooks/useUserByUsername', () => ({
  useUserByUsername: (u?: string) => ({ data: u ? h.profiles[u] ?? null : null, isLoading: false, isError: false, refetch: vi.fn() }),
}));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: null, loading: false }) }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { social: { listViewed: vi.fn() } } }));
vi.mock('@/features/social-lists-v2/SocialListPage', () => ({
  default: (p: { profileUsername: string; initialTab: string }) => <div data-testid="list" data-user={p.profileUsername} data-tab={p.initialTab} />,
  ListSkeleton: () => <div data-testid="skeleton" />,
}));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { rpc: async (_n: string, a: { p_username: string }) => ({ data: h.previous[a.p_username] ?? null, error: null }) },
}));

import ProfileSocialListRoute from '@/features/social-lists-v2/ProfileSocialListRoute';
import { USERNAME_RULE_MAX, WELCOME_USERNAME_RE } from '@/features/onboarding/welcomeRules';

function Where() { const l = useLocation(); return <div data-testid="where">{`${l.pathname}${l.search}${l.hash}`}</div>; }
const mount = (url: string) => render(
  <MemoryRouter initialEntries={[url]}>
    <Routes>
      <Route path="/profile/:username/followers" element={<><ProfileSocialListRoute direction="followers" /><Where /></>} />
      <Route path="/profile/:username/following" element={<><ProfileSocialListRoute direction="following" /><Where /></>} />
    </Routes>
  </MemoryRouter>,
);

beforeEach(() => {
  h.profiles = { benholmes: { id: 'b', username: 'benholmes', display_name: 'Ben' } };
  h.previous = { benjaminholmes: 'benholmes' };
});
afterEach(cleanup);

describe('EP2.1 username length', () => {
  it('the shared rule is 20 and the pattern enforces it', () => {
    expect(USERNAME_RULE_MAX).toBe(20);
    expect(WELCOME_USERNAME_RE.test('a'.repeat(20))).toBe(true);
    expect(WELCOME_USERNAME_RE.test('a'.repeat(21))).toBe(false);
  });
  it('setup and Edit profile both cap the field with the shared constant', () => {
    const welcome = readFileSync('src/pages/Welcome.tsx', 'utf8');
    const edit = readFileSync('src/features/edit-profile/EditProfileYou.tsx', 'utf8');
    expect(welcome).toContain('value={candidate} maxLength={USERNAME_RULE_MAX}');
    expect(edit).toContain('autoComplete="username" maxLength={USERNAME_RULE_MAX}');
    expect(edit).not.toContain('USERNAME_MAX');
  });
});

describe('EP2.1 social list old links', () => {
  it.each(['followers', 'following'])('%s redirects an old name keeping direction, query and hash', async (dir) => {
    mount(`/profile/benjaminholmes/${dir}?tab=${dir}#top`);
    await waitFor(() => expect(screen.getByTestId('where').textContent).toBe(`/profile/benholmes/${dir}?tab=${dir}#top`));
    expect(screen.getByTestId('list').getAttribute('data-tab')).toBe(dir);
  });
  it('an unknown name shows the not-found state', async () => {
    mount('/profile/nobody/followers');
    await waitFor(() => expect(screen.queryByTestId('skeleton')).toBeNull());
    expect(screen.queryByTestId('list')).toBeNull();
    expect(screen.getByTestId('where').textContent).toBe('/profile/nobody/followers');
    expect(document.body.textContent).toContain('User not found.');
  });
});
