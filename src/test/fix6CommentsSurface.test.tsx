import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'member' } }) }));
vi.mock('@/context/ActiveActorContext', () => ({ useActiveActor: () => ({ activeActor: { id: 'member', type: 'personal' }, availableActors: [] }) }));
vi.mock('@/features/comments-v2/hooks/useCommentsV2', () => ({ useCommentsV2: () => ({ threads: [], visibleCount: 0, hiddenCount: 0, threadFetched: true, totalCountFetched: true, isFetched: true, isLoading: false, hasNextPage: false, addComment: { isPending: false }, editComment: { isPending: false }, deleteComment: { isPending: false }, toggleLike: { isPending: false }, hideComment: { isPending: false }, reportComment: { isPending: false } }) }));
vi.mock('@/features/comments-v2/hooks/useCommentsRealtimeV2', () => ({ useCommentsRealtimeV2: () => {} }));
vi.mock('@/features/comments-v2/hooks/useCommentsContext', () => ({ useCommentsSubject: () => ({ data: null }), useThreadStandings: () => ({ data: null }) }));
vi.mock('@/hooks/messaging/useKeyboardHeight', () => ({ useKeyboardHeight: () => 0 }));
vi.mock('@/components/mentions/MentionsComposerInput', () => ({ MentionsComposerInput: () => <input data-comment-input /> }));
vi.mock('@/features/comments-v2/components/CommentActionSheetV2', () => ({ CommentActionSheetV2: () => null }));
vi.mock('@/features/comments-v2/components/ReportCommentSheetV2', () => ({ ReportCommentSheetV2: () => null }));
import { CommentsSheetV2 } from '@/features/comments-v2/CommentsSheetV2';
import { SHEET_SURFACE } from '@/lib/tokens/surfaces';
describe('FIX6 comments sheet material', () => {
  it('sheet and real composer paint the shared sheet colour', () => {
    render(<MemoryRouter><QueryClientProvider client={new QueryClient()}><CommentsSheetV2 isOpen onClose={vi.fn()} targetType="post" targetId="post" /></QueryClientProvider></MemoryRouter>);
    const sheet = document.querySelector<HTMLElement>('[data-comments-sheet]');
    const composer = document.querySelector('[data-comment-input]')?.parentElement;
    expect(sheet).not.toBeNull(); expect(composer).not.toBeNull();
    const probe = document.createElement('div'); probe.style.background = SHEET_SURFACE; document.body.appendChild(probe);
    const expected = getComputedStyle(probe).backgroundColor;
    expect(expected).toBe('rgb(22, 22, 26)');
    if (sheet) expect(getComputedStyle(sheet).backgroundColor).toBe(expected);
    // Mentions field is nested inside controls; find the painted composer ancestor.
    const bar = composer?.closest('.shrink-0');
    expect(bar).not.toBeNull();
    if (bar) expect(getComputedStyle(bar).backgroundColor).toBe(expected);
    probe.remove();
  });
});