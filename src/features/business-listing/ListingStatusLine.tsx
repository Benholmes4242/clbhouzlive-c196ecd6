/** Brief 24B B5/B6: the status line a non-live business shows in place of
 * its category in the account switcher and the owner's business lists. */
import { Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ListingStatus } from './listingStatus';

export function ListingStatusLine({ status }: { status: ListingStatus }) {
  const { t } = useTranslation('profile');
  if (status === 'live') return null;
  if (status === 'pending') return (
    <span data-listing-status="pending" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#F7931E', whiteSpace: 'nowrap' }}>
      <Clock size={12} strokeWidth={2} aria-hidden="true" />{t('businessPending.switcherPending', { defaultValue: 'Under review' })}
    </span>
  );
  return <span data-listing-status="rejected" style={{ fontSize: 12, color: 'rgba(248,250,252,0.62)', whiteSpace: 'nowrap' }}>{t('businessPending.switcherRejected', { defaultValue: 'Not approved' })}</span>;
}
