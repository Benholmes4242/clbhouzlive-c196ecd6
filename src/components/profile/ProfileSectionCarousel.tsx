import React, { useState } from 'react';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useIsMobile } from '@/hooks/use-mobile';

interface ProfileSectionCarouselProps {
  onSectionChange?: (section: string) => void;
}

const ProfileSectionCarousel: React.FC<ProfileSectionCarouselProps> = ({ onSectionChange }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const isMobile = useIsMobile();

  const cards = [
    {
      id: 'activity',
      title: 'Activity',
      description: 'View your recent golf moments, rounds played, and course discoveries.',
      className: 'relative overflow-hidden flex flex-col justify-end text-white h-[200px] cursor-pointer group !rounded-lg'
    },
    {
      id: 'top100',
      title: 'Top 100 Courses',
      description: 'Discover and track the world\'s greatest golf courses.',
      className: 'relative overflow-hidden flex flex-col justify-end text-white h-[200px] cursor-pointer group !rounded-lg'
    },
    {
      id: 'handicap',
      title: 'Handicap',
      description: 'Track your progress and handicap development over time.',
      className: 'relative overflow-hidden flex flex-col justify-end text-white h-[200px] cursor-pointer group !rounded-lg'
    }
  ];

  // Auto-change content when swiping
  React.useEffect(() => {
    const currentCard = cards[currentIndex];
    if (currentCard && isMobile) {
      onSectionChange?.(currentCard.id);
    }
  }, [currentIndex, cards, onSectionChange, isMobile]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const swipeRef = useSwipeGesture({
    onSwipeLeft: goToNext,
    onSwipeRight: goToPrevious,
    threshold: 50
  });

  const handleCardClick = (cardId: string) => {
    onSectionChange?.(cardId);
  };

  if (!isMobile) {
    // Desktop: Show original grid layout
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div
            key={card.id}
            className={card.className}
            onClick={() => handleCardClick(card.id)}
          >
            {/* Activity liquid glass background */}
            {card.id === 'activity' && (
              <div className="absolute inset-0 bg-white/5 backdrop-blur-2xl border border-white/20 rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.2)]">
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent rounded-lg" />
              </div>
            )}

            {/* Top 100 liquid glass background */}
            {card.id === 'top100' && (
              <div className="absolute inset-0 bg-white/5 backdrop-blur-2xl border border-white/20 rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.2)]" style={{ backdropFilter: 'blur(1200px) saturate(180%)' }}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent rounded-lg" />
              </div>
            )}
            
            {/* Handicap liquid glass background */}
            {card.id === 'handicap' && (
              <div className="absolute inset-0 bg-white/5 backdrop-blur-2xl border border-white/20 rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.2)]" style={{ backdropFilter: 'blur(1200px) saturate(180%)' }}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent rounded-lg" />
              </div>
            )}
            
            {/* Content */}
            <div className="relative p-8 cursor-pointer group">
              <div className="flex items-center mb-3">
                <h3 className="text-3xl font-bold group-hover:scale-105 transition-transform">{card.title}</h3>
              </div>
              <p className="text-white/90 text-lg leading-relaxed drop-shadow-lg">{card.description}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Mobile: Show carousel
  return (
    <div className="relative">
      <div 
        ref={swipeRef}
        className="overflow-hidden"
      >
        <div 
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {cards.map((card) => (
            <div
              key={card.id}
              className={`${card.className.replace('h-[200px]', 'h-[250px]')} flex-shrink-0 w-full`}
              onClick={() => handleCardClick(card.id)}
            >
              {/* Activity liquid glass background */}
              {card.id === 'activity' && (
                <div className="absolute inset-0 bg-white/5 backdrop-blur-2xl border border-white/20 rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.2)]">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent rounded-lg" />
                </div>
              )}

              {/* Top 100 liquid glass background */}
              {card.id === 'top100' && (
                <div className="absolute inset-0 bg-white/5 backdrop-blur-2xl border border-white/20 rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.2)]" style={{ backdropFilter: 'blur(1200px) saturate(180%)' }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent rounded-lg" />
                </div>
              )}
              
              {/* Handicap liquid glass background */}
              {card.id === 'handicap' && (
                <div className="absolute inset-0 bg-white/5 backdrop-blur-2xl border border-white/20 rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.2)]" style={{ backdropFilter: 'blur(1200px) saturate(180%)' }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent rounded-lg" />
                </div>
              )}
              
              {/* Content */}
              <div className="relative p-8 cursor-pointer group">
                <div className="flex items-center mb-3">
                  <h3 className="text-3xl font-bold">{card.title}</h3>
                </div>
                <p className="text-white/90 text-lg leading-relaxed drop-shadow-lg">{card.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Dot indicators */}
      <div className="flex justify-center mt-4 space-x-2">
        {cards.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? 'bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default ProfileSectionCarousel;