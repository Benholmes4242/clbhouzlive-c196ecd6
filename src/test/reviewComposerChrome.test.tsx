import React from 'react';
import { expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/lib/routeChrome', () => ({
  claimOverlayChrome: vi.fn(),
  releaseOverlayChrome: vi.fn(),
  applyRouteChrome: vi.fn(),
  reassertRouteChrome: vi.fn(),
}));
// Keep data-dependent descendants out of this lifecycle-only regression.
vi.mock('@/components/AccessControl', () => ({ default: () => null }));

import ReviewComposerV2 from '@/features/review-v2/ReviewComposerV2';
import { RV2 } from '@/features/review-v2/tokens';
import { claimOverlayChrome, releaseOverlayChrome } from '@/lib/routeChrome';

it('claims the review canvas once on mount and releases it on unmount', () => {
  vi.clearAllMocks();
  const { unmount } = render(<ReviewComposerV2 />);

  expect(claimOverlayChrome).toHaveBeenCalledTimes(1);
  expect(claimOverlayChrome).toHaveBeenCalledWith({
    id: 'review-composer',
    statusBarStyle: 'light',
    statusBarColor: 'FF16161A',
    shieldColor: RV2.canvas,
  });
  expect(releaseOverlayChrome).not.toHaveBeenCalled();

  unmount();

  expect(releaseOverlayChrome).toHaveBeenCalledTimes(1);
  expect(releaseOverlayChrome).toHaveBeenCalledWith('review-composer');
});