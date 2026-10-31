import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import handicap from '../../public/locales/en/handicap.json';
const f = vi.hoisted(() => ({ counts: null as { rounds: number; courses: number; friends: number } | null, fetching: false, continue: vi.fn() }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'member' } }) }));
vi.mock('@/components/profile/handicap/whs/connect/useImportedCounts', () => ({ useImportedCounts: () => ({ data: f.counts, isFetching: f.fetching }) }));
vi.mock('@/lib/whs/hooks', () => ({ useHandicapHistory: () => ({ data: [], isFetching: false }), useScoringBreakdownAllCourses: () => ({ data: null }), useNemesisHoles: () => ({ data: [] }) }));
import WelcomeAboardScreen from '@/components/profile/handicap/whs/connect/WelcomeAboardScreen';
const i18n = createInstance();
void i18n.init({ lng: 'en', resources: { en: { handicap } }, interpolation: { escapeValue: false } });
function mount(index: number | null) { return render(<QueryClientProvider client={new QueryClient()}><I18nextProvider i18n={i18n}><WelcomeAboardScreen firstName="Member" homeClub={null} handicapIndex={index} connectionId="c" onContinue={f.continue} /></I18nextProvider></QueryClientProvider>); }
beforeEach(() => { f.counts = { rounds: 0, courses: 0, friends: 0 }; f.fetching = false; f.continue.mockClear(); });
describe('confirmed empty done record', () => {
  it('zero rounds and no index hide every data block and retain completion CTA', () => { const r = mount(null); expect(r.container.querySelector('[data-done-index]')).toBeNull(); expect(r.container.querySelectorAll('svg')).toHaveLength(0); expect(screen.getAllByRole('button')).toHaveLength(1); fireEvent.click(screen.getByRole('button')); expect(f.continue).toHaveBeenCalledTimes(1); });
  it('zero rounds with an index keep only the index block', () => { const r = mount(0); expect(r.container.querySelectorAll('[data-done-index]')).toHaveLength(1); expect(r.container.querySelectorAll('svg')).toHaveLength(0); expect(screen.getAllByRole('button')).toHaveLength(1); });
  it('rounds present retain the index and landing-breakdown section', () => { f.counts = { rounds: 24, courses: 3, friends: 0 }; const r = mount(12.4); expect(r.container.querySelector('[data-done-index]')).not.toBeNull(); expect(r.container.querySelector('[data-done-index]')?.nextElementSibling).not.toBeNull(); });
  it('unresolved counts are not interpreted as a confirmed empty record', () => { f.counts = null; f.fetching = true; const r = mount(null); expect(r.container.querySelector('[data-done-index]')).not.toBeNull(); });
});