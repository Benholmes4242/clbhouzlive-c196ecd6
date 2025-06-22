
import React from 'react';
import { Clock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import VideoPreview from '@/components/posts/VideoPreview';
import { featuredMoments } from '@/data/clubhouseFeedData';

const FeaturedMomentsCarousel = () => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Featured Moments</h2>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          View All <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
      <Carousel className="w-full">
        <CarouselContent className="-ml-2 md:-ml-4">
          {featuredMoments.map((moment) => (
            <CarouselItem key={moment.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
              <div className="relative bg-card rounded-lg overflow-hidden shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
                {moment.type === 'video' ? (
                  <VideoPreview
                    src={moment.image}
                    videoId={`featured-${moment.id}`}
                    className="w-full h-48"
                  />
                ) : (
                  <img src={moment.image} alt={moment.title} className="w-full h-48 object-cover" />
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                
                {moment.type === 'video' && (
                  <div className="absolute top-4 right-4 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    {moment.duration}
                  </div>
                )}
                
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="text-base font-semibold mb-1">{moment.title}</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <span>@{moment.user}</span>
                    <Clock className="h-3 w-3" />
                    <span>{moment.timeAgo}</span>
                  </div>
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

export default FeaturedMomentsCarousel;
