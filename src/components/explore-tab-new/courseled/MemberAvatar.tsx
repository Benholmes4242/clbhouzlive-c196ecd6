import { useTranslation } from 'react-i18next';

import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getInitialsFromName } from '@/lib/avatarFallback';

/**
 * The one member avatar on the Explore leaderboards screen (Phase 6.4).
 * Props describe a subject, never a board row. No default size: every caller
 * passes one of the existing values so two call sites cannot silently disagree.
 * Initials come from the member's real name only; a nameless member falls back
 * to the silhouette, never to initials of placeholder copy.
 */
export function MemberAvatar({
  userId,
  name,
  photoUrl,
  size,
}: {
  userId: string;
  name: string | null | undefined;
  photoUrl: string | null | undefined;
  size: number;
}) {
  const { t } = useTranslation('courses');
  return (
    <SquircleAvatar
      src={photoUrl ?? null}
      alt={name || t('discover.aMember')}
      userId={userId}
      fallback={getInitialsFromName(name).slice(0, 2)}
      size={size}
      hairlineRing
    />
  );
}
