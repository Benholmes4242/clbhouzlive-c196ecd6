
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Check, Globe, MapPin, Trophy, Flag } from 'lucide-react';
import PostPlayRatingModal from '../courses/PostPlayRatingModal';

interface Top100CourseCardProps {
  course: any;
  isPlayed: boolean;
  region: string;
  isOwnProfile?: boolean;
  onToggle?: () => void;
}

const Top100CourseCard: React.FC<Top100CourseCardProps> = ({
  course,
  isPlayed,
  region,
  isOwnProfile = false,
  onToggle
}) => {
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [wasAlreadyPlayed, setWasAlreadyPlayed] = useState(false);

  const handleCardClick = () => {
    if (!isOwnProfile || !onToggle) return;
    
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

  // Check for GB&I countries - including all possible variations
  const isGBI = ['United Kingdom', 'Ireland', 'England', 'Scotland', 'Wales', 'Northern Ireland', 'Isle of Man', 'Britain & Ireland'].includes(course.country);
  const isUSA = ['United States', 'USA'].includes(course.country);
  const isEurope = course.country === 'Continental Europe';

  // Determine regional rank display
  const getRegionalRankBadge = () => {
    if (isGBI && course.regional_rank && course.regional_rank <= 100) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300 text-xs">
          <MapPin className="h-2 w-2 mr-1" />
          #{course.regional_rank} GB&I
        </Badge>
      );
    }
    
    if (isUSA && course.usa_rank && course.usa_rank <= 100) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300 text-xs">
          <Flag className="h-2 w-2 mr-1" />
          #{course.usa_rank} USA
        </Badge>
      );
    }
    
    if (isEurope && course.regional_rank && course.regional_rank <= 100) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300 text-xs">
          <Globe className="h-2 w-2 mr-1" />
          #{course.regional_rank} Continental Europe
        </Badge>
      );
    }
    
    return null;
  };

  // Determine worldwide rank display
  const getWorldwideRankBadge = () => {
    if (course.global_rank && course.global_rank <= 100) {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs">
          <Trophy className="h-2 w-2 mr-1" />
          #{course.global_rank} World
        </Badge>
      );
    }
    return null;
  };

  const regionalBadge = getRegionalRankBadge();
  const worldwideBadge = getWorldwideRankBadge();

  return (
    <>
      <div
        className={`relative rounded-lg border overflow-hidden transition-all duration-300 ${
          isPlayed 
            ? 'bg-green-50 border-green-200 shadow-md transform scale-[1.02]' 
            : 'bg-card hover:shadow-lg'
        } ${isOwnProfile ? 'cursor-pointer' : ''}`}
        onClick={handleCardClick}
      >
        {/* Course Image */}
        <div className="relative h-32 overflow-hidden">
          <img
            src={course.thumbnail_image || 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'}
            alt={course.name}
            className="w-full h-full object-cover"
          />
          
          {/* Regional rank badge on the left */}
          {regionalBadge && (
            <div className="absolute top-2 left-2">
              {regionalBadge}
            </div>
          )}
          
          {/* Worldwide rank badge on the right */}
          {worldwideBadge && (
            <div className="absolute top-2 right-2">
              {worldwideBadge}
            </div>
          )}

          {/* Played Indicator */}
          {isPlayed && (
            <div className="absolute top-2 right-2 mt-8">
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
        <div className="p-3">
          <h3 className="font-semibold text-sm line-clamp-2 leading-tight mb-1">
            {course.name}
          </h3>
          <div className="flex items-center text-xs text-muted-foreground mb-2">
            <MapPin className="h-3 w-3 mr-1" />
            <span>{course.region ? `${course.region}, ` : ''}{course.country}</span>
          </div>
          {course.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {course.description}
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
        <PostPlayRatingModal
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
