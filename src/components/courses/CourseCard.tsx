import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CourseRankBadges from './CourseRankBadges';
import CountryFlag from '@/components/ui/country-flag';
import { supabase } from '@/integrations/supabase/client';
import { callEdgeFunctionDebounced } from '@/utils/edgeFunctionHelper';

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
  average_rating?: number | null;
}

interface CourseCardProps {
  course: Course;
  viewContext?: 'global' | 'regional' | 'usa' | 'europe';
  viewingUserId?: string;
  userRating?: number | null;
  isReadOnly?: boolean;
  showUserRating?: boolean;
  showAverageRating?: boolean;
  isFromUserCoursesPage?: boolean;
  xp?: number;
  showXP?: boolean;
  customHeight?: string;
  hideRankingBadges?: boolean;
  showCountryWithFlag?: boolean;
  showAIQuote?: boolean;
  disableClick?: boolean;
  mobileTextScale?: 'small' | 'normal';
  mobileFlagSize?: 'sm' | 'md' | 'lg';
  showRatingOnRight?: boolean;
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

const CourseCard: React.FC<CourseCardProps> = ({ 
  course, 
  viewContext = 'global', 
  viewingUserId,
  userRating,
  isReadOnly = false,
  showUserRating = false,
  showAverageRating = false,
  isFromUserCoursesPage = false,
  xp,
  showXP = false,
  customHeight = "h-64",
  hideRankingBadges = false,
  showCountryWithFlag = false,
  showAIQuote = false,
  disableClick = false,
  mobileTextScale = 'normal',
  mobileFlagSize = 'lg',
  showRatingOnRight = false
}) => {
  const navigate = useNavigate();
  const [courseQuote, setCourseQuote] = useState<string>('');

  // Generate AI quote for course
  useEffect(() => {
    if (showAIQuote && course.name) {
      const generateQuote = async () => {
        try {
          const debounceKey = `quote-${course.name}-${course.country}`;
          
          const data = await callEdgeFunctionDebounced(
            'generate-course-quote',
            { 
              courseName: course.name,
              country: course.country 
            },
            debounceKey,
            2000, // 2 second debounce for quotes
            { timeout: 8000, retries: 1 }
          );

          setCourseQuote(data?.quote || 'A golf experience like no other');
        } catch (error) {
          console.error('Error calling quote function:', error);
          setCourseQuote('A golf experience like no other');
        }
      };

      generateQuote();
    }
  }, [showAIQuote, course.name, course.country]);

  const handleCardClick = () => {
    if (!disableClick) {
      navigate(`/courses/${course.id}`);
    }
  };

  return (
    <>
      <div 
        className={`group hover:shadow-lg transition-all duration-200 ${disableClick ? 'cursor-default' : 'cursor-pointer'} overflow-hidden relative ${customHeight}`}
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
        {!hideRankingBadges && !showRatingOnRight && (
          <CourseRankBadges
            globalRank={course.global_rank}
            regionalRank={course.regional_rank}
            usaRank={course.usa_rank}
            country={course.country}
            viewContext={viewContext}
            userRating={userRating}
            showUserRating={showUserRating}
            averageRating={course.average_rating}
            showAverageRating={showAverageRating}
            positioning="top-left"
            xp={xp}
            showXP={showXP}
          />
        )}


        {/* Course Information Overlay - positioned at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {/* XP earned - show above course name */}
          {showXP && xp && (
            <div className={`${mobileTextScale === 'small' ? 'text-lg md:text-2xl' : 'text-2xl'} text-white/90 leading-tight mb-1 drop-shadow-lg`}>
              + {xp} XP
            </div>
          )}
          
           {/* Course Name - moved up when showing rating badges */}
           <h3 className={`${mobileTextScale === 'small' ? 'text-xl md:text-3xl' : 'text-3xl'} text-white leading-tight ${showRatingOnRight ? 'mb-0' : 'mb-0'} drop-shadow-lg group-hover:text-white/80 transition-colors`}>
             {course.name}
           </h3>
          
          {/* AI Quote or Location or Ranking Badges */}
          {showAIQuote ? (
            <div className={`text-white/90 ${mobileTextScale === 'small' ? 'text-lg md:text-2xl' : 'text-2xl'} leading-relaxed drop-shadow-lg italic`}>
              {courseQuote || 'A golf experience like no other'}
            </div>
           ) : showRatingOnRight ? (
             // Show ranking badges and average rating for Top 10 Rated cards
             <div className="flex items-center justify-between">
               <div className="flex flex-wrap gap-2 -ml-1">
                <CourseRankBadges
                  globalRank={course.global_rank}
                  regionalRank={course.regional_rank}
                  usaRank={course.usa_rank}
                  country={course.country}
                  positioning="bottom-left"
                  showUserRating={false}
                  averageRating={course.average_rating}
                  showAverageRating={true}
                  showXP={false}
                />
              </div>
              {/* User Rating in liquid glass container */}
              {userRating && showUserRating && (
                <div className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg shadow-lg shadow-black/20 overflow-hidden backdrop-blur-md border border-white/20" style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
                  <div className="relative z-10 flex items-center gap-1.5">
                    <span className="text-sm font-bold text-white">{userRating}/10</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className={`flex items-center text-white/90 ${mobileTextScale === 'small' ? 'text-lg md:text-2xl' : 'text-2xl'} drop-shadow-lg`}>
              {showCountryWithFlag ? (
                <>
                  <CountryFlag 
                    country={getCountryForFlag(course)} 
                    size={mobileFlagSize}
                    className="mr-2 flex-shrink-0" 
                  />
                  <span style={{ transform: 'translateY(2px)' }}>{getLocationText(course)}</span>
                </>
              ) : (
                <div className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg shadow-lg shadow-black/20 overflow-hidden backdrop-blur-md border border-white/20" style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
                  <div className="relative z-10 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 flex-shrink-0 text-white" />
                    <span className="text-sm font-medium text-white">{formatLocation(course)}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CourseCard;
