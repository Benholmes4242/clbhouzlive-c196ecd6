/** GUEST STAGE 2.7 — with the switch off the Clubhouse never locks. */
import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

const s = vi.hoisted(() => ({ session: vi.fn(() => ({ user: { id: 'g', is_anonymous: true }, loading: false })) }));
vi.mock('@/features/guest/guestConfig', () => ({ GUEST_BROWSING_ENABLED: false }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: s.session }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { onAuthStateChange: vi.fn() } } }));

import { useGuestClubhouseGate } from '@/features/guest/useGuestSurfaceGate';
import { isSurfaceLocked } from '@/features/guest/guestGateStore';

describe('Stage 2.7 — switch off', () => {
  it('the switch off never locks the Clubhouse', async () => {
    const root = document.createElement('div'); root.id = 'root';
    const el = document.createElement('div'); el.setAttribute('data-card-index', '5');
    root.appendChild(el); document.body.appendChild(root);
    renderHook(() => useGuestClubhouseGate());
    await act(async () => { document.dispatchEvent(new Event('scroll')); await new Promise(r => setTimeout(r, 30)); });
    expect(isSurfaceLocked('clubhouse')).toBe(false);
  });
});
