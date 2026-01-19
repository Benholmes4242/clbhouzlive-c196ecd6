import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Check, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ReviewWizard } from '../courses/review-wizard';
import CourseRankBadges from '../courses/CourseRankBadges';

interface Top100CourseCardProps {
  course: any;
  isPlayed: boolean;
  region: string;
  isOwnProfile?: boolean;
  onToggle?: () => void;
  userRating?: number | null;
  viewType?: 'cards' | 'list';
  userFirstName?: string;
}

// Helper function to format description text with line breaks
const formatDescription = (description: string) => {
  return description
    .split('\n')
    .map((line, index, array) => (
      <React.Fragment key={index}>
        {line}
        {index < array.length - 1 && <br />}
      </React.Fragment>
    ));
};

// Helper function to format location display
const formatLocation = (course: any) => {
  const parts = [];
  
  // Always start with country
  parts.push(course.country);
  
  // Add sub_country if it exists
  if (course.sub_country) {
    parts.push(course.sub_country);
  }
  
  // Add region if it exists and is different from country
  if (course.region && course.region !== course.country) {
    parts.push(course.region);
  }
  
  return parts.join(', ');
};

const Top100CourseCard: React.FC<Top100CourseCardProps> = ({
  course,
  isPlayed,
  region,
  isOwnProfile = false,
  onToggle,
  userRating,
  viewType = 'cards',
  userFirstName
}) => {
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [wasAlreadyPlayed, setWasAlreadyPlayed] = useState(false);
  const navigate = useNavigate();

  // Debug logging
  useEffect(() => {
    if (course.name === "Trump Turnberry Resort - Ailsa") {
      console.log('CourseRankBadges props for Trump Turnberry:', {
        userRating,
        showUserRating: !!userRating,
        positioning: "top-left"
      });
    }
  }, [userRating, course.name]);

  const handleCardClick = () => {
    if (!isOwnProfile) {
      // If viewing someone else's profile, navigate to course detail page
      navigate(`/courses/${course.id}`);
      return;
    }
    
    if (!onToggle) return;
    
    if (!isPlayed) {
      // If course is not currently played, mark as played and show rating modal for first time
      setWasAlreadyPlayed(false);
      onToggle();
      // Small delay to let the state update, then show rating modal
      setTimeout(() => {
        setShowRatingModal(true);
      }, 100);
    } else {
      // If already played, show the rating modal to edit existing rating
      setWasAlreadyPlayed(true);
      setShowRatingModal(true);
    }
  };


  // Check if this should render as list view
  if (viewType === 'list') {
    return (
      <>
         <div
           className="relative overflow-hidden transition-all duration-300 cursor-pointer aspect-[1.77/1]"
           style={{
             backgroundImage: `url(${course.thumbnail_image || 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'})`,
             backgroundSize: 'cover',
             backgroundPosition: 'center',
             backgroundRepeat: 'no-repeat'
          }}
          onClick={handleCardClick}
        >
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/20 z-10" />

          {/* My Highlights Badge */}
          <div className="absolute top-2 left-2 z-30">
            <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-full px-3 py-1.5 shadow-lg">
              <span className="text-black text-xs font-medium">
                {isOwnProfile ? "My Highlights" : `${userFirstName || "User"}'s Highlights`}
              </span>
            </div>
          </div>

          {/* Content overlay */}
          <div className="absolute inset-0 flex items-center justify-between p-4 z-20">
            <div className="flex-1 text-white">
              <h3 className="font-semibold text-lg md:text-xl leading-tight mb-1">
                {course.name}
              </h3>
              <div className="flex items-center text-sm md:text-base text-white/90">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{formatLocation(course)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Course ranking badges */}
              <CourseRankBadges
                globalRank={course.global_rank}
                regionalRank={course.regional_rank}
                usaRank={course.usa_rank}
                country={course.country}
                viewContext={region === 'britain-ireland' ? 'regional' : region === 'usa' ? 'usa' : region === 'europe' ? 'europe' : 'global'}
                userRating={userRating}
                showUserRating={!!userRating}
                positioning="top-left"
              />

              {/* Played Indicator */}
              {isPlayed && (
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                  <Check className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Hover overlay for own profile */}
          {isOwnProfile && !isPlayed && (
            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-200 flex items-center justify-center z-20">
              <div className="opacity-0 hover:opacity-100 transition-opacity duration-200 bg-white/90 rounded-full p-2">
                <Check className="h-5 w-5 text-green-600" />
              </div>
            </div>
          )}

          {/* Visual feedback for played state */}
          {isPlayed && (
            <div className="absolute inset-0 bg-green-500/10 pointer-events-none z-5" />
          )}
        </div>

        {/* Rating Modal - show for both new ratings and editing existing ones */}
        {showRatingModal && isOwnProfile && (
          <ReviewWizard
            course={{
              id: course.id,
              name: course.name,
              thumbnail_image: course.thumbnail_image
            }}
            isOpen={showRatingModal}
            onClose={() => setShowRatingModal(false)}
            isEditMode={wasAlreadyPlayed}
            onRemoveFromPlayed={onToggle}
          />
        )}
      </>
    );
  }

  // Cards view render (default)
  return (
    <>
      <div
        className={`relative border overflow-hidden transition-all duration-300 ${
          isPlayed 
            ? 'bg-green-50 border-green-200 shadow-md transform scale-[1.02]' 
            : 'bg-card hover:shadow-lg'
        } cursor-pointer`}
        onClick={handleCardClick}
      >
        {/* Course Image */}
        <div className="relative aspect-[1.77/1] overflow-hidden">
          <img
            src={course.thumbnail_image || 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'}
            alt={course.name}
            className="w-full h-full object-cover"
          />

          {/* My Highlights Badge */}
          <div className="absolute top-2 left-2 z-30">
            <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-full px-3 py-1.5 shadow-lg">
              <span className="text-black text-xs font-medium">
                {isOwnProfile ? "My Highlights" : `${userFirstName || "User"}'s Highlights`}
              </span>
            </div>
          </div>

          {/* Course ranking badges and user rating */}
          <CourseRankBadges
            globalRank={course.global_rank}
            regionalRank={course.regional_rank}
            usaRank={course.usa_rank}
            country={course.country}
            viewContext={region === 'britain-ireland' ? 'regional' : region === 'usa' ? 'usa' : region === 'europe' ? 'europe' : 'global'}
            userRating={userRating}
            showUserRating={!!userRating}
            positioning="top-left"
          />

          {/* Played Indicator */}
          {isPlayed && (
            <div className="absolute top-2 right-2">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                <Check className="h-4 w-4 text-white" />
              </div>
            </div>
          )}

          {/* Hover overlay for own profile */}
          {isOwnProfile && !isPlayed && (
            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
              <div className="opacity-0 hover:opacity-100 transition-opacity duration-200 bg-white/90 rounded-full p-2">
                <Check className="h-5 w-5 text-green-600" />
              </div>
            </div>
          )}
        </div>

        {/* Course Info */}
        <div className="p-2.5">
          <h3 className="font-semibold text-body-sm line-clamp-2 leading-tight mb-1">
            {course.name}
          </h3>
          <div className="flex items-center text-meta text-muted-foreground mb-1.5">
            <MapPin className="h-2.5 w-2.5 mr-1" />
            <span>{formatLocation(course)}</span>
          </div>
          {course.description && (
            <p className="text-meta text-muted-foreground line-clamp-2">
              {formatDescription(course.description)}
            </p>
          )}
        </div>

        {/* Visual feedback for played state */}
        {isPlayed && (
          <div className="absolute inset-0 bg-green-500/5 pointer-events-none" />
        )}
      </div>

      {/* Rating Modal - show for both new ratings and editing existing ones */}
      {showRatingModal && isOwnProfile && (
        <ReviewWizard
          course={{
            id: course.id,
            name: course.name,
            thumbnail_image: course.thumbnail_image
          }}
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          isEditMode={wasAlreadyPlayed}
          onRemoveFromPlayed={onToggle}
        />
      )}
    </>
  );
};

export default Top100CourseCard;
