import React, { useState } from 'react';
import { Star, MapPin, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import CourseDetailModal from '../CourseDetailModal';
import { formatDistanceToNow } from 'date-fns';

interface NetflixCourseCardProps {
  course: any;
  userRating?: number;
  playedDate?: string;
  targetUserId?: string;
  isOwnProfile: boolean;
}

const NetflixCourseCard: React.FC<NetflixCourseCardProps> = ({
  course,
  userRating,
  playedDate,
  targetUserId,
  isOwnProfile
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!course) return null;

  const handleImageError = () => {
    setImageError(true);
  };

  const formatPlayedDate = (date?: string) => {
    if (!date) return null;
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return null;
    }
  };

  const getCountryFlag = (country: string) => {
    const flagMap: { [key: string]: string } = {
      'USA': '🇺🇸',
      'Britain & Ireland': '🇬🇧',
      'Continental Europe': '🇪🇺',
      'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
      'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
      'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
      'Ireland': '🇮🇪',
      'Northern Ireland': '🇬🇧',
      'Spain': '🇪🇸',
      'Portugal': '🇵🇹',
      'France': '🇫🇷',
      'Germany': '🇩🇪',
      'Italy': '🇮🇹',
      'Netherlands': '🇳🇱',
      'Australia': '🇦🇺',
      'New Zealand': '🇳🇿',
      'South Africa': '🇿🇦',
      'Japan': '🇯🇵',
      'South Korea': '🇰🇷',
      'Canada': '🇨🇦',
      'Mexico': '🇲🇽',
      'Argentina': '🇦🇷',
      'Chile': '🇨🇱',
      'Brazil': '🇧🇷',
      'China': '🇨🇳',
      'Thailand': '🇹🇭',
      'Singapore': '🇸🇬',
      'Malaysia': '🇲🇾',
      'UAE': '🇦🇪',
      'Turkey': '🇹🇷',
      'Morocco': '🇲🇦',
      'Egypt': '🇪🇬',
      'India': '🇮🇳',
      'Indonesia': '🇮🇩',
      'Philippines': '🇵🇭',
      'Vietnam': '🇻🇳',
    };
    return flagMap[country] || '🌍';
  };

  return (
    <>
      <Card 
        className="netflix-course-card flex-shrink-0 cursor-pointer group transition-all duration-300 hover:scale-105 hover:shadow-lg overflow-hidden bg-background/80 backdrop-blur-sm border-border/50 line-clamp-container"
        style={{
          aspectRatio: '2/1' // Landscape 2:1 ratio
        }}
        onClick={() => setIsModalOpen(true)}
      >
        <div className="relative h-full">
          {/* Course Image */}
          <div className="relative h-2/3 overflow-hidden">
            {!imageError && course.thumbnail_image ? (
              <img
                src={course.thumbnail_image}
                alt={course.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                onError={handleImageError}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <div className="text-center p-4">
                  <MapPin className="h-8 w-8 mx-auto mb-2 text-primary/60" />
                  <p className="text-xs text-muted-foreground font-medium">
                    {course.name}
                  </p>
                </div>
              </div>
            )}

            {/* Overlay gradient for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Top-right badges */}
            <div className="absolute top-2 right-2 flex flex-col gap-1">
              {course.global_rank && course.global_rank <= 100 && (
                <div className="bg-yellow-500/90 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold">
                  #{course.global_rank}
                </div>
              )}
              {userRating && (
                <div className="bg-primary/90 text-primary-foreground px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <Star className="h-3 w-3 fill-current" />
                  {userRating}
                </div>
              )}
            </div>
          </div>

          {/* Course Info */}
          <div className="h-1/3 p-3 space-y-1">
            <h3 className="font-bold text-sm leading-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors">
              {course.name}
            </h3>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <span>{getCountryFlag(course.country)}</span>
                <span className="truncate">{course.country}</span>
              </div>
              
              {playedDate && (
                <div className="flex items-center gap-1 text-xs">
                  <Calendar className="h-3 w-3" />
                  <span>{formatPlayedDate(playedDate)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Course Detail Modal */}
      <CourseDetailModal
        course={course}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        viewingUserId={targetUserId}
        isFromUserCoursesPage={true}
      />

    </>
  );
};

export default NetflixCourseCard;