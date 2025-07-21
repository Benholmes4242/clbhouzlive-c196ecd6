import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Globe, MapPin, Crown, Star } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import GBITestModal from '@/components/courses/GBITestModal';
import gbiGolfCourse from '@/assets/gbi-golf-course.jpg';

const courseListData = [
  {
    id: 'global',
    title: 'Global Top 100',
    icon: Globe,
    description: 'The world\'s greatest golf courses',
    color: '',
    backgroundImage: '/lovable-uploads/bd96819b-505e-4a35-b242-d106babe5179.png'
  },
  {
    id: 'gbi',
    title: 'GB&I Top 100',
    description: 'Great Britain & Ireland\'s finest',
    color: '',
    backgroundImage: gbiGolfCourse
  },
  {
    id: 'europe',
    title: 'Europe Top 100',
    icon: Star,
    description: 'Continental Europe\'s best courses',
    color: 'bg-gradient-to-br from-purple-500 to-purple-600'
  },
  {
    id: 'usa',
    title: 'USA Top 100',
    icon: MapPin,
    description: 'America\'s premier golf destinations',
    color: 'bg-gradient-to-br from-red-500 to-red-600'
  }
];

const Top100CourseLists = () => {
  const [isGBIModalOpen, setIsGBIModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleCardClick = (listId: string) => {
    if (listId === 'gbi') {
      setIsGBIModalOpen(true);
    }
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % courseListData.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + courseListData.length) % courseListData.length);
  };

  const handlers = useSwipeable({
    onSwipedLeft: nextSlide,
    onSwipedRight: prevSlide,
    trackMouse: true
  });

  return (
    <section>
      {/* Mobile Carousel View */}
      <div className="block md:hidden">
        <div {...handlers} className="relative overflow-hidden">
          <div 
            className="flex transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {courseListData.map((list) => {
              const IconComponent = list.icon;
              return (
                <div key={list.id} className="w-full flex-shrink-0">
                  <Card 
                    className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden"
                    onClick={() => handleCardClick(list.id)}
                  >
                    <CardContent className="p-0">
                      {list.backgroundImage ? (
                        // GB&I card with full background image covering entire card
                        <div 
                          className="relative aspect-[4/3] overflow-hidden"
                          style={{
                            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.3)), url(${list.backgroundImage})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          }}
                        >
                          <div className="absolute inset-0 flex flex-col justify-between text-white p-6">
                            <div className="flex-1 flex flex-col justify-center">
                              <div className="relative z-10">
                                <h3 className="text-3xl font-bold mb-1">{list.title}</h3>
                                <p className="text-white/90 text-lg">{list.description}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-lg text-white/80">Click to explore →</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Other cards with gradient background, same layout as GB&I
                        <div className={`${list.color} relative aspect-[4/3] overflow-hidden`}>
                          <div className="absolute inset-0 flex flex-col justify-between text-white p-6">
                            <div className="flex-1 flex flex-col justify-center">
                              <div className="relative z-10">
                                <h3 className="text-3xl font-bold mb-1">{list.title}</h3>
                                <p className="text-white/90 text-lg">{list.description}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-lg text-white/80">Click to explore →</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Carousel Indicators */}
        <div className="flex justify-center mt-6 space-x-2">
          {courseListData.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-primary' : 'bg-muted-foreground/30'
              }`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      </div>

      {/* Desktop Grid View */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-6">
        {courseListData.map((list) => {
          const IconComponent = list.icon;
          return (
            <Card 
              key={list.id} 
              className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden"
              onClick={() => handleCardClick(list.id)}
            >
              <CardContent className="p-0">
                {list.backgroundImage ? (
                  // GB&I card with full background image covering entire card
                  <div 
                    className="relative aspect-[4/3] overflow-hidden"
                    style={{
                      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.3)), url(${list.backgroundImage})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    <div className="absolute inset-0 flex flex-col justify-between text-white p-6">
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="relative z-10">
                          <h3 className="text-3xl font-bold mb-1">{list.title}</h3>
                          <p className="text-white/90 text-lg">{list.description}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-lg text-white/80">Click to explore →</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Other cards with gradient background, same layout as GB&I
                  <div className={`${list.color} relative aspect-[4/3] overflow-hidden`}>
                    <div className="absolute inset-0 flex flex-col justify-between text-white p-6">
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="relative z-10">
                          <h3 className="text-3xl font-bold mb-1">{list.title}</h3>
                          <p className="text-white/90 text-lg">{list.description}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-lg text-white/80">Click to explore →</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <GBITestModal 
        isOpen={isGBIModalOpen} 
        onClose={() => setIsGBIModalOpen(false)} 
      />
    </section>
  );
};

export default Top100CourseLists;