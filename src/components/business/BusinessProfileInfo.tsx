/**
 * BusinessProfileInfo - Apple-led Info Tab
 * 
 * Sections:
 * 1. Hero Identity (full-width with gradient overlay)
 * 2. At-a-Glance Strip (horizontal scroll)
 * 3. About/Story Module (collapsible)
 * 4. Highlights/Capabilities Pills
 * 5. Location (immersive dark map)
 * 6. Contact Actions (unified row)
 * 7. Trust & Status Footer
 */
import React from 'react';
import { BusinessProfile } from '@/hooks/useBusinessProfile';
import { InfoHeroIdentity } from './info/InfoHeroIdentity';
import { InfoAtGlanceStrip } from './info/InfoAtGlanceStrip';
import { InfoStoryModule } from './info/InfoStoryModule';
import { InfoHighlightsPills } from './info/InfoHighlightsPills';
import { InfoLocationSection } from './info/InfoLocationSection';
import { InfoContactActions } from './info/InfoContactActions';
import { InfoTrustFooter } from './info/InfoTrustFooter';

interface BusinessProfileInfoProps {
  business: BusinessProfile;
}

export function BusinessProfileInfo({ business }: BusinessProfileInfoProps) {
  return (
    <div className="space-y-6 pb-8">
      {/* 1. Hero Identity */}
      <InfoHeroIdentity business={business} />
      
      {/* 2. At-a-Glance Strip */}
      <InfoAtGlanceStrip business={business} />
      
      {/* Content sections with padding */}
      <div className="space-y-6 px-0">
        {/* 3. About/Story Module */}
        <InfoStoryModule business={business} />
        
        {/* 4. Highlights/Capabilities Pills */}
        <InfoHighlightsPills business={business} />
        
        {/* 5. Location (Immersive) */}
        <InfoLocationSection business={business} />
        
        {/* 6. Contact Actions */}
        <InfoContactActions business={business} />
        
        {/* 7. Trust & Status Footer */}
        <InfoTrustFooter business={business} />
      </div>
    </div>
  );
}
