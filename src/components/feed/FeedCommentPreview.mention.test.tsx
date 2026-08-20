import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { FeedCommentPreview } from './FeedCommentPreview';

vi.mock('@/components/ui/SquircleAvatar', () => ({
  SquircleAvatar: ({ alt }: { alt?: string }) => <div data-testid="avatar" data-alt={alt} />,
}));
vi.mock('@/components/ui/VerifiedBadge', () => ({
  VerifiedBadge: () => <span data-testid="verified">✓</span>,
}));
vi.mock('@/i18n/format', () => ({
  formatRelativeWithSeconds: () => '2h',
}));

const preview = {
  post_id: 'p1',
  comment_id: 'c1',
  content: 'Nice shot @[@Alice](u:11111111-1111-1111-1111-111111111111)!',
  created_at: new Date().toISOString(),
  actor_type: 'personal' as const,
  actor_id: 'a1',
  display_name: 'Bob',
  avatar_url: null,
  verified: false,
  thread_count: 1,
};

function wrap(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('FeedCommentPreview mention integration', () => {
  it('renders the tagged name in bold, not raw markup', () => {
    wrap(<FeedCommentPreview preview={preview} commentCount={1} onOpenComments={() => {}} />);
    expect(screen.getByText('Nice shot')).toBeInTheDocument();
    const mention = screen.getByText('@Alice');
    expect(mention).toBeInTheDocument();
    expect(mention.tagName).toBe('SPAN');
    expect(mention).toHaveClass('font-bold');
    expect(mention).toHaveAttribute('data-mention-id', '11111111-1111-1111-1111-111111111111');
  });

  it('does not contain nested buttons inside the preview row', () => {
    const { container } = wrap(<FeedCommentPreview preview={preview} commentCount={1} onOpenComments={() => {}} />);
    const row = container.querySelector('[role="button"]');
    expect(row).toBeInTheDocument();
    expect(row?.querySelectorAll('button')).toHaveLength(0);
  });

  it('opens the comments sheet when the row is clicked outside the mention', () => {
    const open = vi.fn();
    wrap(<FeedCommentPreview preview={preview} commentCount={1} onOpenComments={open} />);
    const row = screen.getByRole('button', { name: /Bob/ });
    fireEvent.click(row);
    expect(open).toHaveBeenCalledTimes(1);
  });

  it('opens the comments sheet when Enter is pressed on the row', () => {
    const open = vi.fn();
    wrap(<FeedCommentPreview preview={preview} commentCount={1} onOpenComments={open} />);
    const row = screen.getByRole('button', { name: /Bob/ });
    fireEvent.keyDown(row, { key: 'Enter' });
    expect(open).toHaveBeenCalledTimes(1);
  });

  it('does not open the comments sheet when a mention is tapped', () => {
    const open = vi.fn();
    wrap(<FeedCommentPreview preview={preview} commentCount={1} onOpenComments={open} />);
    const mention = screen.getByText('@Alice');
    fireEvent.click(mention);
    expect(open).not.toHaveBeenCalled();
  });

  it('renders malformed mention markup as plain text', () => {
    const malformed = { ...preview, content: 'Hi @[[Bad](u:bad)' };
    wrap(<FeedCommentPreview preview={malformed} commentCount={1} onOpenComments={() => {}} />);
    expect(screen.getByText('Hi @[[Bad](u:bad)')).toBeInTheDocument();
  });

  it('keeps the single-line clamp on a long comment with a trailing mention', () => {
    const long =
      'This is a really long comment that would definitely wrap if the clamp were not in place ' +
      'and it ends with a mention at the very end @[@Alice](u:11111111-1111-1111-1111-111111111111) there.';
    const { container } = wrap(
      <FeedCommentPreview preview={{ ...preview, content: long }} commentCount={1} onOpenComments={() => {}} />,
    );
    const clamp = container.querySelector('span[style*="white-space: nowrap"]');
    expect(clamp).toHaveStyle({
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    });
    expect(clamp).toContainElement(container.querySelector('[data-mention-type="user"]') as HTMLElement);
  });

  it('uses light-surface tones when surface is light', () => {
    const { container } = wrap(
      <FeedCommentPreview preview={preview} commentCount={1} onOpenComments={() => {}} surface="light" />,
    );
    const row = within(container.querySelector('[role="button"]') as HTMLElement);
    expect(row.getByText('Bob')).toHaveStyle({ color: '#0F172A' });
    // The MID tone wrapper carries the color; the <MentionText> span inherits it.
    const mention = container.querySelector('[data-mention-type="user"]');
    expect(mention?.parentElement?.parentElement).toHaveStyle({ color: '#6C727E' });
  });

  it('uses dark-surface tones when surface is dark', () => {
    const { container } = wrap(
      <FeedCommentPreview preview={preview} commentCount={1} onOpenComments={() => {}} surface="dark" />,
    );
    const row = within(container.querySelector('[role="button"]') as HTMLElement);
    expect(row.getByText('Bob')).toHaveStyle({ color: '#F8FAFC' });
    const mention = container.querySelector('[data-mention-type="user"]');
    expect(mention?.parentElement?.parentElement).toHaveStyle({ color: '#A7AAAE' });
  });
});
