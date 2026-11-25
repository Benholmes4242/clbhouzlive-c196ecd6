/** Brief 25 B5: team-only business routes (invite, Insights, Your courses)
 * send a not-live club back to its profile with replace. Edit stays open.
 * Renders its child until the status is known so live clubs never flash. */
import type { ReactNode } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useBusinessProfile } from '@/hooks/useBusinessProfile';
import { isListingLive } from './listingStatus';

export function NotLiveBusinessRedirect({ children }: { children: ReactNode }) {
  const params = useParams();
  const id = params.id ?? params.businessId;
  const { data } = useBusinessProfile(id);
  if (id && data && !isListingLive(data as { listing_status?: string | null })) return <Navigate to={`/business/${id}`} replace />;
  return <>{children}</>;
}
