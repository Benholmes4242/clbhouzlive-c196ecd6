/**
 * SocialListV2TestPage — test route host for the Circle rebuild.
 *
 * Resolves :username → profile row via useUserByUsername and mounts
 * SocialListPage. Cutover happens in F3 (not registered in chunkLoaders
 * yet, per Brief F2 §5).
 */

import { useParams, useSearchParams } from 'react-router-dom';
import { useUserByUsername } from '@/hooks/useUserByUsername';
import SocialListPage from './SocialListPage';

export default function SocialListV2TestPage() {
  const { username } = useParams<{ username: string }>();
  const [search] = useSearchParams();
  const tab = search.get('tab') === 'following' ? 'following' : 'followers';
  const { data: profile, isLoading } = useUserByUsername(username);

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          background: '#F8FAFC',
          padding: '80px 16px',
          color: '#64748B',
          fontSize: 13,
        }}
      >
        Loading…
      </div>
    );
  }

  if (!profile) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          background: '#F8FAFC',
          padding: '80px 16px',
          color: '#64748B',
          fontSize: 13,
        }}
      >
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
      initialTab={tab}
    />
  );
}
