import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Star, Clock, Users, Play, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { MessageType, SharedCourse, SharedTeeTime, SharedMoment } from '@/types/messaging';

interface SharedContentCardProps {
  messageType: MessageType;
  metadata: Record<string, unknown>;
  isOwnMessage?: boolean;
  className?: string;
}

function CourseShareCard({ 
  course, 
  isOwnMessage 
}: { 
  course: SharedCourse; 
  isOwnMessage?: boolean; 
}) {
  const navigate = useNavigate();

  const handleViewCourse = () => {
    navigate(`/courses/${course.course_id}`);
  };

  return (
    <div 
      className={cn(
        "rounded-xl overflow-hidden border cursor-pointer transition-shadow hover:shadow-md",
        isOwnMessage ? "border-primary-foreground/20 bg-primary-foreground/10" : "border-border bg-card"
      )}
      onClick={handleViewCourse}
    >
      {/* Course Image */}
      {course.course_image_url ? (
        <div className="h-32 overflow-hidden">
          <img 
            src={course.course_image_url} 
            alt={course.course_name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="h-32 bg-muted flex items-center justify-center">
          <span className="text-4xl">⛳</span>
        </div>
      )}

      {/* Course Info */}
      <div className="p-3">
        <h4 className={cn(
          "font-semibold text-sm line-clamp-1",
          isOwnMessage ? "text-primary-foreground" : "text-foreground"
        )}>
          {course.course_name}
        </h4>
        
        {course.location && (
          <div className="flex items-center gap-1 mt-1">
            <MapPin className={cn(
              "h-3 w-3",
              isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
            )} />
            <span className={cn(
              "text-xs line-clamp-1",
              isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
            )}>
              {course.location}
            </span>
          </div>
        )}

        {course.rating && (
          <div className="flex items-center gap-1 mt-1">
            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
            <span className={cn(
              "text-xs",
              isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
            )}>
              {course.rating.toFixed(1)}
            </span>
          </div>
        )}

        <Button 
          variant={isOwnMessage ? "secondary" : "outline"}
          size="sm" 
          className="w-full mt-2 h-8 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            handleViewCourse();
          }}
        >
          View Course <ExternalLink className="h-3 w-3 ml-1" />
        </Button>
      </div>
    </div>
  );
}

function TeeTimeShareCard({ 
  teeTime, 
  isOwnMessage 
}: { 
  teeTime: SharedTeeTime; 
  isOwnMessage?: boolean; 
}) {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    // Navigate to tee time details if available
    if (teeTime.tee_time_id) {
      navigate(`/games/${teeTime.tee_time_id}`);
    }
  };

  return (
    <div 
      className={cn(
        "rounded-xl overflow-hidden border cursor-pointer transition-shadow hover:shadow-md",
        isOwnMessage ? "border-primary-foreground/20 bg-primary-foreground/10" : "border-border bg-card"
      )}
      onClick={handleViewDetails}
    >
      {/* Course Image */}
      {teeTime.course_image_url ? (
        <div className="h-24 overflow-hidden relative">
          <img 
            src={teeTime.course_image_url} 
            alt={teeTime.course_name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-2 left-2 right-2">
            <h4 className="font-semibold text-sm text-white line-clamp-1">
              {teeTime.course_name}
            </h4>
          </div>
        </div>
      ) : (
        <div className="p-3 border-b border-border">
          <h4 className={cn(
            "font-semibold text-sm line-clamp-1",
            isOwnMessage ? "text-primary-foreground" : "text-foreground"
          )}>
            {teeTime.course_name}
          </h4>
        </div>
      )}

      {/* Tee Time Details */}
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Clock className={cn(
              "h-3 w-3",
              isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
            )} />
            <span className={cn(
              "text-xs font-medium",
              isOwnMessage ? "text-primary-foreground" : "text-foreground"
            )}>
              {teeTime.date} at {teeTime.time}
            </span>
          </div>
          {teeTime.price && (
            <span className={cn(
              "text-xs font-semibold",
              isOwnMessage ? "text-primary-foreground" : "text-primary"
            )}>
              {teeTime.price}
            </span>
          )}
        </div>

        {teeTime.spots_available !== undefined && (
          <div className="flex items-center gap-1">
            <Users className={cn(
              "h-3 w-3",
              isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
            )} />
            <span className={cn(
              "text-xs",
              isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
            )}>
              {teeTime.spots_available} spots available
            </span>
          </div>
        )}

        <Button 
          variant={isOwnMessage ? "secondary" : "outline"}
          size="sm" 
          className="w-full h-8 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            handleViewDetails();
          }}
        >
          View Details <ExternalLink className="h-3 w-3 ml-1" />
        </Button>
      </div>
    </div>
  );
}

function MomentShareCard({ 
  moment, 
  isOwnMessage 
}: { 
  moment: SharedMoment; 
  isOwnMessage?: boolean; 
}) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Handle both old moment_id style and new media_urls style
  const mediaUrls = moment.media_urls || (moment.thumbnail_url ? [moment.thumbnail_url] : []);
  const hasMultiple = mediaUrls.length > 1;

  const handleWatch = () => {
    if (moment.moment_id) {
      navigate(`/post/${moment.moment_id}`);
    }
  };

  const goNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % mediaUrls.length);
  };

  const goPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev - 1 + mediaUrls.length) % mediaUrls.length);
  };

  const isVideo = (url: string) => {
    return url.includes('.mp4') || url.includes('.mov') || url.includes('.webm');
  };

  return (
    <div 
      className={cn(
        "rounded-xl overflow-hidden border transition-shadow hover:shadow-md",
        isOwnMessage ? "border-primary-foreground/20 bg-primary-foreground/10" : "border-border bg-card",
        moment.moment_id && "cursor-pointer"
      )}
      onClick={moment.moment_id ? handleWatch : undefined}
    >
      {/* Media display with carousel if multiple */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        {mediaUrls.length > 0 ? (
          <>
            {isVideo(mediaUrls[currentIndex]) ? (
              <video 
                src={mediaUrls[currentIndex]} 
                className="w-full h-full object-cover"
                controls
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <img 
                src={mediaUrls[currentIndex]} 
                alt="Shared moment"
                className="w-full h-full object-cover"
              />
            )}
            
            {/* Navigation arrows for multiple media */}
            {hasMultiple && (
              <>
                <button
                  onClick={goPrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={goNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
                
                {/* Dots indicator */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {mediaUrls.map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        "w-1.5 h-1.5 rounded-full transition-colors",
                        index === currentIndex ? "bg-white" : "bg-white/50"
                      )}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Play overlay for moment_id type */}
            {moment.moment_id && !isVideo(mediaUrls[currentIndex]) && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="h-12 w-12 rounded-full bg-white/90 flex items-center justify-center">
                  <Play className="h-6 w-6 text-primary fill-primary ml-1" />
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl">📸</span>
          </div>
        )}
      </div>

      {/* Creator Info (only show if it's a profile moment) */}
      {moment.creator_name && (
        <div className="p-3">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={moment.creator_avatar} />
              <AvatarFallback className="text-[10px]">
                {moment.creator_name?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className={cn(
              "text-xs font-medium line-clamp-1",
              isOwnMessage ? "text-primary-foreground" : "text-foreground"
            )}>
              {moment.creator_name}
            </span>
          </div>
          
          {moment.caption && (
            <p className={cn(
              "text-xs mt-1 line-clamp-2",
              isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
            )}>
              {moment.caption}
            </p>
          )}

          {moment.moment_id && (
            <Button 
              variant={isOwnMessage ? "secondary" : "outline"}
              size="sm" 
              className="w-full mt-2 h-8 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                handleWatch();
              }}
            >
              Watch <Play className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
      )}
      
      {/* For native picker moments without creator info, show media count */}
      {!moment.creator_name && hasMultiple && (
        <div className="p-2">
          <span className={cn(
            "text-xs",
            isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
          )}>
            {currentIndex + 1} / {mediaUrls.length}
          </span>
        </div>
      )}
    </div>
  );
}

export function SharedContentCard({ 
  messageType, 
  metadata,
  isOwnMessage,
  className 
}: SharedContentCardProps) {
  // Render based on message type
  switch (messageType) {
    case 'course_share':
      return (
        <div className={cn("w-56", className)}>
          <CourseShareCard 
            course={metadata as unknown as SharedCourse} 
            isOwnMessage={isOwnMessage} 
          />
        </div>
      );
    
    case 'tee_time':
      return (
        <div className={cn("w-56", className)}>
          <TeeTimeShareCard 
            teeTime={metadata as unknown as SharedTeeTime} 
            isOwnMessage={isOwnMessage} 
          />
        </div>
      );
    
    case 'moment_share':
      return (
        <div className={cn("w-56", className)}>
          <MomentShareCard 
            moment={metadata as unknown as SharedMoment} 
            isOwnMessage={isOwnMessage} 
          />
        </div>
      );
    
    default:
      return null;
  }
}
