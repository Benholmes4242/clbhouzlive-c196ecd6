import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

const likers = [
  { userId: 'me', actorId: 'me', actorType: 'personal', displayName: 'Me', username: 'me', avatarUrl: null, handicapIndex: 5, isViewer: true, isFollowing: false, businessType: null },
  { userId: 't', actorId: 't', actorType: 'personal', displayName: 'Thomas', username: 'thomas', avatarUrl: null, handicapIndex: 5, isViewer: false, isFollowing: true, businessType: null },
];
vi.mock('@/hooks/usePostLikers', () => ({
  usePostLikers: () => ({ likers, isLoading: false }),
  likerFirstNames: (l: any[], n: number) => l.slice(0, n).map((x) => x.displayName),
}));
vi.mock('@/hooks/useSupabaseSession', () => ({ useSupabaseSession: () => ({ user: { id: 'me' } }) }));
vi.mock('@/components/ui/SquircleAvatar', () => ({ SquircleAvatar: () => <span /> }));
// Stand-in sheet: renders a person row when open, so taps inside it can be fired.
vi.mock('@/components/likes/LikesSheet', () => ({
  LikesSheet: ({ open }: { open: boolean }) => (open ? <div data-likes-sheet><button type="button" data-person-row>row</button></div> : null),
}));

import { LikedByRow } from '@/components/likes/LikedByRow';

afterEach(cleanup);

describe('LikedByRow does not bubble to a parent', () => {
  it('clicking the row opens the sheet without calling the parent', () => {
    const parent = vi.fn();
    const v = render(<div onClick={parent}><LikedByRow postId="p1" count={3} kind="celebrate" /></div>);
    expect(v.container.querySelector('[data-likes-sheet]')).toBeNull();
    fireEvent.click(v.container.querySelector('button')!);
    expect(v.container.querySelector('[data-likes-sheet]')).not.toBeNull();
    expect(parent).not.toHaveBeenCalled();
  });

  it('clicking inside the open sheet does not call the parent', () => {
    const parent = vi.fn();
    const v = render(<div onClick={parent}><LikedByRow postId="p1" count={3} kind="celebrate" /></div>);
    fireEvent.click(v.container.querySelector('button')!);
    fireEvent.click(v.container.querySelector('[data-person-row]')!);
    expect(parent).not.toHaveBeenCalled();
  });
});

