import React from 'react';
import WorldwideConditionalSection from './WorldwideSection';
import USAConditionalSection from './USASection';
import GreatBritainIrelandConditionalSection from './GreatBritainIrelandSection';
import ContinentalEuropeConditionalSection from './ContinentalEuropeSection';
import type { CoursesbyRegionSectionProps } from '../types';

const CoursesbyRegionSection: React.FC<CoursesbyRegionSectionProps> = ({ 
  userId,
  isOwnProfile = false,
  userDisplayName
}) => {
  return (
    <section className="w-full fullbleed md:mx-auto md:px-0 pt-0 pb-8 mb-0" data-section="courses-by-region">
      <div className="max-w-none md:max-w-6xl md:mx-auto">
      </div>
      
      {/* Reordered sections: Worldwide, USA, Great Britain & Ireland, Continental Europe */}
      <WorldwideConditionalSection userId={userId} isOwnProfile={isOwnProfile} userDisplayName={userDisplayName} />
      <USAConditionalSection userId={userId} isOwnProfile={isOwnProfile} userDisplayName={userDisplayName} />
      <GreatBritainIrelandConditionalSection userId={userId} isOwnProfile={isOwnProfile} userDisplayName={userDisplayName} />
      <ContinentalEuropeConditionalSection userId={userId} isOwnProfile={isOwnProfile} userDisplayName={userDisplayName} />
    </section>
  );
};

export default React.memo(CoursesbyRegionSection);
