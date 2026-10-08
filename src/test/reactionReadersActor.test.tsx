import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { isReactionByActor } from '@/lib/reactionActor';

const MEMBER = 'member-1';
const BIZ = 'biz-1';
const OTHER = 'member-2';

// content_reactions on one review: another member personally, plus our member
// acting AS their business (user_id is the human who tapped).
const ROWS = [
  { user_id: OTHER, actor_type: 'personal', actor_id: OTHER },
  { user_id: MEMBER, actor_type: 'business', actor_id: BIZ },
];

vi.mock('@/integrations/supabase/client', () => {
  const chain = (table: string) => {
    const q: any = {
      select: () => q, eq: () => q, in: () => q, order: () => q, limit: () => q,
      then: (res: any) => {
        if (table === 'content_reactions') return res({ data: ROWS, error: null });
        if (table === 'user_profiles')
          return res({ data: [{ id: OTHER, display_name: 'Other Golfer', username: 'other', profile_photo_url: null }], error: null });
        if (table === 'business_accounts')
          return res({ data: [{ id: BIZ, name: 'Links Pro Shop', slug: 'links-pro', logo_url: 'logo.png' }], error: null });
        return res({ data: [], error: null });
      },
    };
    return q;
  };
  return { supabase: { from: chain } };
});

import { usePostLikes } from '@/hooks/usePostLikes';

describe('reaction readers follow the actor', () => {
  it('a count includes a business reaction', async () => {
    const qc = new QueryClient();
    const wrapper = ({ children }: any) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
    const { result } = renderHook(() => usePostLikes('review-1', true, 'review'), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data!.length).toBe(2);
  });

  it('did-I-react is false for the member personally, true as their business', () => {
    const mine = (type: 'personal' | 'business', id: string) =>
      ROWS.some((r) => isReactionByActor(r, type, id));
    expect(mine('personal', MEMBER)).toBe(false);
    expect(mine('business', BIZ)).toBe(true);
  });

  it('a liker list renders the business identity for a business row', async () => {
    const qc = new QueryClient();
    const wrapper = ({ children }: any) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
    const { result } = renderHook(() => usePostLikes('review-1', true, 'review'), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());
    const biz = result.current.data!.find((l) => l.actorType === 'business')!;
    expect(biz.displayName).toBe('Links Pro Shop');
    expect(biz.avatarUrl).toBe('logo.png');
    expect(biz.actorId).toBe(BIZ);
  });
});
