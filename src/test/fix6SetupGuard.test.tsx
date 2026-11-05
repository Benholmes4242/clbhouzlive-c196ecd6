import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
const h = vi.hoisted(() => ({ loading: false, guest: false, done: false, error: false, thrown: false }));
vi.mock('@/hooks/useProfileData', () => ({ useProfileData: () => ({ user: { id: 'me', is_anonymous: h.guest }, profile: { has_completed_onboarding: h.done }, loading: h.loading }) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => { const c = { select: () => c, eq: () => c, maybeSingle: async () => { if (h.thrown) throw new Error('read failed'); return { data: { has_completed_onboarding: h.done }, error: h.error ? new Error('read failed') : null }; } }; return c; } } }));
import { OnboardingGuard } from '@/features/onboarding/OnboardingGuard';
import { resolvePostAuthRoute } from '@/lib/auth/postAuthRoute';
beforeEach(() => { h.loading = false; h.guest = false; h.done = false; h.error = false; h.thrown = false; });
function mount(path: string) { render(<MemoryRouter initialEntries={[path]}><Routes><Route path="/welcome" element={<output data-testid="welcome" />} /><Route path="*" element={<OnboardingGuard><output data-testid="app" /></OnboardingGuard>} /></Routes></MemoryRouter>); }
describe('FIX6 setup guard', () => {
  it.each(['/', '/courses', '/profile'])('incomplete member on %s goes to welcome', path => { mount(path); expect(screen.getByTestId('welcome')).toBeInTheDocument(); expect(screen.queryByTestId('app')).toBeNull(); });
  it.each(['loading', 'guest', 'done'] as const)('%s does not redirect', condition => { h[condition] = true; mount('/courses'); expect(screen.getByTestId('app')).toBeInTheDocument(); });
  it.each(['/auth', '/auth/callback', '/legal/help', '/privacy', '/terms', '/delete-account'])('exempts %s', path => { mount(path); expect(screen.getByTestId('app')).toBeInTheDocument(); });
  it.each(['error', 'thrown'] as const)('resolver sends %s to welcome even with redirect', async condition => { h[condition] = true; expect(await resolvePostAuthRoute('me', '/courses')).toBe('/welcome'); });
  it('completed resolver retains intended destination', async () => { h.done = true; expect(await resolvePostAuthRoute('me', '/courses')).toBe('/courses'); });
});