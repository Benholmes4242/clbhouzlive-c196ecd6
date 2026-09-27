/**
 * RivalryCompareRedirect - the rivalry page is gone; its two routes survive
 * as redirects because game notifications deep-link into them.
 *
 *   /handicap/rivalry/:rivalUserId
 *   /handicap/:friendUserId/rivalry/:rivalUserId
 *     -> /profile?tab=handicap&compare=:rivalUserId
 *
 * The :friendUserId segment is dropped - another member's handicap is
 * private. The compare sheet reads ?compare= on mount and opens itself on
 * that player. `replace` keeps the legacy URL out of the back stack.
 */
import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { handicapTabRoute } from '@/lib/handicap/handicapTabRoute';

const RivalryCompareRedirect: React.FC = () => {
  const { rivalUserId, friendUserId } = useParams<{
    rivalUserId?: string;
    friendUserId?: string;
  }>();
  void friendUserId;
  const to = handicapTabRoute(rivalUserId ? { compare: rivalUserId } : null);
  return <Navigate to={to} replace />;
};

export default RivalryCompareRedirect;
