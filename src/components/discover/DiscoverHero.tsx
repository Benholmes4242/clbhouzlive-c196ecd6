import React, { useState, useRef, useEffect } from 'react';
import { Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getStreamPoster, getStreamIdFromUrl } from '@/utils/stream';
import '@/styles/discover-light.css';

interface HeroItem {
  id: string;
  contextLabel: string; // e.g. "Trending in golf"
  title: string;
  subContext: string; // Creator name OR course name (never both)
  mediaUrl: string;
  mediaType: 'image' | 'video';
  posterUrl?: string;
  ctaLabel?: string;
  ctaAction?: () => void;
  linkTo?: string;
}

interface DiscoverHeroProps {
  item: HeroItem | null;
  isLoading?: boolean;
}

const DiscoverHero: React.FC<DiscoverHeroProps> = ({ item, isLoading }) => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [posterLoaded, setPosterLoaded] = useState(false);

  // Autoplay muted video when in view
  useEffect(() => {
    if (videoRef.current && item?.mediaType === 'video') {
      videoRef.current.play().catch(() => {
        // Autoplay blocked, that's fine
      });
    }
  }, [item]);

  if (isLoading) {
    return (
      <div className="discover-hero animate-pulse">
        <div className="discover-hero__media bg-gray-200" />
      </div>
    );
  }

  if (!item) {
    return null;
  }

  const handleCTAClick = () => {
    if (item.ctaAction) {
      item.ctaAction();
    } else if (item.linkTo) {
      navigate(item.linkTo);
    }
  };

  const posterUrl = item.posterUrl || 
    (item.mediaType === 'video' ? getStreamPoster(getStreamIdFromUrl(item.mediaUrl) || '', '1s') : undefined);

  return (
    <div className="discover-hero">
      <div className="discover-hero__media">
        {item.mediaType === 'video' ? (
          <video
            ref={videoRef}
            src={item.mediaUrl}
            poster={posterUrl || undefined}
            muted
            loop
            playsInline
            autoPlay
          />
        ) : (
          <img
            src={item.mediaUrl}
            alt={item.title}
            loading="eager"
          />
        )}
        <div className="discover-hero__gradient" />
      </div>

      <div className="discover-hero__content">
        <div className="discover-hero__context">
          {item.contextLabel}
        </div>
        <h2 className="discover-hero__title">
          {item.title}
        </h2>
        <p className="discover-hero__sub-context">
          {item.subContext}
        </p>
        <button 
          className="discover-hero__cta"
          onClick={handleCTAClick}
        >
          <Play size={16} fill="currentColor" />
          {item.ctaLabel || 'Watch'}
        </button>
      </div>
    </div>
  );
};

export default DiscoverHero;

// Hook to fetch hero content
export function useDiscoverHero() {
  const [hero, setHero] = useState<HeroItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // For now, use a placeholder hero
    // TODO: Integrate with real data source
    const fetchHero = async () => {
      setIsLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Placeholder hero - will be replaced with real data
      setHero({
        id: 'hero-1',
        contextLabel: 'Trending in golf',
        title: 'The Shot That Changed Everything',
        subContext: 'Featured Creator',
        mediaUrl: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=1200&h=675&fit=crop',
        mediaType: 'image',
        ctaLabel: 'Watch',
        linkTo: '/discover?main=watch',
      });
      
      setIsLoading(false);
    };

    fetchHero();
  }, []);

  return { hero, isLoading };
}
