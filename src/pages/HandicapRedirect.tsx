/**
 * /handicap and /handicap/:userId - RETIRED PAGES, SURVIVING AS REDIRECTS.
 *
 * The handicap surface is now the self-only Handicap tab on /profile. These
 * routes stay because delivered pushes and gam_notification_outbox rows carry
 * stored /handicap destinations that cannot be rewritten retrospectively.
 *
 *   /handicap[?params]          -> /profile?tab=handicap[&params]
 *   /handicap/{selfId}[?params] -> /profile?tab=handicap[&params]
 *   /handicap/{otherId}         -> compareRouteFor(otherId), sheet open.
 *                                  Another member's handicap is private.
 *
 * Every hop uses replace so back never bounces into a redirect.
 */
import React from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { compareRouteFor } from '@/components/friend-sheet/useMemberTapResolver';
import { handicapTabRoute } from '@/lib/handicap/handicapTabRoute';

const HandicapRedirect: React.FC = () => {
  const { userId } = useParams<{ userId?: string }>();
  const [searchParams] = useSearchParams();
  const { user, loading } = useSupabaseSession();

  if (!userId) return <Navigate to={handicapTabRoute(searchParams)} replace />;
  if (loading) return null;
  if (!user?.id) return <Navigate to="/auth" replace />;
  if (userId === user.id) return <Navigate to={handicapTabRoute(searchParams)} replace />;
  return <Navigate to={compareRouteFor(userId)} replace />;
};

export default HandicapRedirect;
