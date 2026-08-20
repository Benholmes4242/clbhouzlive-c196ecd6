import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { FeedCommentPreview } from './FeedCommentPreview';

vi.mock('@/components/ui/SquircleAvatar', () => ({
  SquircleAvatar: ({ alt }: { alt?: string }) => <div data-testid="avatar">{alt ?? 'avatar'}</div>,
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

  it('does not contain nested buttons in the row', () => {
    const { container } = wrap(<FeedCommentPreview preview={preview} commentCount={1} onOpenComments={() => {}} />);
    expect(container.querySelectorAll('button')).toHaveLength(0);
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

  it('uses light-surface tones when surface is light', () => {
    const { container } = wrap(
      <FeedCommentPreview preview={preview} commentCount={1} onOpenComments={() => {}} surface="light" />,
    );
    expect(screen.getByText('Bob')).toHaveStyle({ color: '#0F172A' });
    expect(container.querySelector('[data-mention-type="user"]')).toHaveStyle({ color: '#6C727E' });
  });

  it('uses dark-surface tones when surface is dark', () => {
    wrap(<FeedCommentPreview preview={preview} commentCount={1} onOpenComments={() => {}} surface="dark" />);
    expect(screen.getByText('Bob')).toHaveStyle({ color: '#F8FAFC' });
    const mention = screen.getByText('@Alice');
    expect(mention).toHaveStyle({ color: '#A7AAAE' });
  });
});
