import React from 'react';
import CountryFlag from '@/components/ui/country-flag';

interface Course {
  country: string;
  region?: string;
  sub_country?: string;
}

interface CourseCardLocationProps {
  course: Course;
  mobileTextScale?: 'small' | 'normal';
  mobileFlagSize?: 'sm' | 'md' | 'lg';
}

// Helper function to get the country for flag display
const getCountryForFlag = (course: Course) => {
  // For GB&I and Continental Europe, use sub_country if available
  if (course.country === 'Britain & Ireland' || course.country === 'Continental Europe') {
    return course.sub_country || course.region || course.country;
  }
  
  // For USA and other countries, use the country field
  return course.country;
};

// Helper function to get the location text to display
const getLocationText = (course: Course) => {
  // For GB&I and Continental Europe, ALWAYS use sub_country if it exists
  if (course.country === 'Britain & Ireland' || course.country === 'Continental Europe') {
    if (course.sub_country) {
      return course.sub_country; // This will be "Portugal", "Spain", "England", etc.
    }
    return course.region || course.country;
  }
  
  // For USA and other countries, use the country field
  return course.country;
};

const CourseCardLocation: React.FC<CourseCardLocationProps> = ({ 
  course, 
  mobileTextScale = 'normal',
  mobileFlagSize = 'lg'
}) => {
  return (
    <div className={`flex items-center text-white/90 ${mobileTextScale === 'small' ? 'text-heading-md' : 'text-heading-lg'} font-normal leading-snug drop-shadow-lg`}>
      <CountryFlag 
        country={getCountryForFlag(course)} 
        size={mobileFlagSize}
        className="mr-2 flex-shrink-0" 
      />
      <span style={{ transform: 'translateY(2px)' }}>{getLocationText(course)}</span>
    </div>
  );
};

export default React.memo(CourseCardLocation);