/** GUEST Stage 1: with the switch off no guest hook reads the session or subscribes to auth. */
import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

const s = vi.hoisted(() => ({ session: vi.fn(() => ({ user: { id: 'g', is_anonymous: true }, loading: false })), listen: vi.fn() }));
vi.mock('@/features/guest/guestConfig', () => ({ GUEST_BROWSING_ENABLED: false }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: s.session }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { onAuthStateChange: s.listen } } }));

import { useIsGuest } from '@/features/guest/useIsGuest';
import { getGuestUser } from '@/features/guest/guestGateStore';

describe('guest switch off', () => {
  it('useIsGuest returns false without reading the session', () => {
    const { result } = renderHook(() => useIsGuest());
    expect(result.current).toBe(false);
    expect(s.session).not.toHaveBeenCalled();
  });
  it('the guest store never subscribes to auth', () => {
    expect(getGuestUser()).toBeNull();
    expect(s.listen).not.toHaveBeenCalled();
  });
});
