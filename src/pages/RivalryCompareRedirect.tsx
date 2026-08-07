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

  /**
   * BOTH LEGACY SHAPES NOW LAND ON THE VIEWER'S OWN CIRCLE, COMPARE OPEN.
   * The :friendUserId segment used to become the base path, which is another
   * member's handicap page - now private. Pointing the base there would only
   * make this redirect depend on a second redirect hop, so it is dropped: the
   * rival is the member the notification is about, and compare against them
   * reads the same fact from the viewer's own page.
   */
  void friendUserId;
  const to = rivalUserId
    ? `/handicap?subtab=circle&compare=${encodeURIComponent(rivalUserId)}`
    : '/handicap?subtab=circle';

  return <Navigate to={to} replace />;
};

export default RivalryCompareRedirect;
