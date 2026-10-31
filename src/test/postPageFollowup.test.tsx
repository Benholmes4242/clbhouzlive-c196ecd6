import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));
vi.mock('@/features/activity-v2/hooks/useSharePrompt', () => ({ useSharePromptFor: () => null }));

import { ShotTagSheet } from '@/features/post-v2/components/golf/GolfPostSections';
import { LedgerRow } from '@/features/activity-v2/components/LedgerRow';
import { getActivityLink } from '@/features/activity-v2/utils/activityLinks';
import type { ActivityFeedRowV2 } from '@/features/activity-v2/hooks/useActivityFeedV2';

afterEach(cleanup);

const notification: ActivityFeedRowV2 = {
  notif_id: 'played-with-tag', notif_type: 'tag', created_at: '2026-10-31T16:00:00Z', is_read: false,
  entity_type: 'post', entity_id: 'post-1', data: { post_id: 'post-1', tag_kind: 'played_with' },
  message: 'Ben tagged you as playing with them in a post.', title: null,
  actor_user_id: 'ben', actor_username: 'ben', actor_display_name: 'Ben', actor_avatar_url: null,
  actor_kind: 'personal', actor_route_id: 'ben', liker_avatar_urls: [],
  target_course_name: null, target_course_image: null, target_poster_url: null, target_review_rating: null,
};

describe('Played with tag notification', () => {
  it('routes a tag row with tag_kind played_with to the post', () => {
    expect(getActivityLink(notification)).toBe('/post/post-1');
    expect(getActivityLink({ ...notification, data: { tag_kind: 'played_with' } })).toBe('/post/post-1');
  });

  it('renders the server message in the inbox and opens its post on tap', () => {
    const markRead = vi.fn();
    function Destination() { return <output aria-label="Destination">{useLocation().pathname}</output>; }
    render(<MemoryRouter initialEntries={['/notificationmessages']}>
      <LedgerRow row={notification} onMarkRead={markRead} onLongPress={vi.fn()} />
      <Destination />
    </MemoryRouter>);
    const row = screen.getByRole('button', { name: /Ben tagged you as playing with them in a post/ });
    fireEvent.click(row);
    expect(markRead).toHaveBeenCalledWith('played-with-tag');
    expect(screen.getByLabelText('Destination')).toHaveTextContent('/post/post-1');
  });
});

describe('tag-sheet photo editor handoff', () => {
  it('closes the tag sheet before opening editing for the selected photo', () => {
    const events: string[] = [];
    function Handoff() {
      const [open, setOpen] = useState(true);
      const [editing, setEditing] = useState<string | null>(null);
      const item = { id: 'photo-2', type: 'image' as const, previewUrl: 'https://example.test/photo.jpg', frame: 'original' as const };
      return <>
        <ShotTagSheet open={open} item={item} courses={[{ id: 'c1', name: 'Sundridge Park', country: null }]}
          courseIndex={0} onCourseIndex={vi.fn()} holes={[1, 2, 7]} tag={{ hole: 7 }} onChoose={vi.fn()}
          onClose={() => { events.push('close'); setOpen(false); }}
          onEditPhoto={() => { events.push('edit'); setEditing(item.id); }} />
        {editing && <output aria-label="Editing photo">{editing}</output>}
      </>;
    }
    render(<Handoff />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit photo' }));
    expect(events).toEqual(['close', 'edit']);
    expect(screen.queryByTestId('shot-tag-sheet')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Editing photo')).toHaveTextContent('photo-2');
  });
});