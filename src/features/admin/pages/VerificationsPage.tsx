import React, { useEffect } from 'react';
import { useVerifications } from '../hooks/useVerifications';
import { VerificationsTab } from './UsersPage';

/**
 * Top-level admin section for verification review (business, course claims,
 * golfer invites). Promoted out of the Users page so it has parity with
 * Support / Approvals / Appeals. Uses the existing VerificationsTab UI and
 * useVerifications queue - no behaviour change, just its own route/nav entry.
 */
export default function VerificationsPage() {
  const verifs = useVerifications();

  useEffect(() => {
    const handler = () => { verifs.refetch(); };
    window.addEventListener('admin-v2:refetch', handler);
    return () => window.removeEventListener('admin-v2:refetch', handler);
  }, [verifs]);

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1180, margin: '0 auto' }}>
      <VerificationsTab
        data={verifs.data}
        loading={verifs.isLoading}
        review={verifs.reviewMutation}
      />
    </div>
  );
}
