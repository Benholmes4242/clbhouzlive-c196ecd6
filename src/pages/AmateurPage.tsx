import { useEffect } from 'react';

import { AppHeader } from '@/components/chrome/AppHeader';
import { AmateurHero } from '@/features/amateur/AmateurHero';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { analyticsEvents } from '@/utils/analyticsEvents';

/**
 * THE AMATEUR PAGE (BRIEF_AMATEUR_PAGE).
 *
 * One page, one scroll, no tabs. This commit lands the SHELL, the HEADER and
 * the HERO only; the four blocks (leaderboard, courses, amateur news, media)
 * arrive one at a time beneath the hero.
 *
 * The route is immersive, so `.app-shell` pays nothing and the header pays the
 * notch itself while the hero runs full bleed underneath it.
 */
export default function AmateurPage() {
  const { user } = useSupabaseSession();

  useEffect(() => {
    analyticsEvents.track('amateur_page_viewed', {});
  }, []);

  return (
    <div style={{ background: A.CANVAS, minHeight: '100dvh', fontFamily: SANS }}>
      <AppHeader inset="self" overHero heightVar="--amateur-header-h" />
      <AmateurHero userId={user?.id} />
      {/* Blocks 1-4 land here, in order. */}
      <div style={{ paddingBottom: 88 }} />
    </div>
  );
}
