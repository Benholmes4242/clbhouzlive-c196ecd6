import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Globe, MapPin, Crown, Star } from 'lucide-react';
import GBITestModal from '@/components/courses/GBITestModal';

const courseListData = [
  {
    id: 'global',
    title: 'Global Top 100',
    icon: Globe,
    description: 'The world\'s greatest golf courses',
    color: 'bg-gradient-to-br from-blue-500 to-blue-600'
  },
  {
    id: 'gbi',
    title: 'GB&I Top 100',
    icon: Crown,
    description: 'Great Britain & Ireland\'s finest',
    color: 'bg-gradient-to-br from-gray-900 to-black'
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

  const handleCardClick = (listId: string) => {
    if (listId === 'gbi') {
      setIsGBIModalOpen(true);
    }
  };

  return (
    <section>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {courseListData.map((list) => {
          const IconComponent = list.icon;
          return (
            <Card 
              key={list.id} 
              className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden"
              onClick={() => handleCardClick(list.id)}
            >
              <CardContent className="p-0">
                <div className={`${list.color} p-6 text-white relative overflow-hidden`}>
                  <div className="absolute top-2 right-2 opacity-20">
                    <IconComponent className="h-12 w-12" />
                  </div>
                  <div className="relative z-10">
                    <IconComponent className="h-8 w-8 mb-3" />
                    <h3 className="text-xl font-bold mb-2">{list.title}</h3>
                    <p className="text-white/90 text-sm">{list.description}</p>
                  </div>
                </div>
                <div className="p-4 bg-background group-hover:bg-muted/50 transition-colors">
                  <p className="text-sm text-muted-foreground">Click to explore →</p>
                </div>
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