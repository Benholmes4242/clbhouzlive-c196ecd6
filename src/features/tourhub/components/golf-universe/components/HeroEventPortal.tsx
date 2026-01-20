/**
 * HeroEventPortal - Full-bleed cinematic hero section
 * Features event metadata overlay and action buttons
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Play, Heart, BookOpen, Calendar, MapPin, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import type { GolfEvent } from '../types';
import { useCourseImageResolver } from '../../../hooks/useCourseImageResolver';

interface HeroEventPortalProps {
  event: GolfEvent;
  onWatch?: () => void;
  onFollow?: () => void;
  onStorylines?: () => void;
  isFollowing?: boolean;
}

export const HeroEventPortal = memo(function HeroEventPortal({
  event,
  onWatch,
  onFollow,
  onStorylines,
  isFollowing = false,
}: HeroEventPortalProps) {
  // Resolve course image
  const venues = event.venueName ? [{
    venueName: event.venueName,
    venueCourseName: event.courseName,
    city: event.venueCity,
    country: event.venueCountry,
  }] : [];
  
  const { data: courseImages } = useCourseImageResolver(venues);
  const imageUrl = event.venueName ? courseImages?.get(event.venueName)?.imageUrl : null;

  const statusConfig = {
    live: { label: 'LIVE NOW', color: 'bg-red-500', pulse: true },
    inprogress: { label: 'IN PROGRESS', color: 'bg-red-500', pulse: true },
    upcoming: { label: 'UPCOMING', color: 'bg-emerald-500', pulse: false },
    scheduled: { label: 'UPCOMING', color: 'bg-emerald-500', pulse: false },
    complete: { label: 'COMPLETE', color: 'bg-slate-500', pulse: false },
    closed: { label: 'COMPLETE', color: 'bg-slate-500', pulse: false },
  };

  const status = statusConfig[event.status] || statusConfig.upcoming;
  const location = [event.venueCity, event.venueCountry].filter(Boolean).join(', ');

  return (
    <motion.div 
      className="relative w-full overflow-hidden"
      style={{ height: 'min(70vh, 520px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={event.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900" />
        )}
        {/* Cinematic gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 pb-8">
        {/* Status Badge */}
        <div className="flex items-center gap-2 mb-4">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${status.color}`}>
            {status.pulse && (
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            )}
            <span className="text-[10px] font-bold tracking-wider text-white uppercase">
              {status.label}
            </span>
          </div>
          {event.isMajor && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/90">
              <Trophy className="w-3 h-3 text-white" />
              <span className="text-[10px] font-bold tracking-wider text-white uppercase">
                Major
              </span>
            </div>
          )}
        </div>

        {/* Event Title */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 leading-tight">
          {event.name}
        </h1>

        {/* Event Meta */}
        <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm mb-6">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>
              {format(new Date(event.startDate), 'MMM d')} – {format(new Date(event.endDate), 'd, yyyy')}
            </span>
          </div>
          {location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>{location}</span>
            </div>
          )}
          {event.courseName && (
            <span className="text-white/60">•</span>
          )}
          {event.courseName && (
            <span className="text-white/70">{event.courseName}</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {(event.isLive || event.status === 'inprogress') && onWatch && (
            <button
              onClick={onWatch}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-black font-semibold rounded-full hover:bg-white/90 transition-colors"
            >
              <Play className="w-4 h-4" fill="currentColor" />
              <span>Watch</span>
            </button>
          )}
          
          {onFollow && (
            <button
              onClick={onFollow}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-colors ${
                isFollowing 
                  ? 'bg-white/20 text-white border border-white/30' 
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFollowing ? 'fill-current' : ''}`} />
              <span>{isFollowing ? 'Following' : 'Follow'}</span>
            </button>
          )}

          {onStorylines && (
            <button
              onClick={onStorylines}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white rounded-full font-medium hover:bg-white/20 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              <span>Storylines</span>
            </button>
          )}
        </div>

        {/* Purse indicator */}
        {event.purse && event.purse > 0 && (
          <div className="mt-4 text-sm text-white/50">
            ${(event.purse / 1000000).toFixed(1)}M Purse
          </div>
        )}
      </div>

      {/* Decorative elements */}
      <div className="absolute top-6 right-6">
        <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
          <span className="text-lg">🏌️</span>
        </div>
      </div>
    </motion.div>
  );
});
