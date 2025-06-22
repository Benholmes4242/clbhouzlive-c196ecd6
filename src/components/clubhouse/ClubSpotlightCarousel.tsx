
import React from 'react';
import { UserPlus, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { clubSpotlight } from '@/data/clubhouseFeedData';

const ClubSpotlightCarousel = () => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Club & Business Spotlight</h2>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          View All <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
      <Carousel className="w-full">
        <CarouselContent className="-ml-2 md:-ml-4">
          {clubSpotlight.map((club) => (
            <CarouselItem key={club.id} className="pl-2 md:pl-4 basis-full">
              <div className="bg-card rounded-lg overflow-hidden shadow-sm border">
                <img src={club.image} alt={club.name} className="w-full h-48 object-cover" />
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <img src={club.logo} alt={club.name} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <h3 className="font-semibold">{club.name}</h3>
                      <Badge variant="outline" className="text-xs">Verified</Badge>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-3">{club.post}</p>
                  <Button size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Follow
                  </Button>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden sm:flex" />
        <CarouselNext className="hidden sm:flex" />
      </Carousel>
    </div>
  );
};

export default ClubSpotlightCarousel;
