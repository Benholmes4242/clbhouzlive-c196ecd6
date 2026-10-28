import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { readFileSync } from 'node:fs';

const s = vi.hoisted(() => ({ session: null as unknown }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? k }) }));
vi.mock('@/hooks/useBottomNavVisibility', () => ({ useHideBottomNav: vi.fn() }));
vi.mock('@/hooks/useHeaderVisibility', () => ({ useHideHeader: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { getSession: async () => ({ data: { session: s.session } }) }, from: () => { const c = { select: () => c, eq: () => c, maybeSingle: async () => ({ data: null }) }; return c; } } }));
import AuthCallback from '@/pages/auth/AuthCallback';

afterEach(() => { cleanup(); vi.useRealTimers(); delete (window as unknown as { median?: unknown }).median; });
const mount = () => { (window as unknown as { median: unknown }).median = {}; return render(<MemoryRouter><AuthCallback /></MemoryRouter>); };

describe('OB1.3 plain holding screen', () => {
  it('processing renders a plain canvas with no card, spinner or logo and a visually hidden live region', () => {
    mount();
    const hold = document.querySelector<HTMLElement>('[data-auth-callback-processing]')!;
    expect(hold).not.toBeNull();
    expect(hold.getAttribute('style')).toContain('var(--welcome-canvas)');
    expect(document.querySelector('img')).toBeNull();
    expect(document.querySelector('.animate-spin')).toBeNull();
    expect(document.querySelector('.rounded-3xl')).toBeNull();
    const live = screen.getByRole('status');
    expect(live).toHaveAttribute('aria-live', 'polite');
    expect(live).toHaveClass('sr-only');
    expect(live.textContent).not.toBe('');
  });
  it('error state keeps its card, spinner and visible message', async () => {
    vi.useFakeTimers(); s.session = null; mount();
    await act(async () => { await vi.advanceTimersByTimeAsync(200); });
    expect(document.querySelector('[data-auth-callback-processing]')).toBeNull();
    expect(document.querySelector('.rounded-3xl')).not.toBeNull();
    expect(document.querySelector('.animate-spin')).not.toBeNull();
    const msg = document.querySelector('p[aria-live="polite"]')!;
    expect(msg).not.toHaveClass('sr-only');
    expect(msg.textContent).toBe('callback.sessionNotFound');
  });
  it('signed-in code-entry hold on /auth is the same plain welcome canvas', () => {
    expect(readFileSync('src/pages/Auth.tsx', 'utf8')).toContain("style={{ position: 'fixed', inset: 0, background: 'var(--welcome-canvas)', zIndex: 50 }}");
  });
});
