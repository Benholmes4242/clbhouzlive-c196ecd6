import React from 'react';

interface NetflixHeroBannerProps {
  course: any;
  className?: string;
  onClick?: (course: any) => void;
}

const NetflixHeroBanner: React.FC<NetflixHeroBannerProps> = ({
  course,
  className = '',
  onClick
}) => {
  const golfCourse = course.golf_courses || course;
  
  // Get famous course phrases
  const getFamousPhrase = (courseName: string, country?: string) => {
    const name = courseName.toLowerCase();
    
    if (name.includes('st andrews') || name.includes('old course')) {
      return "The Home of Golf";
    }
    if (name.includes('augusta') || name.includes('masters')) {
      return "A Tradition Unlike Any Other";
    }
    if (name.includes('pebble beach')) {
      return "America's Greatest Meeting of Land and Sea";
    }
    if (name.includes('royal birkdale')) {
      return "Championship Links Golf at its Finest";
    }
    if (name.includes('carnoustie')) {
      return "The Most Challenging Links Course";
    }
    if (name.includes('muirfield')) {
      return "The Fairest of All Championship Tests";
    }
    if (name.includes('royal troon')) {
      return "Where Golf Meets the Sea";
    }
    if (name.includes('turnberry')) {
      return "Legendary Championship Golf";
    }
    if (name.includes('winged foot')) {
      return "Where Champions are Made";
    }
    if (name.includes('oakmont')) {
      return "The Ultimate Test of Golf";
    }
    if (name.includes('bethpage')) {
      return "The People's Country Club";
    }
    if (name.includes('royal county down')) {
      return "Where the Mountains of Mourne Sweep Down to the Sea";
    }
    if (name.includes('ballybunion')) {
      return "Golf as Nature Intended";
    }
    if (name.includes('royal portrush')) {
      return "Links Golf at the Edge of the World";
    }
    if (name.includes('shinnecock')) {
      return "America's Oldest Golf Club";
    }
    if (name.includes('cypress point')) {
      return "The Crown Jewel of Golf";
    }
    if (name.includes('pine valley')) {
      return "The Ultimate Golf Challenge";
    }
    
    // Regional defaults
    if (country === 'Scotland' || country === 'United Kingdom') {
      return "Scottish Links Tradition";
    }
    if (country === 'Ireland') {
      return "Emerald Isle Golf";
    }
    if (country === 'United States' || country === 'USA') {
      return "Championship American Golf";
    }
    
    return "Championship Golf Course";
  };

  const phrase = getFamousPhrase(golfCourse.name, golfCourse.country);
  
  // Use user's review as subtext if available, otherwise use famous phrase
  const subText = course.review && course.review.trim() ? course.review.trim() : phrase;

  // Debug logging for image data
  console.log('Hero Banner Course Data:', {
    courseName: golfCourse.name,
    thumbnail_url: golfCourse.thumbnail_url,
    image_url: golfCourse.image_url,
    thumbnail_image: golfCourse.thumbnail_image,
    review: course.review,
    subText: subText,
    fullCourseData: golfCourse
  });

  const imageUrl = golfCourse.thumbnail_url || golfCourse.image_url || golfCourse.thumbnail_image || '/placeholder.svg';
  console.log('Final image URL:', imageUrl);

  return (
    <div 
      className={`relative w-full h-40 md:h-48 lg:h-56 rounded-2xl overflow-hidden cursor-pointer group ${className}`}
      onClick={() => onClick?.(course)}
    >
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
        style={{
          backgroundImage: `url(${imageUrl})`
        }}
      />
      
      {/* Sophisticated Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
      
      {/* Content Container - moved down more */}
      <div className="absolute inset-0 flex flex-col justify-end pb-4 md:pb-6 lg:pb-8 px-6 md:px-8 lg:px-12">
        <div className="max-w-2xl">
          {/* Course Name */}
          <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-1 md:mb-2 leading-tight tracking-tight">
            {golfCourse.name}
          </h2>
          
          {/* User Review or Famous Phrase */}
          <p className="text-base md:text-lg lg:text-xl text-white/90 italic font-light leading-relaxed tracking-wide">
            {subText}
          </p>
          
          {/* Location */}
          {golfCourse.location && (
            <p className="text-xs md:text-sm text-white/70 mt-1 font-medium">
              {golfCourse.location}
            </p>
          )}
        </div>
      </div>
      
      {/* Subtle border glow on hover */}
      <div className="absolute inset-0 rounded-2xl ring-1 ring-white/10 group-hover:ring-white/20 transition-all duration-300" />
    </div>
  );
};

export default NetflixHeroBanner;