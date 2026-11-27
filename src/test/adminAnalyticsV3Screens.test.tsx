import React from 'react';
import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { mapHealth, mapScreens, type AnalyticsHealth, type AnalyticsScreens } from '@/features/admin/hooks/useAnalyticsLenses';

let data: AnalyticsScreens;
let health: AnalyticsHealth | undefined;
const healthRead = vi.fn();
vi.mock('@/features/admin/hooks/useAnalyticsLenses', async (orig) => {
  const real = await orig<typeof import('@/features/admin/hooks/useAnalyticsLenses')>();
  return {
    ...real,
    useAnalyticsScreens: () => ({ data, isLoading: false, isError: false, isFetching: false, refetch: vi.fn() }),
    useAnalyticsHealth: (days: number) => {
      healthRead(days);
      return { data: health, isLoading: health === undefined, isError: false, isFetching: false, refetch: vi.fn() };
    },
  };
});

import ScreensLens from '@/features/admin/components/analytics/ScreensLens';
import { CC3 } from '@/features/admin/components/InboxPanels';

const SRC = 'src/features/admin/components/analytics/ScreensLens.tsx';

describe('ANALYTICS_V3_4_SCREENS', () => {
  beforeEach(() => {
    healthRead.mockClear();
    health = mapHealth({ activity: { mau: 68 } });
    data = mapScreens({
      days: 30, used: 49, unused: 1, views: 2978, typical_secs: 9, dev_hidden: 10,
      rows: [
        { route: '/clubhouse', label: 'Home feed', area: 'Feed', views: 654, secs: 30360, members: 62 },
        { route: '/profile', label: 'My profile', area: 'Profile', views: 346, secs: 11340, members: 0 },
      ],
      unused_rows: [{ route: '/manage/contact', label: 'Contact', area: 'Settings', last_seen: '2026-10-20' }],
    });
  });

  it('(a) 30,360 seconds and 62 members shows 8m each; zero members omits each', () => {
    render(<ScreensLens />);
    expect(screen.getByText('Feed · 654 views · 8m each')).toBeInTheDocument();
    expect(screen.getByText('Profile · 346 views')).toBeInTheDocument();
    expect(screen.getAllByText(/each/)).toHaveLength(1);
  });

  it('(b) Views uses health mau and shows an em dash for null, zero or loading', () => {
    const view = render(<ScreensLens />);
    expect(screen.getByText('44 per active member')).toBeInTheDocument();
    expect(healthRead).toHaveBeenCalledWith(30);
    for (const mau of [null, 0]) {
      health = mapHealth({ activity: { mau } });
      view.rerender(<ScreensLens />);
      expect(screen.getByText('— per active member')).toBeInTheDocument();
    }
    health = undefined;
    view.rerender(<ScreensLens />);
    expect(screen.getByText('— per active member')).toBeInTheDocument();
  });

  it('(c) area chips wrap without horizontal scrolling and active-chip taps return to All', () => {
    render(<ScreensLens />);
    const feed = screen.getByRole('button', { name: 'Feed' });
    const chips = feed.parentElement!;
    expect(chips).toHaveStyle({ flexWrap: 'wrap' });
    expect(chips.style.overflowX).toBe('');
    fireEvent.click(feed);
    expect(feed).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByText('My profile')).not.toBeInTheDocument();
    fireEvent.click(feed);
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('My profile')).toBeInTheDocument();
  });

  it('(d) Unused and Nobody opened count use neutral ink, not amber', () => {
    render(<ScreensLens />);
    const unused = screen.getByText('Unused').parentElement!;
    expect(within(unused).getByText('1')).toHaveStyle({ color: CC3.ink });
    const nobody = screen.getByText('Nobody opened').closest('section')!;
    expect(within(nobody).getByText('1')).toHaveStyle({ color: CC3.ink });
  });

  it('(e) routes inherit the normal font and permit wrapping', () => {
    render(<ScreensLens />);
    const route = screen.getByText('/manage/contact');
    expect(route.style.fontFamily).toBe('');
    expect(route.style.overflowWrap).toBe('anywhere');
    expect(route.style.whiteSpace).toBe('');
  });

  it('(f) source scan: no heavy or tiny type, amber, ellipsis, horizontal scrolling or monospace', () => {
    const src = readFileSync(SRC, 'utf8');
    for (const m of src.matchAll(/fontWeight:\s*(\d+)/g)) expect(Number(m[1])).toBeLessThanOrEqual(700);
    for (const m of src.matchAll(/fontSize:\s*([\d.]+)/g)) expect(Number(m[1])).toBeGreaterThanOrEqual(10);
    expect(src).not.toMatch(/t\.(?:warnText|brand)|textOverflow:\s*['"]ellipsis|overflowX:\s*['"]auto|monospace/);
    expect(src).not.toMatch(/scrollbarWidth|::-webkit-scrollbar|admin-analytics-chips/);
  });
});