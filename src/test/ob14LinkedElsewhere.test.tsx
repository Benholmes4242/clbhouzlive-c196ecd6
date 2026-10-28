import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';

vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { getSession: async () => ({ data: { session: { access_token: 'tok' } } }) } } }));
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

import { callConnectWhs } from '@/lib/whs/api';
import { isLinkedElsewhere } from '@/components/profile/handicap/whs/WhsConnectScreen';
import EnglandGolfForm from '@/components/profile/handicap/whs/connect/EnglandGolfForm';

const RULE = 'duplicate key value violates unique constraint "whs_connections_passport_provider_unique"';
const respond = (status: number, body: unknown) => vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('OB1.4 handicap already linked to another account', () => {
  it('a 200 body with ok:false and the unique rule maps to linked_elsewhere', async () => {
    respond(200, { ok: false, error_code: 'internal_error', message: RULE });
    const data = await callConnectWhs('1', 'p');
    expect(data.ok).toBe(false);
    expect(isLinkedElsewhere((data as { error_code?: string }).error_code, (data as { message?: string }).message)).toBe(true);
  });
  it('a 500 whose body carries the message (no ok field) also maps to linked_elsewhere', async () => {
    respond(500, { error_code: 'internal_error', message: RULE });
    const data = await callConnectWhs('1', 'p');
    expect(data.ok).toBe(false);
    expect(isLinkedElsewhere((data as { error_code?: string }).error_code, (data as { message?: string }).message)).toBe(true);
  });
  it('other internal_errors stay generic', () => {
    expect(isLinkedElsewhere('internal_error', 'timeout talking to provider')).toBe(false);
    expect(isLinkedElsewhere('eg_auth_failed', RULE)).toBe(false);
  });
  it('the form shows the already-linked copy with its second line in the existing error style', () => {
    const view = render(<EnglandGolfForm {...({ onSubmit: vi.fn(), submitting: false, error: 'This handicap is already linked to another clbhouz account.', errorKind: 'linked_elsewhere' } as never)} />);
    const el = view.container.querySelector('[data-connect-error="linked_elsewhere"]');
    expect(el?.textContent).toContain('This handicap is already linked to another clbhouz account.');
    expect(el?.textContent).toContain('Sign in to that account to see it, or use a different membership number.');
  });
  it('a generic internal_error shows no second line', () => {
    const view = render(<EnglandGolfForm {...({ onSubmit: vi.fn(), submitting: false, error: 'Something went wrong on our side. Please try again in a moment.', errorKind: 'other' } as never)} />);
    expect(view.container.querySelector('[data-connect-error="other"]')?.textContent).not.toContain('Sign in to that account');
  });
});
