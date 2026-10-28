/**
 * OB1.5 — Setup: full-width handicap sign-in and the syncing screen.
 *
 * Covers:
 *   - setup sign-in: no form StageHead, 0 side padding on the Stage, the
 *     Connect button carries the welcome primary pill class;
 *   - setup connect in flight: the syncing steps replace the form,
 *     onSyncingChange fires true/false, success calls onConnected, failure
 *     returns the form with its message;
 *   - the profile flow (no setupEmbedded) is unchanged: StageHead and 24px
 *     Stage sides, in-flight connect still shows the sync stage.
 *
 * Structure is asserted, never translated words (the canonical t mock returns
 * defaultValue or '').
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

const mockApi = vi.hoisted(() => {
  const state: { deferred: { resolve: (v: unknown) => void } | null } = { deferred: null };
  return {
    state,
    callConnectWhs: vi.fn(
      () =>
        new Promise((resolve) => {
          state.deferred = { resolve };
        }),
    ),
  };
});
vi.mock('@/lib/whs/api', () => ({ callConnectWhs: mockApi.callConnectWhs }));
vi.mock('@/lib/whs/useSelectedCountry', () => ({
  useSelectedCountry: () => ({ country: null, setCountryId: () => {} }),
}));
vi.mock('@/lib/whs/hooks', () => ({
  useWhsConnection: () => ({ data: null }),
  whsKeys: { connection: (id: string) => ['whs-connection', id] },
}));
vi.mock('@/hooks/useSupabaseSession', () => ({
  useSupabaseSession: () => ({ user: { id: 'u1' }, loading: false }),
}));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: () => ({ update: () => ({ eq: () => Promise.resolve({ error: null }) }) }) },
}));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: () => {} } }));

import { WhsConnectScreen } from '@/components/profile/handicap/whs/WhsConnectScreen';

function renderConnect(props: Partial<React.ComponentProps<typeof WhsConnectScreen>> = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const onConnected = props.onConnected ?? vi.fn();
  const view = render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <WhsConnectScreen
          layout="embedded"
          initialCountryId="gb-eng"
          completeOnSuccess
          hideChrome
          onConnected={onConnected}
          {...props}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...view, onConnected };
}

function fillAndSubmit() {
  fireEvent.change(screen.getByLabelText('Membership number'), { target: { value: '1234567890' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret' } });
  fireEvent.click(screen.getByRole('button', { name: 'Connect to England Golf' }));
}

beforeEach(() => {
  mockApi.callConnectWhs.mockClear();
  mockApi.state.deferred = null;
});

afterEach(cleanup);

describe('setup sign-in (setupEmbedded)', () => {
  it('renders no form StageHead, a flush Stage and the welcome pill button', () => {
    const { container } = renderConnect({ setupEmbedded: true });
    // The host owns the one heading: the form draws no h1 at all.
    expect(container.querySelector('h1')).toBeNull();
    expect(container.textContent).not.toContain('Sign in once.');
    expect(container.textContent).not.toContain('Step 2');
    // The Stage drops its 24px sides.
    const stage = container.querySelector('form')!.firstElementChild as HTMLElement;
    expect(stage.style.paddingLeft).toBe('0px');
    expect(stage.style.paddingRight).toBe('0px');
    // The submit button is the welcome primary pill.
    const submit = screen.getByRole('button', { name: 'Connect to England Golf' });
    expect(submit).toHaveClass('welcome-primary');
    // Fields, hint and trust notes are unchanged.
    expect(screen.getByLabelText('Membership number')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(container.textContent).toContain('Why we need your password');
  });
});

describe('setup connect in flight', () => {
  it('replaces the form with the syncing steps and reports onSyncingChange', async () => {
    const onSyncingChange = vi.fn();
    const { container } = renderConnect({ setupEmbedded: true, onSyncingChange });
    fillAndSubmit();
    await screen.findByText('', { selector: '.animate-spin' });
    // The form is gone; the four-step sync list is showing.
    expect(screen.queryByLabelText('Membership number')).toBeNull();
    expect(container.querySelectorAll('.animate-spin').length).toBe(1);
    expect(onSyncingChange).toHaveBeenLastCalledWith(true);
  });

  it('failure returns the form with its message and restores the host', async () => {
    const onSyncingChange = vi.fn();
    renderConnect({ setupEmbedded: true, onSyncingChange });
    fillAndSubmit();
    await screen.findByText('', { selector: '.animate-spin' });
    await act(async () => {
      mockApi.state.deferred!.resolve({ ok: false, error_code: 'eg_auth_failed' });
    });
    // The form is back with the rejected-credential hint.
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toHaveAttribute('aria-invalid', 'true');
    expect(onSyncingChange).toHaveBeenLastCalledWith(false);
  });

  it('success calls onConnected (completeOnSuccess)', async () => {
    const onConnected = vi.fn();
    renderConnect({ setupEmbedded: true, onConnected });
    fillAndSubmit();
    await screen.findByText('', { selector: '.animate-spin' });
    await act(async () => {
      mockApi.state.deferred!.resolve({ ok: true, name: 'Ben Holmes', handicap_index: 12.4, home_club: null });
    });
    expect(onConnected).toHaveBeenCalledTimes(1);
  });
});

describe('profile flow (no setupEmbedded) is unchanged', () => {
  it('keeps the StageHead, the 24px Stage sides and the in-flight sync stage', async () => {
    const { container } = renderConnect({ completeOnSuccess: false });
    // StageHead: kicker + "Sign in once." + lead.
    const h1 = container.querySelector('h1');
    expect(h1).not.toBeNull();
    expect(h1!.textContent).toBe('Sign in once.');
    const stage = container.querySelector('form')!.firstElementChild as HTMLElement;
    expect(stage.style.paddingLeft).toBe('24px');
    // The default pill, not the welcome class.
    expect(screen.getByRole('button', { name: 'Connect to England Golf' })).not.toHaveClass('welcome-primary');
    // In flight, the sync stage shows exactly as before.
    fillAndSubmit();
    await screen.findByText('', { selector: '.animate-spin' });
    expect(screen.queryByLabelText('Membership number')).toBeNull();
    await act(async () => {
      mockApi.state.deferred!.resolve({ ok: false, error_code: 'eg_auth_failed' });
    });
  });
});
