/**
 * BRIEF_COURSE_TAB_REBUILD §3.9 — WHERE IT IS, flat.
 *
 * The map card itself is UNTOUCHED (LocationMapCard is shared with the business
 * profile); what changed is that it now sits under the tab's section heading
 * with the place named as the meta, instead of floating in a padded block with
 * no title at all. Nearby pins still come from the same cached read the Nearby
 * section uses, so no extra request is made.
 *
 * THE THREE STATES, together:
 *   coordinates resolving — a skeleton the size of the card, so nothing jumps.
 *   resolved — the map.
 *   unresolvable — one plain sentence. A course with no coordinates is a fact
 *   about our data, not an error to dress up.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Skeleton } from '@/components/ui/skeleton';
import { LocationMapCard } from '@/components/map';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import AboutSection from './AboutSection';

export interface NearbyPin {
  id: string;
  name: string;
  slug: string;
  lat: number;
  lng: number;
  category?: string;
}

interface WhereItIsProps {
  courseName: string;
  locationText: string;
  coords: { lat: number; lng: number } | null;
  coordsLoading: boolean;
  nearby: NearbyPin[];
}

const WhereItIs: React.FC<WhereItIsProps> = ({
  courseName,
  locationText,
  coords,
  coordsLoading,
  nearby,
}) => {
  const { t } = useTranslation('courses');

  return (
    <AboutSection heading={t('courseDetail.sections.whereItIs')} meta={locationText || null}>
      {coordsLoading && !coords ? <Skeleton className="w-full h-[180px] rounded-xl" /> : null}

      {coords ? (
        <LocationMapCard
          lat={coords.lat}
          lng={coords.lng}
          name={courseName}
          locationText={locationText}
          colorful
          nearby={nearby}
        />
      ) : null}

      {/* eslint-disable-next-line settled/no-not-loading-empty-check -- coordsLoading comes from a plain geocode hook, not a gated React Query. */}
      {!coords && !coordsLoading ? (
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: A.MUTE, fontFamily: SANS }}>
          {t('courseDetail.about.locationUnavailable')}
        </p>
      ) : null}
    </AboutSection>
  );
};

export default WhereItIs;
