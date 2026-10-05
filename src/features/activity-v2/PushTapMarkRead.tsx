import { useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { markNotificationRead } from './markNotificationRead';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * App-shell effect: a push tap deep-links with `?n=<notification_id>`
 * (process-push-queue). On any location change, read `n` once, strip it
 * from the URL (replace — never reaches a shared link, back can't re-fire),
 * then mark that notification read. Fails silently.
 */
export function PushTapMarkRead() {
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const qc = useQueryClient();

  useEffect(() => {
    const n = params.get('n');
    if (n === null) return;
    const next = new URLSearchParams(params);
    next.delete('n');
    setParams(next, { replace: true, preventScrollReset: true });
    if (!UUID_RE.test(n)) return;
    markNotificationRead(qc, n).catch(() => {});
    qc.invalidateQueries({ queryKey: ['activity-v2'] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  return null;
}
