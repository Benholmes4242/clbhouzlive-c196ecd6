import React from 'react';
import RegionalCoursesList from '@/components/profile/RegionalCoursesList';

interface CoursesPlayedSectionProps {
  userId?: string;
  isOwnProfile?: boolean;
}

const CoursesPlayedSection: React.FC<CoursesPlayedSectionProps> = ({ 
  userId = '',
  isOwnProfile = false 
}) => {
  return (
    <div className="w-full px-4 pt-6 pb-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg sm:text-xl md:text-2xl lg:text-2xl xl:text-2xl text-foreground">
            Courses Played
          </h3>
        </div>
        
        {/* Regional Carousels */}
        <div className="space-y-8">
          
          {/* Worldwide Section */}
          <RegionalCoursesList 
            userId={userId || ''}
            region="global"
            title="Worldwide"
            isOwnProfile={isOwnProfile}
          />
          
          {/* Great Britain & Ireland Section */}
          <RegionalCoursesList 
            userId={userId || ''}
            region="britain-ireland"
            title="Great Britain & Ireland"
            isOwnProfile={isOwnProfile}
          />
          
          {/* Continental Europe Section */}
          <RegionalCoursesList 
            userId={userId || ''}
            region="europe"
            title="Continental Europe"
            isOwnProfile={isOwnProfile}
          />
          
          {/* USA Section */}
          <RegionalCoursesList 
            userId={userId || ''}
            region="usa"
            title="USA"
            isOwnProfile={isOwnProfile}
          />
          
        </div>
      </div>
    </div>
  );
};

export default CoursesPlayedSection;