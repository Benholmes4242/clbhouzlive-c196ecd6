import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import handicap from '../../public/locales/en/handicap.json';
import type { WhsConnection } from '@/lib/whs/types';

const f = vi.hoisted(() => ({ current: null as number | null, anyError: false }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'member' } }) }));
vi.mock('@/lib/whs/useHandicapChipState', () => ({ useHandicapChipState: () => ({ linked: true, settled: true, anyError: f.anyError, trend: { current: f.current } }) }));
vi.mock('@/lib/whs/hooks', () => ({ useLastRound: () => ({ data: null }) }));
vi.mock('@/components/profile/handicap/whs/connect/useImportedCounts', () => ({ useImportedCounts: () => ({ data: null }) }));
import ManageScreen from '@/components/profile/handicap/whs/connect/ManageScreen';

const i18n = createInstance();
void i18n.init({ lng: 'en', resources: { en: { handicap } }, interpolation: { escapeValue: false } });
const translate = vi.spyOn(i18n, 't');
const connection: WhsConnection = { id: 'c', provider: 'england_golf', passport_id: 1, membership_number: '1', last_synced_at: new Date().toISOString(), last_sync_status: 'ok', last_sync_error: null, consecutive_failures: 0, initial_sync_complete: true, created_at: new Date().toISOString() };
function mount() {
  return render(<MemoryRouter><I18nextProvider i18n={i18n}><ManageScreen connection={connection} onDisconnect={() => {}} onDelete={() => {}} /></I18nextProvider></MemoryRouter>);
}
beforeEach(() => { f.current = null; f.anyError = false; translate.mockClear(); });
describe('linked Manage empty-record explanation selection', () => {
  it('selects the official-handicap explanation with the connection provider when no index exists', () => {
    mount();
    expect(translate).toHaveBeenCalledWith('whsConnect.done.subConnectedEmpty', expect.objectContaining({ provider: 'England Golf' }));
  });
  it('retains the existing empty-record branch for a present zero index', () => {
    f.current = 0;
    mount();
    expect(translate.mock.calls.some(([key]) => key === 'whsConnect.done.subConnectedEmpty')).toBe(false);
  });
  it('does not interpret a failed index read as a confirmed missing index', () => {
    f.anyError = true;
    mount();
    expect(translate.mock.calls.some(([key]) => key === 'whsConnect.done.subConnectedEmpty')).toBe(false);
  });
});