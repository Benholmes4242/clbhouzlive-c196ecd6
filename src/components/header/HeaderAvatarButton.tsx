import React, { useRef, useState } from 'react';
import { PostingAsPill } from './PostingAsPill';
import { PostingAsMenu } from './PostingAsMenu';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';

/**
 * HeaderAvatarButton — shared profile-menu avatar trigger. Used by
 * CompactHeader (normal chrome) and TourHubShellTabs (immersive tour overview)
 * so behaviour stays identical no matter where the avatar lives.
 *
 * `variant="bare"` renders the TikTok-style floating avatar (no background,
 * no chevron, white hairline ring + drop-shadow) — meant for floating over
 * imagery on the immersive tour surface.
 */
export function HeaderAvatarButton({ variant = 'bare' }: { variant?: 'bare' | 'pill' }) {
  const { user } = useSupabaseSession();
  const { hasUnread, unreadCount } = useUnreadNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);

  if (!user) return null;

  return (
    <>
      <PostingAsPill
        ref={ref}
        onClick={() => setOpen((v) => !v)}
        isOpen={open}
        hasUnreadNotifications={hasUnread}
        notificationCount={unreadCount}
        useBareTheme={variant === 'bare'}
        useLightTheme={variant !== 'bare'}
      />
      <PostingAsMenu
        isOpen={open}
        onClose={() => setOpen(false)}
        anchorRef={ref}
      />
    </>
  );
}

export default HeaderAvatarButton;
