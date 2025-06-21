
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Check, Globe, MapPin } from 'lucide-react';
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
  const [wasJustPlayed, setWasJustPlayed] = useState(false);

  const handleCardClick = () => {
    if (!isOwnProfile || !onToggle) return;
    
    // If course is not currently played, show rating modal after marking as played
    if (!isPlayed) {
      setWasJustPlayed(true);
      onToggle();
      // Small delay to let the state update, then show rating modal
      setTimeout(() => {
        setShowRatingModal(true);
      }, 100);
    } else {
      // If already played, just toggle off
      onToggle();
    }
  };

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
          
          {/* Rank Badges */}
          <div className="absolute top-2 left-2 flex gap-1">
            {/* Gold badge - always shows global rank */}
            {course.global_rank && (
              <Badge className="bg-yellow-500 text-yellow-900 hover:bg-yellow-500 text-xs">
                <Globe className="h-2 w-2 mr-1" />
                {course.global_rank}
              </Badge>
            )}
            {/* GB&I badge - shows regional rank for GB&I courses */}
            {course.regional_rank && region === 'britain-ireland' && (
              <Badge variant="secondary" className="text-xs">
                #{course.regional_rank} GB&I
              </Badge>
            )}
            {/* USA rank badge */}
            {course.usa_rank && region === 'usa' && (
              <Badge variant="secondary" className="text-xs">
                #{course.usa_rank} USA
              </Badge>
            )}
          </div>

          {/* Played Indicator with enhanced visual feedback */}
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

      {/* Rating Modal - only show for own profile when first marking as played */}
      {showRatingModal && isOwnProfile && (
        <PostPlayRatingModal
          course={{
            id: course.id,
            name: course.name,
            thumbnail_image: course.thumbnail_image
          }}
          isOpen={showRatingModal}
          onClose={() => {
            setShowRatingModal(false);
            setWasJustPlayed(false);
          }}
        />
      )}
    </>
  );
};

export default Top100CourseCard;
