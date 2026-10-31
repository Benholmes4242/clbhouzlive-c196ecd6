import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, renderHook, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import type { WhsConnection, WhsHandicapTrend } from '@/lib/whs/types';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const f = vi.hoisted(() => ({ connection: null as WhsConnection | null, trend: null as WhsHandicapTrend | null, fetched: true, trendFetched: true, connect: vi.fn(), standing: vi.fn() }));
vi.mock('@/lib/whs/hooks', () => ({
  useWhsConnection: () => ({ data: f.connection, isFetched: f.fetched, isError: false }),
  useHandicapTrend: () => ({ data: f.trend, isFetched: f.trendFetched, isError: false }),
  useHandicapHistory: () => ({ data: [] }),
}));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'member' }, loading: false }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: { type: 'personal', id: 'member' } }) }));
vi.mock('@/hooks/useUserProfile', () => ({ useUserProfile: () => ({ data: { hide_handicap_chip: false }, isFetched: true, isError: false }) }));
vi.mock('@/features/chrome-v2/ConnectGlance', () => ({ ConnectGlance: () => { f.connect(); return <div role="dialog" />; } }));
vi.mock('@/features/chrome-v2/IndexGlance', () => ({ IndexGlance: () => <div role="dialog" data-testid="index-glance" /> }));
vi.mock('@/features/search-v2/SearchOverlayV2', () => ({ SearchOverlayV2: () => null }));
vi.mock('@/components/header/PostingAsMenu', () => ({ PostingAsMenu: () => null }));
vi.mock('@/features/explore-magazine/StandingShelf', () => ({ StandingShelf: () => { f.standing(); return <div data-testid="standing" />; } }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
import { useHandicapChipState } from '@/lib/whs/useHandicapChipState';
import { HcpCell } from '@/features/chrome-v2/ChromeIsland';
import { ScoresStandingSlot } from '@/features/explore-magazine/ConnectStandingInvite';
const connection: WhsConnection = { id: 'c', passport_id: 1, membership_number: '1', last_synced_at: null, last_sync_status: 'ok', last_sync_error: null, consecutive_failures: 0, initial_sync_complete: true, created_at: '2026-10-31', provider: 'england_golf' };
const trend: WhsHandicapTrend = { current: 12.4, delta: null, previousHandicap: null, totalRoundsInRecord: 0, hasHistory: false };
function Path() { const l = useLocation(); return <output data-testid="path">{l.pathname}</output>; }
function cell() { return render(<MemoryRouter><HcpCell tone="dark" dividerColor="transparent" /><Path /></MemoryRouter>); }
beforeEach(() => { f.connection = null; f.trend = null; f.fetched = f.trendFetched = true; f.connect.mockClear(); f.standing.mockClear(); });
describe('linked and indexed state', () => {
  it('no live connection is neither linked nor connected', () => { const { result } = renderHook(() => useHandicapChipState('member')); expect(result.current.linked).toBe(false); expect(result.current.connected).toBe(false); expect(result.current.settled).toBe(true); });
  it('a live connection with no index is linked but not connected', () => { f.connection = connection; const { result } = renderHook(() => useHandicapChipState('member')); expect(result.current.linked).toBe(true); expect(result.current.connected).toBe(false); });
  it('a readable index preserves connected including index zero', () => { f.connection = connection; f.trend = { ...trend, current: 0 }; const { result } = renderHook(() => useHandicapChipState('member')); expect(result.current.linked).toBe(true); expect(result.current.connected).toBe(true); });
  it('settlement still waits for the chained trend read', () => { f.connection = connection; f.trendFetched = false; const { result } = renderHook(() => useHandicapChipState('member')); expect(result.current.linked).toBe(true); expect(result.current.settled).toBe(false); });
});
describe('island destinations', () => {
  it('unlinked opens only ConnectGlance', () => { cell(); fireEvent.click(screen.getByRole('button', { name: 'Connect your handicap' })); expect(f.connect).toHaveBeenCalledTimes(1); expect(screen.getByTestId('path')).toHaveTextContent('/'); });
  it('linked without index navigates to management and never opens either glance', () => { f.connection = connection; cell(); expect(screen.queryByRole('button', { name: 'Connect your handicap' })).toBeNull(); fireEvent.click(screen.getByRole('button', { name: 'Manage your handicap' })); expect(screen.getByTestId('path')).toHaveTextContent('/manage/handicap'); expect(f.connect).not.toHaveBeenCalled(); expect(screen.queryByRole('dialog')).toBeNull(); });
  it('indexed connection retains IndexGlance without navigation', () => { f.connection = connection; f.trend = trend; cell(); fireEvent.click(screen.getByRole('button', { name: 'Handicap index 12.4' })); expect(screen.getByTestId('index-glance')).toBeInTheDocument(); expect(f.connect).not.toHaveBeenCalled(); expect(screen.getByTestId('path')).toHaveTextContent('/'); });
});
describe('standing invitation gate', () => {
  it('linked without index renders neither invitation nor unsupported standing figures', () => { f.connection = connection; const r = render(<MemoryRouter><ScoresStandingSlot viewerId="member" pos={1} /></MemoryRouter>); expect(r.container.childElementCount).toBe(0); expect(f.standing).not.toHaveBeenCalled(); });
  it('indexed connection retains the standings shelf', () => { f.connection = connection; f.trend = trend; render(<MemoryRouter><ScoresStandingSlot viewerId="member" pos={1} /></MemoryRouter>); expect(screen.getByTestId('standing')).toBeInTheDocument(); });
});