/**
 * BusinessSocialListRoute — prod route host for business social lists (F3).
 *
 * Resolves :idOrSlug via useBusinessProfile (the same hook the legacy
 * BusinessFollowersPage used) and mounts SocialListPage with the business
 * actor. For business context, friend_status is NULL so PENDING/FRIENDS
 * sections naturally do not populate; EVERYONE + mutual context still work.
 */

import { useParams } from 'react-router-dom';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import SocialListPage, { ListSkeleton } from './SocialListPage';
import { A } from '@/features/courses/components/holes/analytical/tokens';

interface Props {
  direction: 'followers' | 'following';
}

export default function BusinessSocialListRoute({ direction }: Props) {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const { data: business, isLoading, error, refetch } = useBusinessProfile(idOrSlug);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100dvh', background: A.CANVAS, paddingTop: 'calc(var(--chrome-total-h, 0px) + 24px)' }}>
        <ListSkeleton />
      </div>
    );
  }

  const isNotFound = error instanceof Error && error.message === 'Business not found'; // Sentinel from useBusinessProfile - keep in sync (same pattern as BusinessProfilePage).

  if (error && !isNotFound) {
    return (
      <div style={{ minHeight: '100dvh', background: A.CANVAS, padding: 'calc(var(--chrome-total-h, 0px) + 24px) 16px 80px', color: A.BODY, fontSize: 13, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
        Couldn't load this business.
        <button type="button" onClick={() => refetch()} style={{ background: A.INK, color: A.CANVAS, border: 'none', borderRadius: 999, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          Retry
        </button>
      </div>
    );
  }

  if (!business) {
    return (
      <div style={{ minHeight: '100dvh', background: A.CANVAS, padding: 'calc(var(--chrome-total-h, 0px) + 24px) 16px 80px', color: A.BODY, fontSize: 13 }}>
        Business not found.
      </div>
    );
  }

  return (
    <SocialListPage
      profileActorType="business"
      profileActorId={business.id}
      profileUsername={business.slug ?? null}
      profileDisplayName={business.name ?? null}
      initialTab={direction}
    />
  );
}
