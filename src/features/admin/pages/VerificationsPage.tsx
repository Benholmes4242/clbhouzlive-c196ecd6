import React, { useEffect } from 'react';
import { useVerifications } from '../hooks/useVerifications';
import { VerificationsTab } from '../components/VerificationsReview';

/**
 * Top-level admin section for verification review (business, course claims,
 * golfer invites). Uses the shared VerificationsReview component so InboxPage
 * and this page render identical UI without depending on UsersPage.
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
