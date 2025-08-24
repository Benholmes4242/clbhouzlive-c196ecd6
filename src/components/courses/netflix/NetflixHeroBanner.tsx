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
    // Famous golf course phrases
    const famousCourses: Record<string, string> = {
      "St. Andrews Old Course": "The Home of Golf",
      "St Andrews Old Course": "The Home of Golf", 
      "Augusta National Golf Club": "A Tradition Unlike Any Other",
      "Pebble Beach Golf Links": "The Greatest Meeting of Land and Sea",
      "Pinehurst No. 2": "The Cradle of American Golf",
      "Royal St. Georges Golf Club": "Where Champions Are Made",
      "Royal Birkdale Golf Club": "Links Golf at its Finest",
      "Trump Turnberry Resort - Ailsa": "Majesty by the Sea",
      "Royal Troon Golf Club": "The Postage Stamp Course",
      "Carnoustie Golf Links": "Golf's Greatest Test",
      "Muirfield": "The Honourable Company",
      "Royal Liverpool Golf Club": "Hoylake's Historic Links",
      "Royal Portrush Golf Club": "Ireland's Royal Links",
      "Bethpage Black": "The People's Country Club",
      "Torrey Pines": "Golf by the Pacific",
      "TPC Sawgrass": "The Players Stadium"
    };

    // Check if it's a famous course first
    const phrase = famousCourses[courseName];
    if (phrase) return phrase;

    // Extract meaningful phrase from description
    if (description && description.length > 20) {
      const sentences = description.split('.').filter(s => s.trim().length > 0);
      if (sentences.length > 0) {
        const firstSentence = sentences[0].trim();
        if (firstSentence.length <= 80) {
          return firstSentence;
        }
        return firstSentence.substring(0, 77) + "...";
      }
    }

    // Intelligent fallbacks based on course name characteristics
    const lowerName = courseName.toLowerCase();
    
    if (lowerName.includes("royal") && lowerName.includes("st")) {
      return "Royal Scottish Heritage";
    }
    if (lowerName.includes("royal")) {
      return "Royal Links Tradition";
    }
    if (lowerName.includes("old course") || lowerName.includes("old")) {
      return "Timeless Championship Golf";
    }
    if (lowerName.includes("beach") || lowerName.includes("ocean") || lowerName.includes("sea")) {
      return "Championship Golf by the Sea";
    }
    if (lowerName.includes("national")) {
      return "National Championship Venue";
    }
    if (lowerName.includes("country club")) {
      return "Exclusive Championship Golf";
    }
    if (lowerName.includes("links")) {
      return "Traditional Links Golf";
    }
    
    return "World-Class Golf Experience";
  };

  const coursePhrase = getCoursePhrase(golfCourse.name, golfCourse.description);

  return (
    <div className="w-full px-4">
      <button
        onClick={handleClick}
        className="relative w-full h-80 md:h-96 lg:h-[32rem] rounded-xl overflow-hidden group hover:scale-[1.01] transition-all duration-700 shadow-2xl"
      >
        {/* Hero Image with Ken Burns effect */}
        <div 
          className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-[3000ms] ease-out"
          style={{
            backgroundImage: golfCourse.thumbnail_image 
              ? `url(${golfCourse.thumbnail_image})`
              : "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)"
          }}
        />
        
        {/* Sophisticated gradient overlay for optimal text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/20" />
      
        {/* Content overlay with improved typography */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 lg:p-12">
          <div className="max-w-4xl">
            {/* Course Name with dramatic typography */}
            <h1 className="text-white font-bold text-2xl sm:text-3xl md:text-5xl lg:text-6xl mb-3 md:mb-6 leading-tight tracking-tight drop-shadow-lg">
              {golfCourse.name}
            </h1>
            
            {/* Course Phrase with elegant styling */}
            <p className="text-white/95 text-base sm:text-lg md:text-xl lg:text-2xl italic font-light leading-relaxed tracking-wide drop-shadow-md max-w-3xl">
              "{coursePhrase}"
            </p>
          </div>
        </div>
      </button>
    </div>
  );
};

export default NetflixHeroBanner;