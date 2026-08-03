/**
 * RivalryCompareRedirect - the rivalry page is gone; its two routes survive
 * as redirects because game notifications deep-link into them.
 *
 *   /handicap/rivalry/:rivalUserId
 *     -> /handicap?compare=:rivalUserId
 *   /handicap/:friendUserId/rivalry/:rivalUserId
 *     -> /handicap/:friendUserId?compare=:rivalUserId
 *
 * The compare sheet reads ?compare= on mount, opens itself and selects that
 * player, so the deep link keeps landing on the same fact it always did.
 * `replace` keeps the legacy URL out of the back stack.
 */
import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

const RivalryCompareRedirect: React.FC = () => {
  const { rivalUserId, friendUserId } = useParams<{
    rivalUserId?: string;
    friendUserId?: string;
  }>();

  const base = friendUserId ? `/handicap/${friendUserId}` : '/handicap';
  const to = rivalUserId
    ? `${base}?subtab=circle&compare=${encodeURIComponent(rivalUserId)}`
    : `${base}?subtab=circle`;

  return <Navigate to={to} replace />;
};

export default RivalryCompareRedirect;
