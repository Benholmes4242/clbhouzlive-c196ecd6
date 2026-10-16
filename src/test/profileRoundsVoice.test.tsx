import React from 'react';
import { beforeAll, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import common from '../../public/locales/en/common.json';
import profile from '../../public/locales/en/profile.json';
import ProfileRoundsTab from '@/components/profile/rounds/ProfileRoundsTab';
import type { ProfileRound } from '@/components/profile/rounds/useProfileRounds';

const year = new Date().getFullYear();
const rounds: ProfileRound[] = ['03-01', '03-08', '04-01', '05-01'].map((date, i) => ({
  whs_score_id: `s${i}`, play_date: `${year}-${date}`, course_id: 'c', course_name: 'Sundridge',
  course_par: 72, gross_score: [80, 82, 75, 85][i], hcp_at_time: null, nett_score: null, delta_index: null,
  eagles: 0, albatrosses: 0, holes_in_one: 0, clean_card: false, is_nine_hole: false, total_holes: 18,
  handicap_differential: 8, handicap_index_at_time: 10, whs_joined: true,
}));
vi.mock('@/components/profile/rounds/useProfileRounds', async (original) => ({ ...(await original<object>()), useProfileRounds: () => ({ data: rounds, isLoading: false }), useOwnHandicapVisibility: () => ({ data: 'private' }) }));
vi.mock('@/hooks/profile/useMemberRoundTotal', () => ({ useMemberRoundTotal: () => ({ total: 4 }) }));
vi.mock('@/components/profile/hooks/useProfileClubs', () => ({ useProfileClubs: () => ({ homeClub: null }) }));
vi.mock('@/components/profile/clubs/useClubsCourses', () => ({ useClubsCourses: () => ({ data: {} }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet', () => ({ RoundDetailSheet: () => null }));

const i18n = createInstance();
beforeAll(async () => { await i18n.init({ lng: 'en', resources: { en: { common, profile } }, defaultNS: 'common', interpolation: { escapeValue: false } }); });

it('Rounds names the other member, with third-person fallbacks and no viewer-addressed copy — BRIEF_PROFILE_TABS_VOICE', () => {
  const { container, rerender } = render(<I18nextProvider i18n={i18n}><ProfileRoundsTab userId="owner" isOwnProfile={false} ownerFirstName="Andrew" /></I18nextProvider>);
  let text = container.textContent ?? '';
  expect(text).toContain("Andrew's season");
  expect(text).toContain('Where Andrew plays');
  expect(text).toContain("Andrew's five most played");
  expect(text).toContain('Andrew has played Sundridge 4 times, 100% of their full rounds');
  expect(text).toContain('Andrew plays most in March and scores best in April');
  expect(text).not.toMatch(/\b(?:you|your)\b/i);
  rerender(<I18nextProvider i18n={i18n}><ProfileRoundsTab userId="owner" isOwnProfile={false} /></I18nextProvider>);
  text = container.textContent ?? '';
  expect(text).toContain('Their season');
  expect(text).toContain('Where they play');
  expect(text).toContain('Their five most played');
  expect(text).toContain('They have played Sundridge 4 times, 100% of their full rounds');
  expect(text).toContain('They play most in March and score best in April');
  expect(text).not.toMatch(/\b(?:you|your|their['’]s)\b/i);
});