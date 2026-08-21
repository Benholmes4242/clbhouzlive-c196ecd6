/**
 * THE MISSING COVERAGE (BRIEF_REALTIME_COUNTS_AND_MENTION_TAP §B2).
 *
 * FeedCommentPreview had a mention test; the comments sheet had none, and a
 * mention inside a REPLY — the reported case — had none at all. These tests pin
 * the reply path specifically: the markup parses, the tap reaches the handler,
 * the sheet is closed and the profile route is the one navigated to.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';

import { ReplyRow } from './ReplyRow';
import { CommentCard } from './CommentCard';
import type { CommentV2 } from '../hooks/useCommentsV2';

vi.mock('@/components/ui/SquircleAvatar', () => ({
  SquircleAvatar: ({ alt }: { alt?: string }) => <div data-testid="avatar" data-alt={alt} />,
  LIGHT_HAIRLINE: '#EDF0F3',
}));
vi.mock('@/i18n/format', () => ({
  formatRelativeMonths: () => '2h',
  formatRelativeWithSeconds: () => '2h',
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

const DANNY = '36f22cdf-4099-44f0-80cd-512647ef2f42';

const base: CommentV2 = {
  id: 'r1',
  user_id: 'u1',
  actor_type: 'personal',
  actor_id: 'u1',
  display_name: 'Benjamin Holmes',
  avatar_url: null,
  slug: null,
  content: `Welcome to the team @[Danny Holmes](u:${DANNY})`,
  media_url: null,
  media_type: null,
  created_at: new Date().toISOString(),
  is_edited: false,
  likes_count: 0,
  has_liked: false,
  reply_count: 0,
  parent_id: 'c1',
} as unknown as CommentV2;

function Path() {
  const loc = useLocation();
  return <div data-testid="path">{loc.pathname}</div>;
}

function wrap(ui: React.ReactElement) {
  return render(
    <MemoryRouter initialEntries={['/clubhouse']}>
      {ui}
      <Path />
    </MemoryRouter>,
  );
}

describe('mention inside a reply', () => {
  it('renders the tagged name in bold with the mention id, not raw markup', () => {
    wrap(<ReplyRow comment={base} currentUserId="me" onLike={() => {}} onMore={() => {}} />);
    const mention = screen.getByText('Danny Holmes');
    expect(mention).toHaveClass('font-bold');
    expect(mention).toHaveAttribute('data-mention-id', DANNY);
    expect(screen.queryByText(/\(u:/)).toBeNull();
  });

  it('closes the sheet and navigates to the profile when the mention is tapped', () => {
    const onClose = vi.fn();
    wrap(
      <ReplyRow
        comment={base}
        currentUserId="me"
        onLike={() => {}}
        onMore={() => {}}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByText('Danny Holmes'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('path').textContent).toBe(`/profile/${DANNY}`);
  });

  it('navigates to the business route for a business mention in a reply', () => {
    const bizId = '22222222-2222-4222-8222-222222222222';
    wrap(
      <ReplyRow
        comment={{ ...base, content: `See @[Links Club](b:${bizId})` } as CommentV2}
        currentUserId="me"
        onLike={() => {}}
        onMore={() => {}}
      />,
    );
    fireEvent.click(screen.getByText('Links Club'));
    expect(screen.getByTestId('path').textContent).toBe(`/business/${bizId}`);
  });

  it('does not fire the reply like handler when the mention is tapped', () => {
    const onLike = vi.fn();
    wrap(<ReplyRow comment={base} currentUserId="me" onLike={onLike} onMore={() => {}} />);
    fireEvent.click(screen.getByText('Danny Holmes'));
    expect(onLike).not.toHaveBeenCalled();
  });

  it('navigates from a reply rendered THROUGH CommentCard, the sheet path', () => {
    const parent: CommentV2 = {
      ...base,
      id: 'c1',
      parent_id: null,
      content: 'Any trades?',
      reply_count: 1,
    } as CommentV2;
    const onClose = vi.fn();
    wrap(
      <CommentCard
        comment={parent}
        isFirst
        currentUserId="me"
        replies={[base]}
        onReply={() => {}}
        onLike={() => {}}
        onMore={() => {}}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByText('Danny Holmes'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('path').textContent).toBe(`/profile/${DANNY}`);
  });
});
