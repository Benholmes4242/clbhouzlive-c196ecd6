import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

const reads = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: reads.from } }));

import { usePostCourseGroups } from '@/features/post-v2/hooks/usePostCourseGroups';

describe('post course groups without a member id', () => {
  it('returns an empty member group and performs no read for undefined or null', () => {
    const { result, rerender } = renderHook(
      ({ userId }: { userId: string | null | undefined }) => usePostCourseGroups(true, userId),
      { initialProps: { userId: undefined as string | null | undefined } },
    );
    expect(result.current.member).toEqual([]);
    expect(result.current.club).toEqual([]);
    expect(reads.from).not.toHaveBeenCalled();
    rerender({ userId: null });
    expect(result.current.member).toEqual([]);
    expect(reads.from).not.toHaveBeenCalled();
  });
});