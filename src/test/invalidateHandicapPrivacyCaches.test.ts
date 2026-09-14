import { describe, expect, it, vi } from 'vitest';
import type { QueryClient } from '@tanstack/react-query';

import {
  HANDICAP_PRIVACY_QUERY_KEYS,
  invalidateHandicapPrivacyCaches,
} from '@/utils/invalidateHandicapPrivacyCaches';

describe('invalidateHandicapPrivacyCaches', () => {
  it('invalidates every handicap-bearing query family with partial matching', () => {
    const invalidateQueries = vi.fn();
    const queryClient = { invalidateQueries } as unknown as QueryClient;

    invalidateHandicapPrivacyCaches(queryClient);

    expect(invalidateQueries).toHaveBeenCalledTimes(HANDICAP_PRIVACY_QUERY_KEYS.length);
    expect(invalidateQueries.mock.calls.map(([filters]) => filters)).toEqual(
      HANDICAP_PRIVACY_QUERY_KEYS.map((queryKey) => ({ queryKey, exact: false })),
    );
  });
});