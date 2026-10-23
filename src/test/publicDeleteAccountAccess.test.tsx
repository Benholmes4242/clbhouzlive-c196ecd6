import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { isGateExemptPath } from '@/pages/gate/gateRoutes';

vi.mock('@/hooks/useMaintenanceMode', () => ({ useMaintenanceMode: () => ({ on: true, message: null }) }));
vi.mock('@/hooks/usePanelRole', () => ({ usePanelRole: () => ({ role: 'none', loading: false }) }));
vi.mock('@/components/maintenance/MaintenanceWall', () => ({ MaintenanceWall: () => <div data-testid="maintenance-wall" /> }));

import { MaintenanceGate } from '@/components/maintenance/MaintenanceGate';

afterEach(cleanup);

function renderRoute(path: string) {
  render(<MemoryRouter initialEntries={[path]}><MaintenanceGate><div data-testid="public-content" /></MaintenanceGate></MemoryRouter>);
}

describe('Public delete-account access', () => {
  it('exempts the deletion route from downloads without exempting app paths', () => {
    expect(isGateExemptPath('/delete-account')).toBe(true);
    expect(isGateExemptPath('/delete-account-other')).toBe(false);
    expect(isGateExemptPath('/manage/profile')).toBe(false);
    expect(isGateExemptPath('/privacy')).toBe(true);
    expect(isGateExemptPath('/terms')).toBe(true);
  });

  it('keeps deletion information public while maintenance is enabled', () => {
    renderRoute('/delete-account');
    expect(screen.getByTestId('public-content')).toBeInTheDocument();
    expect(screen.queryByTestId('maintenance-wall')).not.toBeInTheDocument();
  });

  it.each(['/privacy', '/terms'])('preserves the existing maintenance behaviour for %s', (path) => {
    renderRoute(path);
    expect(screen.getByTestId('maintenance-wall')).toBeInTheDocument();
    expect(screen.queryByTestId('public-content')).not.toBeInTheDocument();
  });

  it('preserves the existing sign-in maintenance exemption', () => {
    renderRoute('/auth');
    expect(screen.getByTestId('public-content')).toBeInTheDocument();
    expect(screen.queryByTestId('maintenance-wall')).not.toBeInTheDocument();
  });
});