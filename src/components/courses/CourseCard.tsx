import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CourseRankBadges from './CourseRankBadges';
import CountryFlag from '@/components/ui/country-flag';

interface Course {
  id: string;
  name: string;
  country: string;
  region?: string;
  sub_country?: string;
  continent?: string;
  global_rank?: number | null;
  regional_rank?: number | null;
  usa_rank?: number | null;
  description?: string;
  thumbnail_image?: string;
  latitude?: number | null;
  longitude?: number | null;
  website_url?: string | null;
}

interface CourseCardProps {
  course: Course;
  viewContext?: 'global' | 'regional' | 'usa' | 'europe';
  viewingUserId?: string;
  userRating?: number | null;
  isReadOnly?: boolean;
  showUserRating?: boolean;
  isFromUserCoursesPage?: boolean;
  xp?: number;
  showXP?: boolean;
  customHeight?: string;
  hideRankingBadges?: boolean;
  showCountryWithFlag?: boolean;
}

// Helper function to format description text with line breaks
const formatDescription = (description: string) => {
  return (
    <span>
      {description
        .split('\n')
        .map((line, index, array) => {
          // Extract only valid Fragment props (key and children)
          const fragmentProps = { key: index };
          return (
            <span key={index}>
              {line}
              {index < array.length - 1 && <br />}
            </span>
          );
        })}
    </span>
  );
};

const formatLocation = (course: Course) => {
  // For GB&I and Continental Europe, use sub_country (like "Portugal") 
  if (course.country === 'Britain & Ireland' || course.country === 'Continental Europe') {
    return course.sub_country || course.region || course.country;
  }
  
  // For USA and other countries, use the country field
  return course.country;
};

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
  // For GB&I and Continental Europe, use sub_country (like "Portugal") 
  if (course.country === 'Britain & Ireland' || course.country === 'Continental Europe') {
    return course.sub_country || course.region || course.country;
  }
  
  // For USA and other countries, use the country field
  return course.country;
};

const CourseCard: React.FC<CourseCardProps> = ({ 
  course, 
  viewContext = 'global', 
  viewingUserId,
  userRating,
  isReadOnly = false,
  showUserRating = false,
  isFromUserCoursesPage = false,
  xp,
  showXP = false,
  customHeight = "h-64",
  hideRankingBadges = false,
  showCountryWithFlag = false
}) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/courses/${course.id}`);
  };

  return (
    <>
      <div 
        className={`group hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden relative ${customHeight}`}
        style={{ borderRadius: '8px' }}
        onClick={handleCardClick}
      >
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: course.thumbnail_image 
              ? `url(${course.thumbnail_image})`
              : `url('https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop')`
          }}
        >
          {/* Gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>

        {/* Course ranking badges - positioned at top-left - conditionally hide */}
        {!hideRankingBadges && (
          <CourseRankBadges
            globalRank={course.global_rank}
            regionalRank={course.regional_rank}
            usaRank={course.usa_rank}
            country={course.country}
            viewContext={viewContext}
            userRating={userRating}
            showUserRating={showUserRating}
            positioning="top-left"
            xp={xp}
            showXP={showXP}
          />
        )}

        {/* Course Information Overlay - positioned at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {/* XP earned - show above course name */}
          {showXP && xp && (
            <div className="text-2xl text-white/90 leading-tight mb-1 drop-shadow-lg">
              + {xp} XP
            </div>
          )}
          
          {/* Course Name */}
          <h3 className={`text-3xl text-white leading-tight mb-0 drop-shadow-lg group-hover:text-white/80 transition-colors ${hideRankingBadges ? '' : 'font-bold'}`}>
            {course.name}
          </h3>
          
          {/* Location with map pin OR country with flag */}
          <div className="flex items-center text-white/90 text-2xl leading-relaxed drop-shadow-lg">
            {showCountryWithFlag ? (
              <>
                <CountryFlag 
                  country={getCountryForFlag(course)} 
                  className="h-5 w-5 mr-2 flex-shrink-0" 
                />
                <span className="flex items-center">{getLocationText(course)}</span>
              </>
            ) : (
              <>
                <MapPin className="h-5 w-5 mr-2 flex-shrink-0" />
                <span>{formatLocation(course)}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CourseCard;
