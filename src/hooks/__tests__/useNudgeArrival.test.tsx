import { describe, it, expect, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { handicapTabRoute } from '@/lib/handicap/handicapTabRoute';

const track = vi.fn();
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: (...a: unknown[]) => track(...a) } }));
import { useNudgeArrival } from '@/hooks/useNudgeArrival';

function Probe() { useNudgeArrival(); return null; }

describe('useNudgeArrival', () => {
  it('fires once with the landed path across a ?src-preserving redirect', async () => {
    render(
      <MemoryRouter initialEntries={['/handicap?src=nudge_whs']}>
        <Probe />
        <Routes>
          <Route path="/handicap" element={<Navigate to={handicapTabRoute({ src: 'nudge_whs' })} replace />} />
          <Route path="/profile" element={<div />} />
        </Routes>
      </MemoryRouter>,
    );
    await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith('onboarding_nudge_opened', { gap: 'whs', path: '/profile' });
  });
});
