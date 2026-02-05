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

// Clbhouz logo for ratings
function ClbhouzLogo({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      className={className}
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
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

  const communityRating = course.rating;
  const worldRank = course.world_rank;
  const countryRank = course.country_rank;
  const hasRankings = worldRank || countryRank;

  // Text colors based on sender/receiver
  const primaryTextColor = isOwnMessage ? "text-primary" : "text-foreground";
  const secondaryTextColor = isOwnMessage ? "text-primary/70" : "text-muted-foreground";

  return (
    <button 
      className={cn(
        "w-full rounded-xl overflow-hidden text-left transition-all",
        "hover:scale-[1.02] active:scale-[0.98] shadow-sm",
        isOwnMessage 
          ? "bg-white/10" 
          : "bg-background border border-border"
      )}
      onClick={handleViewCourse}
    >
      {/* Course Image - Full width, edge to edge */}
      <div className="relative w-full h-32 overflow-hidden bg-muted">
        {course.course_image_url ? (
          <img 
            src={course.course_image_url} 
            alt={course.course_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
            <span className="text-4xl">⛳</span>
          </div>
        )}
        
        {/* Ranking Badges - Top Left */}
        {hasRankings && (
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {worldRank && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-black/70 backdrop-blur-sm rounded-full">
                <span className="text-yellow-400 text-xs">🌍</span>
                <span className="text-white text-xs font-semibold">#{worldRank}</span>
              </div>
            )}
            {countryRank && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-black/70 backdrop-blur-sm rounded-full">
                <span className="text-xs">🏆</span>
                <span className="text-white text-xs font-semibold">#{countryRank}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Community Rating Bar - Full width, directly under image */}
      {communityRating && communityRating > 0 && (
        <div className={cn(
          "w-full px-3 py-2 flex items-center gap-2",
          isOwnMessage ? "bg-primary/10" : "bg-muted"
        )}>
          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[10px] font-bold">C</span>
          </div>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={14}
                className={cn(
                  star <= Math.round(communityRating)
                    ? "fill-primary text-primary"
                    : secondaryTextColor + "/30"
                )}
              />
            ))}
            <span className={cn("text-sm font-bold ml-1", primaryTextColor)}>
              {communityRating.toFixed(1)}
            </span>
          </div>
        </div>
      )}
      
      {/* Course Info - Full width */}
      <div className="w-full px-3 py-3">
        <h4 className={cn("font-semibold text-sm line-clamp-2", primaryTextColor)}>
          {course.course_name}
        </h4>
        
        {/* Location */}
        {course.location && (
          <div className={cn("flex items-center gap-1 mt-1 text-xs", secondaryTextColor)}>
            <MapPin size={12} />
            <span className="truncate">{course.location}</span>
          </div>
        )}
        
        {/* View Course Button - Full width */}
        <div className={cn(
          "mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-colors",
          "bg-[#1D1D1F] text-white hover:bg-[#2D2D2F]"
        )}>
          <span>View Course</span>
          <ExternalLink size={14} />
        </div>
      </div>
    </button>
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
        <div className={cn("w-full", className)}>
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
