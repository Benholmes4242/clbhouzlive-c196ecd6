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
import SocialListPage from './SocialListPage';

interface Props {
  direction: 'followers' | 'following';
}

export default function ProfileSocialListRoute({ direction }: Props) {
  const { username } = useParams<{ username: string }>();
  const [search] = useSearchParams();
  const searchTab = search.get('tab');
  const initialTab: 'followers' | 'following' =
    searchTab === 'followers' || searchTab === 'following' ? searchTab : direction;
  const { data: profile, isLoading } = useUserByUsername(username);
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
      <div style={{ minHeight: '100dvh', background: '#F8FAFC', padding: '80px 16px', color: '#64748B', fontSize: 13 }}>
        Loading…
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ minHeight: '100dvh', background: '#F8FAFC', padding: '80px 16px', color: '#64748B', fontSize: 13 }}>
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
