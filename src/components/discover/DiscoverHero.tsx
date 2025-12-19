import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface HeroItem {
  id: string;
  contextLabel: string; // e.g. "Trending in golf"
  title: string;
  subContext: string; // creator name OR course name (never both)
  subContextType: 'creator' | 'course';
  mediaUrl: string;
  mediaType: 'image' | 'video';
  posterUrl?: string;
  ctaLabel?: string;
  ctaAction?: () => void;
}

interface DiscoverHeroProps {
  item: HeroItem | null;
  isLoading?: boolean;
}

export const DiscoverHero: React.FC<DiscoverHeroProps> = ({ item, isLoading }) => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Muted autoplay for video
  useEffect(() => {
    if (item?.mediaType === 'video' && videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {
        // Autoplay blocked, that's fine
      });
    }
  }, [item]);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="relative w-full aspect-[16/9] max-h-[320px] bg-muted animate-pulse rounded-sq-lg overflow-hidden mx-auto">
        <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-6">
          <div className="h-3 w-24 bg-muted-foreground/20 rounded mb-3" />
          <div className="h-6 w-3/4 bg-muted-foreground/20 rounded mb-2" />
          <div className="h-4 w-1/3 bg-muted-foreground/20 rounded mb-4" />
          <div className="h-9 w-24 bg-muted-foreground/20 rounded-full" />
        </div>
      </div>
    );
  }

  if (!item) return null;

  const handleCta = () => {
    if (item.ctaAction) {
      item.ctaAction();
    } else {
      // Default: navigate to post
      navigate(`/clubhouse/post/${item.id}`);
    }
  };

  return (
    <div className="relative w-full aspect-[16/9] max-h-[320px] rounded-sq-lg overflow-hidden bg-surface-alt">
      {/* Media */}
      {item.mediaType === 'video' ? (
        <video
          ref={videoRef}
          src={item.mediaUrl}
          poster={item.posterUrl}
          className="absolute inset-0 w-full h-full object-cover"
          loop
          muted
          playsInline
          autoPlay
        />
      ) : (
        <>
          {!imageLoaded && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}
          <img
            src={item.mediaUrl}
            alt={item.title}
            className={cn(
              "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setImageLoaded(true)}
          />
        </>
      )}

      {/* Gradient overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 40%, transparent 70%)'
        }}
      />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-6">
        {/* Context label */}
        <span className="text-xs font-medium text-white/70 uppercase tracking-wide mb-2">
          {item.contextLabel}
        </span>

        {/* Title */}
        <h2 className="text-lg md:text-xl font-semibold text-white line-clamp-2 mb-1">
          {item.title}
        </h2>

        {/* Sub-context (creator OR course) */}
        <p className="text-sm text-white/80 mb-4">
          {item.subContextType === 'creator' ? 'by ' : 'at '}
          <span className="font-medium">{item.subContext}</span>
        </p>

        {/* CTA Button */}
        <Button
          onClick={handleCta}
          size="sm"
          className="w-fit gap-2 bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm"
        >
          <Play className="h-4 w-4 fill-current" />
          {item.ctaLabel || 'Watch'}
        </Button>
      </div>
    </div>
  );
};

export default DiscoverHero;
