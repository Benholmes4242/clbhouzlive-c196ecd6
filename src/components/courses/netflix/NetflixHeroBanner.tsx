import React from 'react';
import { useNavigate } from 'react-router-dom';

interface NetflixHeroBannerProps {
  course: any;
  targetUserId?: string;
  isOwnProfile: boolean;
}

const NetflixHeroBanner: React.FC<NetflixHeroBannerProps> = ({
  course,
  targetUserId,
  isOwnProfile
}) => {
  const navigate = useNavigate();

  if (!course?.golf_courses) return null;

  const golfCourse = course.golf_courses;

  const handleClick = () => {
    navigate(`/courses/${golfCourse.id}`);
  };

  // Get a descriptive phrase for the course
  const getCoursePhrase = (courseName: string, description?: string) => {
    // Common golf course phrases based on famous courses
    const famousCourses: Record<string, string> = {
      'St. Andrews Old Course': 'The Home of Golf',
      'St Andrews Old Course': 'The Home of Golf',
      'Augusta National Golf Club': 'A Tradition Unlike Any Other',
      'Pebble Beach Golf Links': 'The Greatest Meeting of Land and Sea',
      'Pinehurst No. 2': 'The Cradle of American Golf',
      'Royal St. Georges Golf Club': 'Where Champions Are Made',
      'Royal Birkdale Golf Club': 'Links Golf at its Finest',
      'Trump Turnberry Resort - Ailsa': 'Majesty by the Sea',
      'Royal Troon Golf Club': 'The Postage Stamp Course'
    };

    // Check if it's a famous course
    const phrase = famousCourses[courseName];
    if (phrase) return phrase;

    // Extract from description if available
    if (description && description.length > 20) {
      // Take first sentence or up to 60 characters
      const firstSentence = description.split('.')[0];
      if (firstSentence.length <= 60) {
        return firstSentence;
      }
      return description.substring(0, 57) + '...';
    }

    // Default phrases based on course characteristics
    if (courseName.toLowerCase().includes('royal')) {
      return 'Royal Links Heritage';
    }
    if (courseName.toLowerCase().includes('old')) {
      return 'Timeless Tradition';
    }
    if (courseName.toLowerCase().includes('beach') || courseName.toLowerCase().includes('bay')) {
      return 'Coastal Championship Golf';
    }
    if (courseName.toLowerCase().includes('national')) {
      return 'Championship Caliber';
    }
    
    return 'World-Class Golf Experience';
  };

  const coursePhrase = getCoursePhrase(golfCourse.name, golfCourse.description);

  return (
    <button
      onClick={handleClick}
      className="relative w-full h-96 md:h-[28rem] rounded-lg overflow-hidden group hover:scale-[1.02] transition-all duration-500"
    >
      {/* Hero Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: golfCourse.thumbnail_image 
            ? `url(${golfCourse.thumbnail_image})`
            : 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
        }}
      />
      
      {/* Dark gradient overlay for better text contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
      
      {/* Content overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
        <div className="max-w-2xl">
          {/* Course Name */}
          <h1 className="text-white font-bold text-3xl md:text-5xl mb-4 leading-tight">
            {golfCourse.name}
          </h1>
          
          {/* Course Phrase */}
          <p className="text-white/90 text-lg md:text-xl italic font-light leading-relaxed">
            {coursePhrase}
          </p>
        </div>
      </div>
    </button>
  );
};

export default NetflixHeroBanner;