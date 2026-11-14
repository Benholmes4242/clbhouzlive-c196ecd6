import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
const f = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: f.rpc } }));
vi.mock('@/components/ui/SquircleAvatar', () => ({ SquircleAvatar: () => <span />, DARK_HAIRLINE: 'ring' }));
import { PersonRow } from '@/features/search-v2/components/PersonRow';
import { CommentCard } from '@/features/comments-v2/components/CommentCard';
import { ReplyRow } from '@/features/comments-v2/components/ReplyRow';
import { invalidateProMembers } from '@/features/pro-verification/proMembersCache';
import type { CommentV2 } from '@/features/comments-v2/hooks/useCommentsV2';
import type { PersonHit } from '@/features/search-v2/lib/searchNavigation';
const comment = (id: string, business = false) => ({ id, user_id: id, actor_id: id, actor_type: business ? 'business' : 'personal', display_name: 'Name', created_at: new Date().toISOString(), content: '', replies: [], likes_count: 0, media_url: null }) as CommentV2;
beforeEach(() => { invalidateProMembers(); f.rpc.mockReset().mockResolvedValue({ data: [{ user_id: 'pro', pro_kind: 'tour_pro' }], error: null }); });
afterEach(cleanup);
describe('Brief 2 opted-in member rows', () => {
  for (const surface of ['search', 'comment', 'reply'] as const) {
    it(`${surface} labels only the verified personal identity and batches siblings`, async () => {
      const row = (id: string) => surface === 'search' ? <PersonRow person={{ id, display_name: 'Name' } as PersonHit} query="" onSelect={() => {}} /> : surface === 'comment' ? <CommentCard comment={comment(id)} currentUserId={null} onReply={() => {}} onLike={() => {}} onMore={() => {}} /> : <ReplyRow comment={comment(id)} currentUserId={null} onLike={() => {}} onMore={() => {}} />;
      const { container } = render(<MemoryRouter>{row('pro')}{row('ordinary')}{row('pending')}</MemoryRouter>);
      await waitFor(() => expect(container.querySelectorAll('.pro-label')).toHaveLength(1));
      expect(f.rpc.mock.calls.filter(c => c[0] === 'get_pro_members')).toHaveLength(1);
      expect(f.rpc).toHaveBeenCalledWith('get_pro_members', { p_user_ids: ['pro', 'ordinary', 'pending'] });
    });
  }
  it('business comments and replies never request a member label', () => {
    const { container } = render(<MemoryRouter><CommentCard comment={comment('pro', true)} currentUserId={null} onReply={() => {}} onLike={() => {}} onMore={() => {}} /><ReplyRow comment={comment('pro', true)} currentUserId={null} onLike={() => {}} onMore={() => {}} /></MemoryRouter>);
    expect(container.querySelector('.pro-label')).toBeNull();
    expect(f.rpc).not.toHaveBeenCalled();
  });
});