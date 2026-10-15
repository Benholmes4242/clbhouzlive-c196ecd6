import { describe, it, expect } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { shouldPersistQuery } from '@/lib/queryPersister';
import { MEMBER_GOLF_QUERY_KEYS, applyMemberGolfQueryDefaults, isMemberGolfQueryKey } from '@/lib/memberDataFreshness';
import { LIGHT_REFRESH_KEYS } from '@/contexts/RehydrationContext';

const ok = { status: 'success', data: { a: 1 } };

describe('member data freshness', () => {
  it('never persists a member key even though its prefix is allowlisted', () => {
    expect(shouldPersistQuery({ queryKey: ['top100-progress-user', 'u1'], state: ok })).toBe(false);
  });
  it('still persists an allowlisted key outside the member set', () => {
    expect(shouldPersistQuery({ queryKey: ['top100-lists'], state: ok })).toBe(true);
  });
  it('every member key resolves to refetchOnMount always', () => {
    const c = new QueryClient();
    applyMemberGolfQueryDefaults(c);
    for (const k of MEMBER_GOLF_QUERY_KEYS) {
      const o = c.defaultQueryOptions({ queryKey: [...k, 'x'] as unknown[] });
      expect(o.refetchOnMount).toBe('always');
      expect(o.refetchOnWindowFocus).toBe(true);
      expect(o.refetchOnReconnect).toBe(true);
    }
  });
  it('the resume refresh covers every member key', () => {
    for (const k of MEMBER_GOLF_QUERY_KEYS) {
      expect(LIGHT_REFRESH_KEYS).toContainEqual(k);
      expect(isMemberGolfQueryKey([...k, 'id'])).toBe(true);
    }
  });
});
