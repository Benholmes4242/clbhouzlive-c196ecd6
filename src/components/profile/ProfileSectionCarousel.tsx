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
      className: 'relative overflow-hidden flex flex-col justify-end text-white cursor-pointer group !rounded-lg'
    },
    {
      id: 'top100',
      title: 'The World\'s Greatest Courses',
      description: 'Discover and track the world\'s greatest golf courses.',
      className: 'relative overflow-hidden flex flex-col justify-end text-white cursor-pointer group !rounded-lg'
    },
    {
      id: 'handicap',
      title: 'Handicap',
      description: 'Track your progress and handicap development over time.',
      className: 'relative overflow-hidden flex flex-col justify-end text-white cursor-pointer group !rounded-lg'
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
            {/* Activity background image */}
            {card.id === 'activity' && (
              <>
                <img 
                  src="/lovable-uploads/88578314-636a-402e-8435-ad54169af886.png?v=1" 
                  alt="Golf course at sunset with ocean view"
                  className="absolute inset-0 w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    console.error('Failed to load Activity image');
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-black/25 rounded-lg"></div>
              </>
            )}

            {/* Top 100 background image */}
            {card.id === 'top100' && (
              <>
                <img 
                  src="/lovable-uploads/a8a80045-1c4d-4933-9a97-55d3cb2fa17b.png?v=1" 
                  alt="Coastal golf course with dramatic cliffs"
                  className="absolute inset-0 w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    console.error('Failed to load Top 100 image');
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-black/25 rounded-lg"></div>
              </>
            )}
            
            {/* Handicap background image */}
            {card.id === 'handicap' && (
              <>
                <img 
                  src="/lovable-uploads/9f2d3d71-10e3-487e-8e02-de14d44ce950.png?v=1" 
                  alt="Golfer with Trackman technology"
                  className="absolute inset-0 w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    console.error('Failed to load Handicap image');
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-black/25 rounded-lg"></div>
              </>
            )}
            
            {/* Content */}
            <div className="relative p-8 cursor-pointer group">
              <div className="flex items-center mb-3">
                <h3 className="text-3xl font-bold group-hover:scale-105 transition-transform">{card.title}</h3>
              </div>
              <p className="text-white/90 text-lg leading-relaxed">{card.description}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Mobile: Show carousel with peek effect
  return (
    <div className="relative -mx-4">
      <div 
        ref={swipeRef}
        className="overflow-hidden px-4"
      >
        <div 
          className="flex transition-transform duration-300 ease-out gap-4"
          style={{ transform: `translateX(-${currentIndex * (100 - 15)}%)` }}
        >
          {cards.map((card, index) => (
            <div
              key={card.id}
              className={`${card.className} flex-shrink-0 ${
                index === currentIndex ? 'w-[85%]' : 'w-[85%] opacity-60 scale-95'
              } transition-all duration-300`}
              style={{ height: 'clamp(180px, 28vw, 250px)' }}
              onClick={() => handleCardClick(card.id)}
            >
              {/* Activity background image */}
              {card.id === 'activity' && (
                <>
                  <img 
                    src="/lovable-uploads/88578314-636a-402e-8435-ad54169af886.png?v=1" 
                    alt="Golf course at sunset with ocean view"
                    className="absolute inset-0 w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      console.error('Failed to load Activity image');
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/25 rounded-lg"></div>
                </>
              )}

              {/* Top 100 background image */}
              {card.id === 'top100' && (
                <>
                  <img 
                    src="/lovable-uploads/a8a80045-1c4d-4933-9a97-55d3cb2fa17b.png?v=1" 
                    alt="Coastal golf course with dramatic cliffs"
                    className="absolute inset-0 w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      console.error('Failed to load Top 100 image');
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/25 rounded-lg"></div>
                </>
              )}
              
              {/* Handicap background image */}
              {card.id === 'handicap' && (
                <>
                  <img 
                    src="/lovable-uploads/9f2d3d71-10e3-487e-8e02-de14d44ce950.png?v=1" 
                    alt="Golfer with Trackman technology"
                    className="absolute inset-0 w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      console.error('Failed to load Handicap image');
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/25 rounded-lg"></div>
                </>
              )}
              
              {/* Content */}
              <div className="relative p-8 cursor-pointer group">
                <div className="flex items-center mb-3">
                  <h3 className="text-3xl font-bold">{card.title}</h3>
                </div>
                <p className="text-white/90 text-lg leading-relaxed">{card.description}</p>
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
              index === currentIndex ? 'bg-black' : 'bg-black/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default ProfileSectionCarousel;