import { useContext } from 'react';
import { InviteSheetContext } from '@/components/invite/InviteSheetProvider';

export type InviteSheetSource =
  | 'profile_hub'
  | 'feed_end'
  | 'leaderboard_empty'
  | 'review_success'
  | 'invite_sheet'
  | (string & {});

export function useInviteSheet() {
  const ctx = useContext(InviteSheetContext);
  if (!ctx) {
    throw new Error('useInviteSheet must be used inside <InviteSheetProvider>');
  }
  return ctx;
}
