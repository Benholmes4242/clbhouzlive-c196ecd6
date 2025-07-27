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
      backgroundImage: `url('/lovable-uploads/2a145957-bebc-43ef-bd85-1f1343e05210.png')`,
      className: 'relative overflow-hidden flex flex-col justify-end text-white h-32 cursor-pointer group'
    },
    {
      id: 'top100',
      title: 'Top 100 Courses',
      description: 'Discover and track the world\'s greatest golf courses.',
      backgroundImage: `url('/lovable-uploads/b5c44b64-e08d-4c79-b3d0-e15cad97b1b3.png')`,
      className: 'relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-600 flex flex-col justify-end text-white h-32 cursor-pointer group'
    },
    {
      id: 'handicap',
      title: 'Handicap',
      description: 'Track your progress and handicap development over time.',
      className: 'relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-700 flex flex-col justify-end text-white h-32 cursor-pointer group'
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
            style={{ borderRadius: '8px' }}
            onClick={() => handleCardClick(card.id)}
          >
            {/* Background for activity and top100 cards */}
            {card.backgroundImage && (
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: card.backgroundImage }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              </div>
            )}
            
            {/* Handicap special background */}
            {card.id === 'handicap' && (
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent">
                <div className="absolute inset-0" style={{
                  backgroundImage: `
                    conic-gradient(from 0deg at 50% 50%, rgba(255,255,255,0.1) 0deg, transparent 60deg, rgba(255,255,255,0.1) 120deg, transparent 180deg, rgba(255,255,255,0.1) 240deg, transparent 300deg),
                    radial-gradient(circle at 70% 30%, rgba(255,255,255,0.1) 0%, transparent 50%)
                  `,
                  backgroundSize: '80px 80px, 100% 100%'
                }}>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              </div>
            )}
            
            {/* Content */}
            <div className="relative p-8 cursor-pointer group">
              <div className="flex items-center mb-3">
                {card.id === 'handicap' && (
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                      <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/>
                      <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/>
                      <path d="M12 2v2"/>
                      <path d="M12 20v2"/>
                      <path d="M4.93 4.93l1.41 1.41"/>
                      <path d="M17.66 17.66l1.41 1.41"/>
                      <path d="M2 12h2"/>
                      <path d="M20 12h2"/>
                      <path d="M6.34 17.66l-1.41 1.41"/>
                      <path d="M19.07 4.93l-1.41 1.41"/>
                    </svg>
                  </div>
                )}
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
              className={`${card.className} flex-shrink-0 w-full`}
              style={{ borderRadius: '8px' }}
              onClick={() => handleCardClick(card.id)}
            >
              {/* Background for activity and top100 cards */}
              {card.backgroundImage && (
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: card.backgroundImage }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                </div>
              )}
              
              {/* Handicap special background */}
              {card.id === 'handicap' && (
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `
                      conic-gradient(from 0deg at 50% 50%, rgba(255,255,255,0.1) 0deg, transparent 60deg, rgba(255,255,255,0.1) 120deg, transparent 180deg, rgba(255,255,255,0.1) 240deg, transparent 300deg),
                      radial-gradient(circle at 70% 30%, rgba(255,255,255,0.1) 0%, transparent 50%)
                    `,
                    backgroundSize: '80px 80px, 100% 100%'
                  }}>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                </div>
              )}
              
              {/* Content */}
              <div className="relative p-8 cursor-pointer group">
                <div className="flex items-center mb-3">
                  {card.id === 'handicap' && (
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/>
                        <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/>
                        <path d="M12 2v2"/>
                        <path d="M12 20v2"/>
                        <path d="M4.93 4.93l1.41 1.41"/>
                        <path d="M17.66 17.66l1.41 1.41"/>
                        <path d="M2 12h2"/>
                        <path d="M20 12h2"/>
                        <path d="M6.34 17.66l-1.41 1.41"/>
                        <path d="M19.07 4.93l-1.41 1.41"/>
                      </svg>
                    </div>
                  )}
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