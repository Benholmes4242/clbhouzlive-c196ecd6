/**
 * ProfileSocialListRoute — prod route host for the Circle (F3).
 *
 * Resolves :username → profile row via useUserByUsername and mounts
 * SocialListPage. Direction is driven by the `direction` prop; the
 * legacy `?tab=followers|following` search param is honored as a
 * fallback override for old deep links.
 */

import { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useUserByUsername } from '@/hooks/useUserByUsername';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { analyticsEvents } from '@/utils/analyticsEvents';
import SocialListPage, { ListSkeleton } from './SocialListPage';
import { A } from '@/features/courses/components/holes/analytical/tokens';

interface Props {
  direction: 'followers' | 'following';
}

export default function ProfileSocialListRoute({ direction }: Props) {
  const { username } = useParams<{ username: string }>();
  const [search] = useSearchParams();
  const searchTab = search.get('tab');
  const initialTab: 'followers' | 'following' =
    searchTab === 'followers' || searchTab === 'following' ? searchTab : direction;
  const { data: profile, isLoading, isError, refetch } = useUserByUsername(username);
  const { user: viewer } = useSupabaseSession();
  const isOwnProfile = !!viewer?.id && !!profile?.id && viewer.id === profile.id;

  useEffect(() => {
    if (profile?.id) {
      analyticsEvents.social.listViewed({
        type: initialTab === 'following' ? 'following' : 'followers',
        profileUserId: profile.id,
        from: 'profile_stats',
      });
    }
  }, [profile?.id, initialTab]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100dvh', background: A.CANVAS, paddingTop: 'calc(var(--chrome-total-h, 0px) + 24px)' }}>
        <ListSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ minHeight: '100dvh', background: A.CANVAS, padding: '80px 16px', color: A.BODY, fontSize: 13, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
        Couldn't load this profile.
        <button
          type="button"
          onClick={() => refetch()}
          style={{ background: A.INK, color: A.CANVAS, border: 'none', borderRadius: 999, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ minHeight: '100dvh', background: A.CANVAS, padding: '80px 16px', color: A.BODY, fontSize: 13 }}>
        User not found.
      </div>
    );
  }

  return (
    <SocialListPage
      profileActorType="personal"
      profileActorId={profile.id}
      profileUsername={profile.username}
      profileDisplayName={profile.display_name}
      initialTab={initialTab}
      showInviteCard={isOwnProfile}
    />
  );
}
